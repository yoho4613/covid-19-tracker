import assert from 'node:assert/strict';
import { test } from 'node:test';

// mapView.ts 는 브라우저 전용 모듈을 불러오므로 추정 로직만 같은 방식으로 확인한다
globalThis.window = { addEventListener() {} };
const { estimate, median } = await import('../src/ui/mapView.ts');

test('estimate needs three recent sightings and uses the median', () => {
  const now = 10_000_000;
  const s = (minAgo, lat, lng) => ({ t: now - minAgo * 60_000, lat, lng });
  assert.equal(estimate([s(1, 35.11, 129.04), s(2, 35.12, 129.05)], now), null);
  // 오래된 제보(40분 전)는 빠진다
  assert.equal(estimate([s(1, 35.11, 129.04), s(2, 35.12, 129.05), s(40, 35.1, 129.0)], now), null);
  const e = estimate([s(1, 35.11, 129.04), s(2, 35.12, 129.05), s(3, 35.113, 129.0465), s(4, 35.124, 129.059)], now);
  assert.equal(e.count, 4);
  assert.equal(e.lat, median([35.11, 35.12, 35.113, 35.124]));
  assert.equal(median([3, 1, 2]), 2);
});
