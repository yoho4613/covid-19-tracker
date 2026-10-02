import type { FeatureCollection } from 'geojson';
import type { GeoJSONSource, Map as MlMap, Marker } from 'maplibre-gl';
import { LOCATION, SIGHTING_BOUNDS, STATUS } from '../data/status.ts';
import { getSightings, reportSighting, type Sighting } from '../lib/api.ts';
import { track } from '../lib/track.ts';

// 부캉이 위치 지도. 보도된 체류 장소를 범위로 보여 주고, 현장 제보가 모이면
// 최근 30분 제보의 중앙값 위치를 "제보 기반 추정 위치"로 표시한다.

const STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const ESTIMATE_WINDOW_MS = 30 * 60 * 1000;
const ESTIMATE_MIN = 3;
const REFRESH_MS = 30_000;

interface Estimate {
  lat: number;
  lng: number;
  count: number;
}

export function median(values: number[]): number {
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

export function estimate(list: Sighting[], now: number): Estimate | null {
  const recent = list.filter((s) => now - s.t <= ESTIMATE_WINDOW_MS);
  if (recent.length < ESTIMATE_MIN) return null;
  return { lat: median(recent.map((s) => s.lat)), lng: median(recent.map((s) => s.lng)), count: recent.length };
}

function circle(lat: number, lng: number, radiusM: number, steps = 64): [number, number][] {
  const dLat = radiusM / 111_320;
  const dLng = radiusM / (111_320 * Math.cos((lat * Math.PI) / 180));
  const ring: [number, number][] = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2;
    ring.push([lng + dLng * Math.cos(a), lat + dLat * Math.sin(a)]);
  }
  return ring;
}

function minutesAgo(t: number, now: number): string {
  const m = Math.max(0, Math.round((now - t) / 60_000));
  return m < 1 ? '방금' : `${m}분 전`;
}

function sharkMarkerEl(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'shark-marker';
  el.innerHTML = '<span class="pulse"></span><span class="pin" aria-hidden="true">🦈</span>';
  return el;
}

export class MapView {
  private map: MlMap | null = null;
  private marker: Marker | null = null;
  private reportMode = false;
  private sightings: Sighting[] = [];
  private serverNow = Date.now();
  private enabled = false;
  private refreshTimer = 0;
  private readonly released = STATUS.mode === 'released';

  constructor(
    private readonly el: HTMLElement,
    private readonly summary: HTMLElement,
    private readonly reportBox: HTMLElement,
    private readonly reportBtn: HTMLButtonElement,
    private readonly reportStatus: HTMLElement,
  ) {
    this.renderSummary();
    reportBtn.addEventListener('click', () => this.toggleReport());
    // 화면에 가까워질 때만 지도 라이브러리를 불러온다
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void this.load();
        }
      },
      { rootMargin: '300px' },
    );
    io.observe(el);
    void this.refresh();
  }

  private async load(): Promise<void> {
    try {
      // maplibre-gl 은 UMD 번들이라 번들러에 따라 default 아래에 들어올 수 있다
      const mod = await import('maplibre-gl');
      const ml = mod.default ?? mod;
      await import('maplibre-gl/dist/maplibre-gl.css');
      const map = new ml.Map({
        container: this.el,
        style: STYLE,
        center: [LOCATION.lng, LOCATION.lat],
        zoom: 14.6,
        minZoom: 12,
        maxZoom: 18,
        attributionControl: { compact: true },
        cooperativeGestures: true,
      });
      this.map = map;
      map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right');
      let loaded = false;
      // 스타일을 못 불러오면(차단·오프라인) 빈 지도 대신 안내를 보여 준다
      map.on('error', (e) => {
        console.warn('map error', e?.error?.message);
        if (!loaded) this.fallback();
      });

      map.on('load', () => {
        loaded = true;
        this.koreanLabels();
        map.addSource('area', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Polygon', coordinates: [circle(LOCATION.lat, LOCATION.lng, LOCATION.radiusM)] },
          },
        });
        map.addLayer({ id: 'area-fill', type: 'fill', source: 'area', paint: { 'fill-color': '#1f8ac0', 'fill-opacity': 0.12 } });
        map.addLayer({
          id: 'area-line',
          type: 'line',
          source: 'area',
          paint: { 'line-color': '#1f8ac0', 'line-width': 2, 'line-dasharray': [2, 2] },
        });
        map.addSource('sightings', { type: 'geojson', data: this.sightingsGeoJSON() });
        map.addLayer({
          id: 'sightings',
          type: 'circle',
          source: 'sightings',
          paint: {
            'circle-radius': 7,
            'circle-color': '#ff6b4a',
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2,
            'circle-opacity': ['get', 'opacity'],
            'circle-stroke-opacity': ['get', 'opacity'],
          },
        });
        this.marker = new ml.Marker({ element: sharkMarkerEl() }).setLngLat([LOCATION.lng, LOCATION.lat]).addTo(map);
        this.placeMarker();
      });

      map.on('click', (e) => {
        if (!this.reportMode) return;
        const { lat, lng } = e.lngLat;
        const b = SIGHTING_BOUNDS;
        if (lat < b.minLat || lat > b.maxLat || lng < b.minLng || lng > b.maxLng) {
          this.setReportStatus('북항 친수공원 근처만 제보할 수 있어요.');
          return;
        }
        void this.submit(lat, lng);
      });
    } catch (err) {
      console.warn('map unavailable', err);
      this.fallback();
    }
  }

  private fallback(): void {
    this.map?.remove();
    this.map = null;
    this.marker = null;
    this.el.innerHTML = '<p class="map-fallback">지도를 불러오지 못했어요. 아래 지도 앱 링크로 위치를 확인해 주세요.</p>';
  }

  // 지도 글자를 한국어 이름 우선으로 바꾼다
  private koreanLabels(): void {
    const map = this.map!;
    for (const layer of map.getStyle().layers ?? []) {
      if (layer.type === 'symbol' && map.getLayoutProperty(layer.id, 'text-field') !== undefined) {
        map.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', 'name:ko'], ['get', 'name']]);
      }
    }
  }

  private sightingsGeoJSON(): FeatureCollection {
    return {
      type: 'FeatureCollection',
      features: this.sightings.map((s) => ({
        type: 'Feature',
        properties: { opacity: Math.max(0.25, 1 - (this.serverNow - s.t) / (60 * 60_000)) },
        geometry: { type: 'Point', coordinates: [s.lng, s.lat] },
      })),
    };
  }

  private async refresh(): Promise<void> {
    clearTimeout(this.refreshTimer);
    if (this.released) return;
    const data = await getSightings();
    this.enabled = !!data;
    this.reportBox.hidden = !this.enabled;
    if (data) {
      this.sightings = data.sightings;
      this.serverNow = data.now;
      (this.map?.getSource('sightings') as GeoJSONSource | undefined)?.setData(this.sightingsGeoJSON());
      this.placeMarker();
      this.refreshTimer = window.setTimeout(() => void this.refresh(), REFRESH_MS);
    }
    this.renderSummary();
  }

  private placeMarker(): void {
    const est = this.released ? null : estimate(this.sightings, this.serverNow);
    this.marker?.setLngLat(est ? [est.lng, est.lat] : [LOCATION.lng, LOCATION.lat]);
  }

  private renderSummary(): void {
    if (this.released) {
      this.summary.innerHTML = `<b>마지막 확인 위치</b> ${LOCATION.name} · 지금은 바다로 돌아갔어요`;
      return;
    }
    const est = estimate(this.sightings, this.serverNow);
    const lines = [`<b>보도 기준</b> ${LOCATION.latest}`];
    if (this.enabled) {
      const last = this.sightings.at(-1);
      lines.push(
        est
          ? `<b>제보 기반 추정</b> 최근 30분 제보 ${est.count}건이 모인 곳에 🦈 표시`
          : `<b>현장 제보</b> 최근 1시간 ${this.sightings.length}건${last ? ` · 마지막 제보 ${minutesAgo(last.t, this.serverNow)}` : ''}`,
      );
    }
    this.summary.innerHTML = lines.map((l) => `<span>${l}</span>`).join('');
  }

  private toggleReport(): void {
    this.reportMode = !this.reportMode;
    this.reportBtn.textContent = this.reportMode ? '제보 취소' : '지도에서 본 위치 찍기';
    this.el.classList.toggle('reporting', this.reportMode);
    this.setReportStatus(this.reportMode ? '부캉이를 본 곳을 지도에서 한 번 눌러 주세요.' : '');
    if (this.reportMode) this.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  private setReportStatus(msg: string): void {
    this.reportStatus.textContent = msg;
  }

  private async submit(lat: number, lng: number): Promise<void> {
    this.reportMode = false;
    this.el.classList.remove('reporting');
    this.reportBtn.textContent = '지도에서 본 위치 찍기';
    this.setReportStatus('보내는 중…');
    const r = await reportSighting(lat, lng);
    if (r === 'ok') {
      this.setReportStatus('제보 고마워요! 지도에 반영됐어요.');
      track('sighting');
      this.sightings.push({ t: this.serverNow + 1, lat, lng });
      (this.map?.getSource('sightings') as GeoJSONSource | undefined)?.setData(this.sightingsGeoJSON());
      this.placeMarker();
      this.renderSummary();
    } else if (r === 'too-soon') {
      this.setReportStatus('제보는 2분에 한 번만 할 수 있어요.');
    } else {
      this.setReportStatus('제보를 보내지 못했어요. 잠시 뒤에 다시 시도해 주세요.');
    }
  }
}
