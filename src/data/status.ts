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

export interface NextEvent {
  date: string;
  time: string | null; // 시작 시각(KST). 이 시각부터 몇 시간은 화면에 "작전 진행 중"으로 보인다
  title: string;
}

export const STATUS = {
  mode: 'extended' as Mode,
  firstSeen: '2026-09-18',
  // 바다로 돌아간 날 (mode === 'released' 일 때)
  releasedOn: null as string | null,
  // 예정된 작전. 없으면 null 로 두고 plan 을 보여 준다
  nextEvent: null as NextEvent | null,
  plan: '수로 출구 근처에 그물을 고정해 두고 스스로 바다로 나가기를 기다리는 중',
  updatedAt: '2026-10-02T19:40:00+09:00',
};

// 부캉이에게는 위치 추적 장치가 없다. 지도에는 보도된 체류 장소를 "일대"로만 표시하고,
// 실시간 위치는 현장 관람객 제보(api/sightings.js)로 추정한다.
export const LOCATION = {
  name: '북항 친수공원 경관수로',
  address: '부산 동구 이순신대로 164',
  lat: 35.1144,
  lng: 129.0464,
  radiusM: 350,
  // 보도된 최근 위치 설명 (정확한 좌표는 보도되지 않음)
  latest: '10월 2일 작전 뒤 수로 출구 근처, 바다를 100여 m 앞둔 곳',
  access: '도시철도 1호선 부산역 6번 출구에서 걸어서 약 15분',
  source: {
    name: '더트래블뉴스',
    url: 'https://thetravelnews.co.kr/2026/08/busan-north-port-waterfront-park-starlight-waterway/',
  } as Source,
};

// 제보를 받는 범위 (api/sightings.js 의 BOUNDS 와 같아야 한다)
export const SIGHTING_BOUNDS = { minLat: 35.104, maxLat: 35.125, minLng: 129.034, maxLng: 129.06 };

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
    date: '2026-09-25',
    title: '추석 연휴 첫날 10만 2천 명',
    body: '연휴 첫날 하루에만 약 10만 2천 명이 부캉이를 보러 북항을 찾았어요.',
    source: {
      name: '파이낸셜뉴스',
      url: 'https://www.fnnews.com/news/202609250928248871',
    },
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
    title: '2차 그물 유도 작전, 바다 100여 m 앞에서 중단',
    body: '길이 50m·높이 6.8m 그물로 부캉이를 수로 출구 쪽까지 밀었지만, 바다를 100~150m 앞두고 그물이 수로 바닥에 걸려 작업이 멈췄어요. 관계기관은 그물을 고정해 안쪽으로 돌아오지 못하게 막고, 부캉이가 스스로 나가기를 기다리기로 했어요.',
    source: {
      name: '세계일보',
      url: 'https://www.segye.com/newsView/20261002514370',
    },
  },
];
