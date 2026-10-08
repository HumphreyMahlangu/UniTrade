#!/usr/bin/env node
// Checks a deployed UniTrade (frontend on Vercel + API on Render) end to end. No dependencies (Node 18+).
//
// Usage:
//   node scripts/check-deploy.mjs --web https://uni-trade-eight.vercel.app --api https://unitrade-api.onrender.com
//
// Checks: frontend loads; deep links work (SPA rewrite); API health incl. database; CORS allows the
// frontend's origin and refuses others; the built frontend points at the API.
// Prints PASS/FAIL per check and exits 1 if any check fails. It writes nothing.

const args = process.argv.slice(2);
const arg = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const web = (arg('--web') || '').replace(/\/$/, '');
const api = (arg('--api') || '').replace(/\/$/, '');
if (!web || !api) {
  console.error('Usage: node scripts/check-deploy.mjs --web <frontend URL> --api <API URL>');
  process.exit(1);
}

let failed = 0;
const check = async (name, fn) => {
  try {
    const detail = await fn();
    console.log(`PASS  ${name}${detail ? ' - ' + detail : ''}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${name} - ${e.message}`);
  }
};
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
// A sleeping free-tier API can take minutes to answer the first request
const get = (url, opts = {}) => fetch(url, { ...opts, signal: AbortSignal.timeout(240_000) });

await check('API health (wakes the server; may take a few minutes)', async () => {
  const t0 = Date.now();
  const res = await get(`${api}/api/health`);
  const body = await res.json();
  expect(res.ok, `HTTP ${res.status}`);
  expect(body.status === 'UP', `status=${body.status}`);
  expect(body.database === 'UP', `database=${body.database}`);
  return `status UP, database UP, answered in ${((Date.now() - t0) / 1000).toFixed(1)} s`;
});

await check('Frontend home page loads', async () => {
  const res = await get(`${web}/`);
  const html = await res.text();
  expect(res.ok, `HTTP ${res.status}`);
  expect(html.includes('<div id="root">'), 'not the UniTrade app page');
});

await check('Deep link works (SPA rewrite)', async () => {
  const res = await get(`${web}/some/deep/link`);
  const html = await res.text();
  expect(res.ok && html.includes('<div id="root">'), `HTTP ${res.status}`);
});

await check('Frontend build points at the API (VITE_API_URL)', async () => {
  const html = await (await get(`${web}/`)).text();
  const scripts = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)].map((m) => m[1]);
  expect(scripts.length > 0, 'no script bundle found');
  for (const s of scripts) {
    if ((await (await get(web + s)).text()).includes(api)) return api;
  }
  throw new Error(`bundle does not contain ${api}; set VITE_API_URL in Vercel and redeploy`);
});

await check('CORS allows the frontend origin', async () => {
  const res = await get(`${api}/api/health`, { headers: { Origin: web } });
  const allowed = res.headers.get('access-control-allow-origin');
  expect(allowed === web, `Access-Control-Allow-Origin=${allowed}; set APP_CORS_ORIGINS=${web} on Render`);
  return allowed;
});

await check('CORS refuses other origins', async () => {
  const res = await get(`${api}/api/health`, { headers: { Origin: 'https://not-unitrade.example' } });
  expect(res.status === 403, `HTTP ${res.status}`);
});

console.log(failed ? `\n${failed} check(s) failed.` : '\nAll checks passed.');
process.exit(failed ? 1 : 0);
