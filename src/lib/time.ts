const DAY = 86_400_000;
const KST_OFFSET = 9 * 3_600_000;

// 한국 시간 기준 날짜(자정)의 일련번호
function kstDayNumber(ms: number): number {
  return Math.floor((ms + KST_OFFSET) / DAY);
}

function dayNumberOf(date: string): number {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY);
}

// 첫날을 1일째로 센다 (뉴스 표기와 같음)
export function dayCount(from: string, now = Date.now()): number {
  return kstDayNumber(now) - dayNumberOf(from) + 1;
}

// 목표일까지 남은 날 (당일 0, 지나면 음수)
export function daysUntil(date: string, now = Date.now()): number {
  return dayNumberOf(date) - kstDayNumber(now);
}

export function formatDate(date: string): string {
  const [, m, d] = date.split('-').map(Number);
  const dow = '일월화수목금토'[new Date(`${date}T00:00:00Z`).getUTCDay()];
  return `${m}월 ${d}일 (${dow})`;
}

export function formatUpdated(iso: string): string {
  const t = new Date(Date.parse(iso) + KST_OFFSET);
  const hh = String(t.getUTCHours()).padStart(2, '0');
  const mm = String(t.getUTCMinutes()).padStart(2, '0');
  return `${t.getUTCMonth() + 1}/${t.getUTCDate()} ${hh}:${mm}`;
}
