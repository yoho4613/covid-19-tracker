import assert from 'node:assert/strict';
import { test } from 'node:test';
import { statusView } from '../src/ui/statusView.ts';

const at = (s) => Date.parse(s);

test('operation day shows start time, then in-progress, then awaiting result', () => {
  const before = statusView(at('2026-10-02T13:00:00+09:00'));
  assert.equal(before.nextDday, 'D-DAY');
  assert.equal(before.nextDate, '10월 2일 (금) 오후 3시 30분');
  assert.equal(before.badge, '수로 체류 중');

  const during = statusView(at('2026-10-02T16:00:00+09:00'));
  assert.equal(during.nextDday, '진행 중');
  assert.equal(during.mode, 'operation');
  assert.equal(during.badge, '유도 작전 진행 중');

  const after = statusView(at('2026-10-02T20:00:00+09:00'));
  assert.equal(after.nextDday, '결과 확인 중');
  assert.equal(after.badge, '수로 체류 중');

  assert.equal(statusView(at('2026-10-01T09:00:00+09:00')).nextDday, 'D-1');
});
