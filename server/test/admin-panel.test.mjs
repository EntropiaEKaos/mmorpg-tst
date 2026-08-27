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


test('admin panel supports read-only catalogs without fake mutation controls', () => {
  const html = adminPanelHTML();
  assert.equal(html.includes('data.readOnly === true'), true);
  assert.equal(html.includes('READ-ONLY CATALOG'), true);
  assert.equal(html.includes("if (!readOnly) html += '<button class=\"btn btn-amber\""), true);
  assert.equal(html.includes("if (readOnly) html += '<td><span class=\"readonly-label\">Catalog only</span>"), true);
});
