export type GameId = 'lure' | 'follow';

export interface Tier {
  id: number; // 1이 최고 등급, 0은 유인 실패
  name: string;
  desc: string;
}

export const LURE_LIMIT = 45; // 초
export const FOLLOW_DURATION = 30; // 초

// api/share.js 와 같은 기준을 쓴다 (tests/share.test.mjs 에서 확인)
export const LURE_THRESHOLDS = [12, 17, 24, 33, LURE_LIMIT];
export const FOLLOW_THRESHOLDS = [90, 75, 55, 35];

const LURE_TIERS: Tier[] = [
  { id: 0, name: '부캉이 승!', desc: '부캉이가 끝까지 버텼어요. 버티기 장인 인정.' },
  { id: 1, name: '해경 특채 1순위', desc: '부캉이도 순순히 따라갔어요. 당장 구조대에 지원하세요!' },
  { id: 2, name: '베테랑 구조대원', desc: '먹이 길 설계가 완벽했어요.' },
  { id: 3, name: '든든한 자원봉사자', desc: '조금 밀당했지만 결국 바다로!' },
  { id: 4, name: '초보 유인 요원', desc: '부캉이 고집을 이겨냈어요.' },
  { id: 5, name: '간신히 성공', desc: '한참 버티던 부캉이가 겨우 나갔어요.' },
];

const FOLLOW_TIERS: Tier[] = [
  { id: 1, name: '인간 GPS', desc: '부캉이가 어디로 가든 다 보고 있었어요.' },
  { id: 2, name: '해경 드론급', desc: '놓친 순간이 거의 없어요.' },
  { id: 3, name: '열혈 부캉이 팬', desc: '눈을 뗄 수가 없었죠?' },
  { id: 4, name: '산책 나온 시민', desc: '가끔 놓쳤지만 즐거웠어요.' },
  { id: 5, name: '부캉이 실종', desc: '부캉이가 너무 빨랐어요!' },
];

export function lureTier(seconds: number | null): Tier {
  if (seconds === null) return LURE_TIERS[0];
  const i = LURE_THRESHOLDS.findIndex((t) => seconds <= t);
  return LURE_TIERS[i === -1 ? 0 : i + 1];
}

export function followTier(percent: number): Tier {
  const i = FOLLOW_THRESHOLDS.findIndex((t) => percent >= t);
  return FOLLOW_TIERS[i === -1 ? FOLLOW_TIERS.length - 1 : i];
}

export interface GameResult {
  game: GameId;
  // lure: 성공 시간(초, 소수 1자리) 또는 실패 시 null / follow: 추적률(%)
  score: number | null;
  tier: Tier;
}
