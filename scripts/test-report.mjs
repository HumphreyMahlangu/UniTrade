#!/usr/bin/env node
// Generates the "Test Report" section of docs/EVIDENCE.md from REAL JUnit XML results.
//
// Usage (from repo root, after running the tests):
//   node scripts/test-report.mjs
//   node scripts/test-report.mjs --dir some/other/results/folder --evidence docs/EVIDENCE.md
//
// Reads: Maven Surefire (target/surefire-reports), Gradle (build/test-results/test),
//        Vitest/Jest JUnit output (frontend/test-results). Any *.xml in those folders.
// Writes: only between the TEST-REPORT and TEST-HISTORY markers in docs/EVIDENCE.md.
// If no result files exist it exits with an error and writes NOTHING (no invented results).
//
// Requirement mapping: put the requirement ID in the test method or class name,
// e.g. fr1_01_registerRejectsNonStudentEmail  or  class Fr3SearchTest  or  nfr2_01_searchUnderTwoSeconds.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const extraDirs = args.reduce((acc, a, i) => (a === '--dir' && args[i + 1] ? [...acc, args[i + 1]] : acc), []);
const evidencePath = getArg('--evidence', 'docs/EVIDENCE.md');

const defaultDirs = [
  'backend/target/surefire-reports',
  'target/surefire-reports',
  'backend/build/test-results/test',
  'build/test-results/test',
  'frontend/test-results',
];
const dirs = [...defaultDirs, ...extraDirs].filter((d) => fs.existsSync(d) && fs.statSync(d).isDirectory());

const files = [];
for (const d of dirs) {
  for (const f of fs.readdirSync(d)) {
    if (f.toLowerCase().endsWith('.xml')) files.push(path.join(d, f));
  }
}
if (files.length === 0) {
  console.error('ERROR: No JUnit XML result files found in: ' + [...defaultDirs, ...extraDirs].join(', '));
  console.error('Run the tests first (e.g. "cd backend && ./mvnw test"). Nothing was written.');
  process.exit(1);
}

const decode = (s) =>
  s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#10;/g, ' ').replace(/&amp;/g, '&');
const parseAttrs = (s) => {
  const o = {};
  for (const m of s.matchAll(/([\w:.-]+)="([^"]*)"/g)) o[m[1]] = decode(m[2]);
  return o;
};

const tests = [];
for (const file of files) {
  const xml = fs.readFileSync(file, 'utf8');
  for (const m of xml.matchAll(/<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const a = parseAttrs(m[1]);
    const inner = m[2] || '';
    let result = 'PASS';
    let detail = '';
    const fail = inner.match(/<(failure|error)\b([^>]*)>/);
    if (fail) {
      result = 'FAIL';
      detail = parseAttrs(fail[2]).message || fail[1];
    } else if (/<skipped\b/.test(inner)) {
      result = 'SKIPPED';
    }
    const name = a.name || '(unnamed)';
    const cls = a.classname || path.basename(file);
    const idMatch = (name + ' ' + cls).match(/(n?fr)[_-]?(\d{1,2})/i);
    const reqId = idMatch ? idMatch[1].toUpperCase() + idMatch[2] : '—';
    // Java classnames are package-qualified (strip the package); JS test files keep their file name.
    const shortCls = /\.(jsx?|tsx?|mjs|cjs)$/i.test(cls) ? cls : cls.split('.').pop();
    tests.push({ reqId, name, cls: shortCls, result, time: parseFloat(a.time || '0') || 0, detail });
  }
}
if (tests.length === 0) {
  console.error('ERROR: result files were found but contained no <testcase> entries. Nothing was written.');
  process.exit(1);
}

const count = (r) => tests.filter((t) => t.result === r).length;
const passed = count('PASS'), failed = count('FAIL'), skipped = count('SKIPPED');
const totalTime = tests.reduce((s, t) => s + t.time, 0);
const now = new Date();
const stamp = now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

const reqIds = [...new Set(tests.map((t) => t.reqId))].sort((a, b) => {
  if (a === '—') return 1; if (b === '—') return -1;
  return a.localeCompare(b, undefined, { numeric: true });
});
const esc = (s) => String(s).replace(/\|/g, '\\|');

let md = '';
md += `**Generated:** ${stamp} · **Machine:** ${os.platform()} ${os.release()} · **Node:** ${process.version}\n\n`;
md += `**Result files read:** ${files.length} (${dirs.join(', ')})\n\n`;
md += `| Total tests | Passed | Failed | Skipped | Pass rate | Total time |\n|---|---|---|---|---|---|\n`;
md += `| ${tests.length} | ${passed} | ${failed} | ${skipped} | ${((passed / tests.length) * 100).toFixed(1)}% | ${totalTime.toFixed(2)} s |\n\n`;
md += `### Results by requirement\n\n| Requirement | Tests | Passed | Failed | Skipped |\n|---|---|---|---|---|\n`;
for (const id of reqIds) {
  const ts = tests.filter((t) => t.reqId === id);
  md += `| ${id === '—' ? 'Unmapped (no FR/NFR id in name)' : id} | ${ts.length} | ${ts.filter((t) => t.result === 'PASS').length} | ${ts.filter((t) => t.result === 'FAIL').length} | ${ts.filter((t) => t.result === 'SKIPPED').length} |\n`;
}
md += `\n### All automated test cases\n\n| Req | Test | Class | Result | Time (s) |\n|---|---|---|---|---|\n`;
for (const t of tests.sort((a, b) => a.reqId.localeCompare(b.reqId, undefined, { numeric: true }) || a.name.localeCompare(b.name))) {
  md += `| ${t.reqId} | ${esc(t.name)} | ${esc(t.cls)} | ${t.result} | ${t.time.toFixed(3)} |\n`;
}
const failures = tests.filter((t) => t.result === 'FAIL');
if (failures.length) {
  md += `\n### Failures (as reported by the test run)\n\n`;
  for (const t of failures) md += `- **${t.reqId} ${esc(t.name)}** (${esc(t.cls)}): ${esc(t.detail).slice(0, 300)}\n`;
}

// ---- write into EVIDENCE.md between markers
if (!fs.existsSync(evidencePath)) {
  console.error(`ERROR: ${evidencePath} not found. Nothing was written.`);
  process.exit(1);
}
let doc = fs.readFileSync(evidencePath, 'utf8');
const replaceBlock = (text, name, body) => {
  const re = new RegExp(`(<!-- ${name}:START -->)[\\s\\S]*?(<!-- ${name}:END -->)`);
  if (!re.test(text)) throw new Error(`Marker <!-- ${name}:START/END --> missing in ${evidencePath}`);
  return text.replace(re, `$1\n${body}\n$2`);
};
doc = replaceBlock(doc, 'TEST-REPORT', md);

// history (append one row per run, keep the last 40)
const histRe = /<!-- TEST-HISTORY:START -->([\s\S]*?)<!-- TEST-HISTORY:END -->/;
const hm = doc.match(histRe);
if (!hm) throw new Error(`Marker <!-- TEST-HISTORY:START/END --> missing in ${evidencePath}`);
const header = '| Run (UTC) | Total | Passed | Failed | Skipped |\n|---|---|---|---|---|';
const rows = hm[1].split('\n').filter((l) => /^\| \d{4}-\d{2}-\d{2}/.test(l));
rows.push(`| ${stamp} | ${tests.length} | ${passed} | ${failed} | ${skipped} |`);
doc = replaceBlock(doc, 'TEST-HISTORY', header + '\n' + rows.slice(-40).join('\n'));

fs.writeFileSync(evidencePath, doc);
console.log(`Test report written to ${evidencePath}: ${tests.length} tests, ${passed} passed, ${failed} failed, ${skipped} skipped.`);
process.exit(0);
