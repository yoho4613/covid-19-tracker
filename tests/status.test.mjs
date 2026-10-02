import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STATUS } from '../src/data/status.ts';
import { statusView } from '../src/ui/statusView.ts';

const at = (s) => Date.parse(s);

function withStatus(patch, fn) {
  const saved = { ...STATUS };
  Object.assign(STATUS, patch);
  try {
    fn();
  } finally {
    Object.assign(STATUS, saved);
  }
}

test('operation day shows start time, then in-progress, then awaiting result', () => {
  withStatus({ mode: 'staying', nextEvent: { date: '2026-10-02', time: '15:30', title: '그물 유도 작전' } }, () => {
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
});

test('without a scheduled operation the card shows the current plan', () => {
  withStatus({ mode: 'extended', nextEvent: null, plan: '스스로 나가기를 기다리는 중' }, () => {
    const v = statusView(at('2026-10-02T20:00:00+09:00'));
    assert.equal(v.badge, '버티기 연장');
    assert.equal(v.nextTitle, '지금 계획');
    assert.equal(v.nextDate, '스스로 나가기를 기다리는 중');
    assert.equal(v.nextDday, '대기 중');
    assert.equal(v.dayCount, '15');
  });
});
