import { COUPANG_DISCLOSURE, CONFIG } from '../config.ts';
import { escapeHtml } from '../ui/statusView.ts';

const ADFIT_SRC = 'https://t1.daumcdn.net/kas/static/ba.min.js';

// 카카오 애드핏 광고 단위를 슬롯에 넣는다. 광고 ID가 없으면 슬롯을 숨긴다.
export function mountAd(slot: HTMLElement, unitId: string): void {
  slot.replaceChildren();
  if (!unitId) {
    slot.hidden = true;
    return;
  }
  slot.hidden = false;
  const label = document.createElement('p');
  label.className = 'ad-label';
  label.textContent = '광고';
  const ins = document.createElement('ins');
  ins.className = 'kakao_ad_area';
  ins.style.display = 'none';
  ins.dataset.adUnit = unitId;
  ins.dataset.adWidth = '320';
  ins.dataset.adHeight = '100';
  const script = document.createElement('script');
  script.async = true;
  script.src = ADFIT_SRC;
  slot.append(label, ins, script);
}

export function mountGoods(section: HTMLElement): void {
  if (!CONFIG.goods.length) return;
  section.hidden = false;
  section.querySelector('#goods-disclosure')!.textContent = COUPANG_DISCLOSURE;
  section.querySelector('#goods-list')!.innerHTML = CONFIG.goods
    .map(
      (g) =>
        `<a class="goods-item" href="${escapeHtml(g.url)}" target="_blank" rel="sponsored noopener"><span aria-hidden="true">${escapeHtml(g.emoji ?? '🦈')}</span>${escapeHtml(g.label)}</a>`,
    )
    .join('');
}
