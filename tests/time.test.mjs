import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dayCount, daysUntil, formatDate } from '../src/lib/time.ts';

test('day counts follow Korean time', () => {
  const at = (s) => Date.parse(s);
  assert.equal(dayCount('2026-09-18', at('2026-09-18T00:10:00+09:00')), 1);
  assert.equal(dayCount('2026-09-18', at('2026-09-29T12:00:00+09:00')), 12);
  assert.equal(dayCount('2026-09-18', at('2026-09-30T23:59:00+09:00')), 13);
  assert.equal(dayCount('2026-09-18', at('2026-10-01T00:01:00+09:00')), 14);
  assert.equal(daysUntil('2026-10-02', at('2026-09-30T09:00:00+09:00')), 2);
  assert.equal(daysUntil('2026-10-02', at('2026-10-02T08:00:00+09:00')), 0);
  assert.equal(daysUntil('2026-10-02', at('2026-10-03T08:00:00+09:00')), -1);
  assert.equal(formatDate('2026-10-02'), '10월 2일 (금)');
});
