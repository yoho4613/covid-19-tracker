// 부캉이 현재 상태. 뉴스로 확인된 사실만 적고, 바뀌면 이 파일만 고쳐서 배포한다.

export type Mode = 'staying' | 'operation' | 'released' | 'extended';

export interface Source {
  name: string;
  url: string;
}

export interface TimelineItem {
  date: string; // YYYY-MM-DD (KST)
  title: string;
  body: string;
  source: Source;
  planned?: boolean;
}

const FNNEWS: Source = {
  name: '파이낸셜뉴스',
  url: 'https://www.fnnews.com/news/202609291828076938',
};
const HANKOOK: Source = {
  name: '한국일보',
  url: 'https://www.hankookilbo.com/news/article/A2026092915160002503',
};

export const STATUS = {
  mode: 'staying' as Mode,
  firstSeen: '2026-09-18',
  // 바다로 돌아간 날 (mode === 'released' 일 때)
  releasedOn: null as string | null,
  nextEvent: {
    date: '2026-10-02',
    title: '그물 유도 작전',
  },
  updatedAt: '2026-09-30T09:00:00+09:00',
};

export const MODE_TEXT: Record<Mode, { badge: string; line: string }> = {
  staying: { badge: '수로 체류 중', line: '아직 북항 친수공원 수로에 머물고 있어요' },
  operation: { badge: '유도 작전 진행 중', line: '지금 바다로 돌려보내는 작전이 진행되고 있어요' },
  released: { badge: '바다로 귀환', line: '부캉이가 수로를 빠져나가 바다로 돌아갔어요' },
  extended: { badge: '버티기 연장', line: '작전에도 부캉이가 수로를 떠나지 않았어요' },
};

export const PROFILE: [string, string][] = [
  ['이름', '부캉이 (부산 북항 + 상어)'],
  ['첫 발견', '2026년 9월 18일'],
  ['위치', '부산 동구 북항 친수공원 인공 수로'],
  ['직함', '부산시 명예홍보대사'],
  ['다녀간 관람객', '약 60만 명 (9월 28일까지)'],
];

export const TIMELINE: TimelineItem[] = [
  {
    date: '2026-09-18',
    title: '북항 친수공원 수로에서 첫 발견',
    body: '부산 동구 북항 친수공원 인공 수로에서 상어가 처음 목격됐어요.',
    source: FNNEWS,
  },
  {
    date: '2026-09-28',
    title: '누적 관람객 약 60만 명',
    body: '부캉이를 보러 친수공원을 찾은 사람이 약 60만 명에 이르렀어요.',
    source: FNNEWS,
  },
  {
    date: '2026-09-29',
    title: '1차 유도 작전, 부캉이 버티기 성공',
    body: '해경과 소방이 선박으로 물줄기를 뿌리며 바다 쪽으로 유도했지만 부캉이는 수로를 떠나지 않았어요.',
    source: HANKOOK,
  },
  {
    date: '2026-10-02',
    title: '2차 그물 유도 작전',
    body: '수로 폭과 깊이에 맞춘 그물망과 워터펌프로 다시 바다 쪽 유도를 시도할 예정이에요.',
    source: FNNEWS,
    planned: true,
  },
];
