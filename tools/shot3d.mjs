#!/usr/bin/env node
// Screenshot the three.js page in headless Chrome.
//   node tools/shot3d.mjs page.html --out shots/3d --view avenue,library [--at 2026-11-27T18:30] [--wx rain] [--size 1200x800]
//   --view check:x,y:zoom   six turns, a top view around plot point x,y
// Prints the files written and any page errors. Needs Chrome (set CHROME) and Node 22+.
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const args = process.argv.slice(2), file = args.find(a => /\.html?$/.test(a));
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : null; };
const out = opt('out') || 'shots/3d', [W, H] = (opt('size') || '1200x800').split('x').map(Number), at = opt('at'), wx = opt('wx');
let views = (opt('view') || 'iso').split(',');
let check = null;
if (views[0].startsWith('check:')) { const [, xy, z] = (opt('view')).split(':'); const [x, y] = xy.split(',').map(Number); check = { x, y, zoom: +z || 2.4 };
  views = ['t0', 't60', 't120', 't180', 't240', 't300', 'top']; }
fs.mkdirSync(out, { recursive: true });
const chromePath = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(p => { try { return fs.statSync(p).isFile(); } catch { return false; } });
if (!chromePath) { console.log('No Chrome found: set CHROME.'); process.exit(2); }
const port = 9500 + Math.floor(Math.random() * 200), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pc3-'));
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--no-first-run', '--hide-scrollbars',
  `--window-size=${W},${H}`, '--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws; for (let i = 0; i < 100 && !ws; i++) { await sleep(150); try { const t = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); if (t) ws = new WebSocket(t.webSocketDebuggerUrl); } catch {} }
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map(), errors = [];
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) errors.push(m.params.args.map(a => a.value ?? a.description).join(' ')); });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });
const q = new URLSearchParams(); if (at) q.set('at', at); if (wx) q.set('wx', wx);
const t0 = Date.now();
await send('Page.navigate', { url: 'file://' + path.resolve(file) + (q.toString() ? '?' + q : '') });
let ready = false; for (let i = 0; i < 240 && !ready; i++) { await sleep(250); ready = await ev('!!window.__three && document.getElementById("loading").hidden'); }
const loadS = ((Date.now() - t0) / 1000).toFixed(1);
await sleep(1500);
const shots = [];
for (const v of views) {
  if (check) {
    const yaw = v === 'top' ? 0 : +v.slice(1), pitch = v === 'top' ? 85 : 30;
    await ev(`(() => { const T = window.__three; T.setView('free'); const g = { yaw: ${yaw}, pitch: ${pitch}, zoom: ${check.zoom}, x: ${check.x}, y: ${check.y}, z: 8 }; T.goal = g; })()`);
  } else await ev(`window.__three.setView(${JSON.stringify(v)})`);
  await sleep(3500);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const name = path.join(out, `${path.basename(file, '.html')}-${v}${at ? '-' + at.replace(/[:T]/g, '') : ''}${wx ? '-' + wx : ''}.png`);
  fs.writeFileSync(name, Buffer.from(shot.result.data, 'base64')); shots.push(name);
}
console.log('Ready in', loadS, 's. Saved', shots.join(', '));
if (errors.length) { console.log('Page errors:'); for (const e of [...new Set(errors)].slice(0, 15)) console.log('  ' + String(e).slice(0, 500)); }
chrome.kill(); await sleep(400); try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
process.exit(errors.length ? 1 : 0);
