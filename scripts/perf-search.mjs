#!/usr/bin/env node
// Measures REAL response times of the search endpoint under concurrent load (NFR2: search < 2 s).
// No dependencies (Node 18+). Appends one row to the PERF table in docs/EVIDENCE.md.
//
// Examples (backend running, DB seeded with the large "perf" dataset):
//   node scripts/perf-search.mjs --label "cache OFF" --dataset 10000
//   node scripts/perf-search.mjs --label "Redis cache ON" --dataset 10000
//
// Options:
//   --url          default http://localhost:8080/api/listings
//   --concurrency  simultaneous virtual users, default 50
//   --duration     measured seconds, default 30
//   --warmup       seconds before measuring (excluded from stats), default 5
//   --threshold    pass limit in ms for p95, default 2000
//   --dataset      number of listings in the DB (you state it; recorded as-is)
//   --queries      semicolon-separated query strings, e.g. "q=book;category=Textbooks;minPrice=0&maxPrice=500"
//   --label        short name for this run (required)
//   --evidence     default docs/EVIDENCE.md

import fs from 'node:fs';

const args = process.argv.slice(2);
const arg = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : d; };

const url = arg('--url', 'http://localhost:8080/api/listings');
const concurrency = Number(arg('--concurrency', 50));
const duration = Number(arg('--duration', 30));
const warmup = Number(arg('--warmup', 5));
const threshold = Number(arg('--threshold', 2000));
const dataset = arg('--dataset', 'not stated');
const label = arg('--label', '');
const evidencePath = arg('--evidence', 'docs/EVIDENCE.md');
const queries = arg(
  '--queries',
  'q=book;q=laptop;q=chair;q=calculator;category=Textbooks;category=Electronics;minPrice=0&maxPrice=500;q=desk&condition=USED;type=SERVICE;q=phone&minPrice=100&maxPrice=3000'
).split(';').map((s) => s.trim()).filter(Boolean);

if (!label) { console.error('ERROR: --label is required (e.g. --label "cache OFF").'); process.exit(1); }

const lat = [];
let errors = 0, sent = 0;
const startAll = performance.now();
const measureFrom = startAll + warmup * 1000;
const endAt = measureFrom + duration * 1000;
let measuredStart = null, measuredEnd = null;

async function worker(id) {
  let i = id;
  while (performance.now() < endAt) {
    const qs = queries[i++ % queries.length];
    const t0 = performance.now();
    let ok = false;
    try {
      const res = await fetch(`${url}?${qs}`);
      await res.arrayBuffer();
      ok = res.ok;
    } catch { ok = false; }
    const t1 = performance.now();
    if (t0 >= measureFrom) {
      if (measuredStart === null) measuredStart = t0;
      measuredEnd = t1;
      sent++;
      if (ok) lat.push(t1 - t0); else errors++;
    }
  }
}

console.log(`Running "${label}": ${concurrency} users, ${warmup}s warm-up + ${duration}s measured, ${queries.length} query variants -> ${url}`);
await Promise.all(Array.from({ length: concurrency }, (_, k) => worker(k)));

if (sent === 0 || lat.length === 0) {
  console.error('ERROR: no successful requests were recorded. Is the backend running at ' + url + '? Nothing was written.');
  process.exit(1);
}
lat.sort((a, b) => a - b);
const pct = (p) => lat[Math.min(lat.length - 1, Math.ceil((p / 100) * lat.length) - 1)];
const elapsed = (measuredEnd - measuredStart) / 1000;
const rps = sent / elapsed;
const p50 = pct(50), p95 = pct(95), p99 = pct(99), max = lat[lat.length - 1];
const errRate = (errors / sent) * 100;
const pass = p95 < threshold && errors === 0;
const f = (n) => n.toFixed(0);

console.log(`requests=${sent} errors=${errors} (${errRate.toFixed(2)}%) rps=${rps.toFixed(1)} p50=${f(p50)}ms p95=${f(p95)}ms p99=${f(p99)}ms max=${f(max)}ms -> ${pass ? 'PASS' : 'FAIL'} (p95 < ${threshold} ms and 0 errors)`);

if (!fs.existsSync(evidencePath)) { console.error(`WARNING: ${evidencePath} not found; result printed only.`); process.exit(0); }
let doc = fs.readFileSync(evidencePath, 'utf8');
const re = /<!-- PERF:START -->([\s\S]*?)<!-- PERF:END -->/;
const m = doc.match(re);
if (!m) { console.error('WARNING: PERF markers missing in EVIDENCE.md; result printed only.'); process.exit(0); }
const header = '| Date (UTC) | Run | Listings in DB | Users | Measured (s) | Requests | Errors | Req/s | p50 ms | p95 ms | p99 ms | Max ms | Result (p95 < ' + threshold + ' ms, no errors) |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|';
const rows = m[1].split('\n').filter((l) => /^\| \d{4}-\d{2}-\d{2}/.test(l));
const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
rows.push(`| ${stamp} | ${label.replace(/\|/g, '/')} | ${dataset} | ${concurrency} | ${duration} | ${sent} | ${errors} | ${rps.toFixed(1)} | ${f(p50)} | ${f(p95)} | ${f(p99)} | ${f(max)} | ${pass ? 'PASS' : 'FAIL'} |`);
doc = doc.replace(re, `<!-- PERF:START -->\n${header}\n${rows.join('\n')}\n<!-- PERF:END -->`);
fs.writeFileSync(evidencePath, doc);
console.log(`Row appended to ${evidencePath}`);
