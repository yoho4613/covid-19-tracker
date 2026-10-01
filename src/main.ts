import './styles.css';
import { CONFIG } from './config.ts';
import type { GameId } from './game/tiers.ts';
import { mountAd, mountGoods } from './lib/ads.ts';
import { addCheer, getStats } from './lib/api.ts';
import { track } from './lib/track.ts';
import { copyText } from './lib/share.ts';
import { GameView } from './ui/gameView.ts';
import { MapView } from './ui/mapView.ts';
import { statusView } from './ui/statusView.ts';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const fmt = (n: number) => n.toLocaleString('ko-KR');

function renderStatus(): void {
  const v = statusView();
  const badge = $('status-badge');
  badge.textContent = v.badge;
  badge.dataset.mode = v.mode;
  $('status-line').textContent = v.line;
  $('day-label').textContent = v.dayLabel;
  $('day-count').textContent = v.dayCount;
  $('day-unit').textContent = v.dayUnit;
  $('updated-at').textContent = v.updated;
  $('next-title').textContent = v.nextTitle;
  $('next-date').textContent = v.nextDate;
  $('next-dday').textContent = v.nextDday;
}

// 응원 버튼
const CHEER_KEY = 'bk-cheers';
let myCheers = 0;
let allCheers: number | null = null;
let allCheerers: number | null = null;
try {
  myCheers = Number(localStorage.getItem(CHEER_KEY)) || 0;
} catch {
  /* 저장소를 못 쓰는 환경 */
}

function renderCheers(): void {
  $('my-cheers').textContent = fmt(myCheers);
  if (allCheers !== null) $('all-cheers').textContent = fmt(allCheers);
  if (allCheerers !== null) $('all-cheerers').textContent = fmt(allCheerers);
}

let firstCheerThisVisit = myCheers === 0;

function cheer(e: MouseEvent): void {
  myCheers++;
  if (allCheers !== null) allCheers++;
  if (firstCheerThisVisit && allCheerers !== null) allCheerers++;
  firstCheerThisVisit = false;
  try {
    localStorage.setItem(CHEER_KEY, String(myCheers));
  } catch {
    /* 무시 */
  }
  addCheer();
  if (myCheers === 1) track('cheer');
  renderCheers();
  const btn = e.currentTarget as HTMLElement;
  const heart = document.createElement('span');
  heart.className = 'float-heart';
  heart.textContent = ['💙', '🦈', '🌊', '🙏', '💦'][myCheers % 5];
  const r = btn.getBoundingClientRect();
  heart.style.left = `${(e.clientX || r.left + r.width / 2) - r.left}px`;
  btn.append(heart);
  setTimeout(() => heart.remove(), 900);
}

async function loadStats(): Promise<void> {
  const s = await getStats();
  if (!s) return;
  allCheers = s.cheers;
  allCheerers = s.cheerers;
  $('all-released').textContent = fmt(s.released);
  document.querySelectorAll<HTMLElement>('.global-only').forEach((el) => (el.hidden = false));
  renderCheers();
}

// 라우팅: #/ 트래커, #/lure, #/follow 게임
const home = $('home');
const gameView = new GameView($('game-view'));
let homeScroll = 0;

function route(): void {
  const id = location.hash.replace(/^#\/?/, '');
  if (id === 'lure' || id === 'follow') {
    if (!home.hidden) homeScroll = window.scrollY;
    home.hidden = true;
    document.body.classList.add('in-game');
    gameView.open(id as GameId);
    window.scrollTo(0, 0);
  } else {
    gameView.close();
    document.body.classList.remove('in-game');
    const wasHidden = home.hidden;
    home.hidden = false;
    if (wasHidden) window.scrollTo(0, homeScroll);
  }
}

// 사이트 자체 공유 (히어로 버튼)
async function shareSite(): Promise<void> {
  const v = statusView();
  const text =
    v.mode === 'released'
      ? '부캉이가 바다로 돌아갔대요 🦈🌊 부캉이 트래커에서 그동안의 기록 보기'
      : `부캉이 지금 북항에서 ${v.dayCount}일째 버티는 중 🦈 위치 지도·현장 제보·미니게임`;
  const url = `${location.origin}/?utm_source=share_home`;
  if (navigator.share) {
    try {
      await navigator.share({ title: '부캉이 트래커', text, url });
      track('share', { game: 'home', method: 'shared' });
      return;
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return;
    }
  }
  const btn = $('share-site');
  if (await copyText(`${text}\n${url}`)) {
    btn.textContent = '링크를 복사했어요!';
    track('share', { game: 'home', method: 'copied' });
    setTimeout(() => (btn.textContent = '친구에게 부캉이 소식 보내기'), 2000);
  }
}

renderStatus();
renderCheers();
$('share-site').addEventListener('click', () => void shareSite());
new MapView(
  $('map'),
  $('map-summary'),
  $('report'),
  $<HTMLButtonElement>('report-btn'),
  $('report-status'),
);
$<HTMLButtonElement>('cheer-btn').addEventListener('click', cheer);
mountAd(document.querySelector<HTMLElement>('.ad-slot[data-ad="home"]')!, CONFIG.adfit.home);
mountGoods($('goods'));
window.addEventListener('hashchange', route);
route();
void loadStats();
