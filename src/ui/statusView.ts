import { LOCATION, MODE_TEXT, PROFILE, STATUS, TIMELINE } from '../data/status.ts';
import { dayCount, daysUntil, formatDate, formatUpdated } from '../lib/time.ts';

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export interface StatusView {
  mode: string;
  badge: string;
  line: string;
  dayLabel: string;
  dayCount: string;
  dayUnit: string;
  updated: string;
  nextTitle: string;
  nextDate: string;
  nextDday: string;
}

export function statusView(now = Date.now()): StatusView {
  const { mode, firstSeen, releasedOn, nextEvent } = STATUS;
  const text = MODE_TEXT[mode];
  const base = {
    mode,
    badge: text.badge,
    line: text.line,
    updated: formatUpdated(STATUS.updatedAt),
  };

  if (mode === 'released' && releasedOn) {
    const since = dayCount(releasedOn, now) - 1;
    const stayed = dayCount(firstSeen, Date.parse(`${releasedOn}T12:00:00+09:00`));
    return {
      ...base,
      dayLabel: since === 0 ? '오늘' : '바다로 돌아간 지',
      dayCount: since === 0 ? '바다로' : String(since),
      dayUnit: since === 0 ? ' 돌아갔어요' : '일',
      nextTitle: '북항에 머문 기간',
      nextDate: `${formatDate(firstSeen)} ~ ${formatDate(releasedOn)}`,
      nextDday: `${stayed}일`,
    };
  }

  const left = daysUntil(nextEvent.date, now);
  return {
    ...base,
    dayLabel: '북항 수로 체류',
    dayCount: String(dayCount(firstSeen, now)),
    dayUnit: '일째',
    nextTitle: `${nextEvent.title}${left >= 0 ? ' (예정)' : ''}`,
    nextDate: formatDate(nextEvent.date),
    nextDday: left > 0 ? `D-${left}` : left === 0 ? 'D-DAY' : '결과 확인 중',
  };
}

export function profileHtml(): string {
  return PROFILE.map(([k, v]) => `<div><dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd></div>`).join('');
}

export function timelineHtml(): string {
  return TIMELINE.map(
    (t) => `<li${t.planned ? ' class="planned"' : ''}>
  <time datetime="${t.date}">${formatDate(t.date)}${t.planned ? ' <em>예정</em>' : ''}</time>
  <strong>${escapeHtml(t.title)}</strong>
  <p>${escapeHtml(t.body)}</p>
  <a href="${escapeHtml(t.source.url)}" target="_blank" rel="noopener">출처: ${escapeHtml(t.source.name)}</a>
</li>`,
  ).join('');
}

const PLACE = '북항 친수공원';

export const MAP_LINKS = {
  kakaoRoute: `https://map.kakao.com/link/to/${encodeURIComponent(PLACE)},${LOCATION.lat},${LOCATION.lng}`,
  naverSearch: `https://map.naver.com/p/search/${encodeURIComponent(PLACE)}`,
};

// 자주 묻는 질문. 날마다 바뀌는 숫자(며칠째)는 넣지 않는다 — 빌드 시점에 HTML에 박히기 때문.
export function faqItems(now = Date.now()): [string, string][] {
  const { mode, releasedOn, nextEvent, firstSeen } = STATUS;
  const released = mode === 'released' && releasedOn;
  const left = daysUntil(nextEvent.date, now);
  return [
    [
      '부캉이는 지금 어디에 있어요?',
      released
        ? `${formatDate(releasedOn)}에 ${LOCATION.name}을 빠져나가 바다로 돌아갔어요.`
        : `언론 보도 기준으로 ${LOCATION.address} ${LOCATION.name}에 ${formatDate(firstSeen)}부터 머물고 있어요. 이 페이지 지도에서 현장 관람객 제보도 함께 볼 수 있어요.`,
    ],
    [
      '부캉이 보러 어떻게 가요?',
      `${LOCATION.address} ${PLACE}이에요. ${LOCATION.access}(관광 정보 기준)이에요. 현장 안전요원과 통제선 안내를 꼭 따라 주세요.`,
    ],
    [
      '부캉이는 언제 바다로 돌아가요?',
      released
        ? '이미 바다로 돌아갔어요.'
        : left >= 0
          ? `${formatDate(nextEvent.date)}에 ${nextEvent.title}이 예정돼 있어요. 결과가 나오면 이 페이지에 바로 반영해요.`
          : `${formatDate(nextEvent.date)} ${nextEvent.title} 결과를 확인하고 있어요.`,
    ],
    ['부캉이라는 이름은 무슨 뜻이에요?', "'부산 북항'에서 따온 애칭이에요. 부산시는 부캉이를 명예홍보대사로 위촉했어요."],
    [
      '지도 위치는 실시간이에요?',
      '부캉이에게는 위치 추적 장치가 없어요. 지도에는 언론 보도로 확인된 체류 장소와, 현장 관람객이 직접 찍은 목격 제보(확인되지 않은 정보)를 함께 보여 줘요.',
    ],
  ];
}

export function faqHtml(now = Date.now()): string {
  return faqItems(now)
    .map(([q, a]) => `<details><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`)
    .join('');
}

export function jsonLd(siteUrl: string, now = Date.now()): string {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', name: '부캉이 트래커', url: `${siteUrl}/`, inLanguage: 'ko' },
      {
        '@type': 'FAQPage',
        mainEntity: faqItems(now).map(([q, a]) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
