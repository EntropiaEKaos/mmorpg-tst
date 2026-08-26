import test from 'node:test';
import assert from 'node:assert/strict';
import { adminPanelHTML } from '../adminPanel.mjs';

test('admin panel escapes persisted content and avoids raw IDs in inline handlers', () => {
  const html = adminPanelHTML();
  assert.match(html, /function escapeHtml\(value\)/);
  assert.match(html, /escapeHtml\(displayValue\(item\?\.\[f\]\)\)/);
  assert.match(html, /onclick="editRow\(' \+ index \+ '\)"/);
  assert.match(html, /onclick="deleteRow\(' \+ index \+ '\)"/);
  assert.match(html, /encodeURIComponent\(id\)/);
  assert.doesNotMatch(html, /event\.target/);
  assert.doesNotMatch(html, /editing=\\'' \+ item\.id/);
  assert.doesNotMatch(html, /del\(\\'' \+ item\.id/);
});

test('admin tab navigation passes the clicked element explicitly', () => {
  const html = adminPanelHTML();
  assert.match(html, /showTab\('dashboard', this\)/);
  assert.match(html, /function showTab\(tab, button\)/);
  assert.match(html, /button instanceof HTMLElement/);
});
