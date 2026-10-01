// 광고·제휴·공유 설정. 값이 비어 있으면 해당 영역은 화면에 나오지 않는다.

export interface GoodsItem {
  label: string;
  url: string;
  emoji?: string;
}

export const CONFIG = {
  // 카카오 애드핏 광고 단위 ID (예: 'DAN-xxxxxxxxxxxx')
  adfit: {
    home: '',
    result: '',
  },
  // 쿠팡 파트너스 링크
  goods: [] as GoodsItem[],
  // 카카오 개발자 JavaScript 키 (카카오톡 공유 버튼)
  kakaoJsKey: '',
  // 검색 등록 소유 확인 코드 (meta content 값)
  verification: {
    naver: '',
    google: '',
  },
};

export const COUPANG_DISCLOSURE =
  '이 게시물은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.';
