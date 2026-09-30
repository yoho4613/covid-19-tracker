import { MODE_TEXT, PROFILE, STATUS, TIMELINE } from '../data/status';
import { dayCount, daysUntil, formatDate, formatUpdated } from '../lib/time';

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
