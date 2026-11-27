#!/usr/bin/env node
// Measure how smooth the built page is, in headless Chrome: time to the first picture, and pictures shown per second
// while the camera turns, moves and zooms, at the whole-campus overview and close up. Also the drawing time of one frame.
//   node tools/measure.mjs [page.html] [--phone] [--gpu]   (--phone: 390×844 touch screen and a 4× slower CPU;
//   --gpu: ask headless Chrome to use the graphics card, as a normal browser does)
// Prints JSON. Needs Chrome (set CHROME if it is somewhere unusual) and Node 22+.
import { spawn } from 'node:child_process'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
const args = process.argv.slice(2), file = args.find(a => /\.html?$/.test(a)) || 'pocket-city-tamkang-campus.html', phone = args.includes('--phone'), gpu = args.includes('--gpu');
const [W, H] = phone ? [390, 844] : [1440, 900];
const chromePath = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find(p => { try { return fs.statSync(p).isFile(); } catch { return false; } });
if (!chromePath) { console.log('No Chrome found: set CHROME.'); process.exit(2); }
const port = 9700 + Math.floor(Math.random() * 200), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pcm-'));
const chrome = spawn(chromePath, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--no-first-run', `--window-size=${W},${H}`, ...(gpu ? ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] : []), 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws; for (let i = 0; i < 100 && !ws; i++) { await sleep(150); try { const t = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page'); if (t) ws = new WebSocket(t.webSocketDebuggerUrl); } catch {} }
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map(), errors = [];
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text); });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return r.result?.result?.value; };
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: phone ? 2 : 1, mobile: phone });
if (phone) { await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }); await send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
const t0 = Date.now();
await send('Page.navigate', { url: 'file://' + path.resolve(file) + '?at=2026-11-27T12:00&wx=clear' });
let ready = false; for (let i = 0; i < 480 && !ready; i++) { await sleep(250); ready = await ev(`document.getElementById('loading')?.hidden`); }
const result = { device: (phone ? 'phone (390×844, CPU ÷4)' : 'desktop (1440×900)') + (gpu ? ', GPU' : ''), gpu_renderer: await ev(`(() => { const g = document.createElement('canvas').getContext('webgl'); const e = g && g.getExtension('WEBGL_debug_renderer_info'); return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'none'; })()`), first_picture_s: ready ? +((Date.now() - t0) / 1000).toFixed(1) : null };
await sleep(4000);   // let the extra drawing threads start
await ev(fs.readFileSync(new URL('./profile.js', import.meta.url), 'utf8').replace('async function profileFrames', 'window.profileFrames = async function'));
await ev(`window.fpsWhile = async (setup, step, ms = 3000) => {
  setup(); await new Promise(r => setTimeout(r, 2500));
  let n = 0; const orig = window.display; window.display = (f, g) => { n++; return orig(f, g); };
  const w0 = window.__smooth ? window.__smooth.warps : 0, start = performance.now();
  await new Promise(res => { const tick = () => { if (performance.now() - start > ms) return res(); step(); redraw(); requestAnimationFrame(tick); }; tick(); });
  window.display = orig; const s = ms / 1000, warps = window.__smooth ? window.__smooth.warps - w0 : 0;
  return { drawn: +(n / s).toFixed(1), on_screen: +((n + warps) / s).toFixed(1) }; }`);
const overview = `() => { setView('free'); goal = { ...iso }; }`, avenue = `() => setView('avenue')`;
result.threads = await ev('workers.length');
result.fps = {
  overview_turn: await ev(`fpsWhile(${overview}, () => { goal.yaw += 1.2; })`),
  overview_move: await ev(`fpsWhile(${overview}, () => { goal.x += 1; })`),
  overview_zoom: await ev(`fpsWhile(${overview}, () => { goal.zoom *= 1.004; })`),
  close_turn: await ev(`fpsWhile(${avenue}, () => { freeView(); goal.yaw += 1.2; })`),
  close_move: await ev(`fpsWhile(${avenue}, () => { freeView(); goal.x += .3; })`),
  cinematic: await ev(`fpsWhile(() => setView('cine'), () => {})`),
};
if (args.includes('--longtasks')) result.main_thread = await ev(`(async () => {
  setView('free'); goal = { ...iso }; await new Promise(r => setTimeout(r, 2500));
  const lt = []; const ob = new PerformanceObserver(l => { for (const e of l.getEntries()) lt.push(Math.round(e.duration)); }); ob.observe({ type: 'longtask' });
  const gaps = []; let prev = performance.now(); const start = prev;
  await new Promise(res => { const tick = () => { const n = performance.now(); gaps.push(n - prev); prev = n; if (n - start > 3000) return res(); goal.yaw += 1.2; redraw(); requestAnimationFrame(tick); }; tick(); });
  ob.disconnect(); gaps.sort((a, b) => a - b);
  const timed = {}; for (const name of ['display', 'redraw']) { const f = window[name]; let tot = 0, n = 0; window[name] = (...a) => { const s = performance.now(); const r = f(...a); tot += performance.now() - s; n++; return r; }; timed[name] = () => ({ calls: n, ms_total: Math.round(tot) }); }
  await new Promise(r => setTimeout(r, 1500)); const out = {}; for (const k in timed) out[k] = timed[k]();
  return { raf_per_s: +(gaps.length / 3).toFixed(1), raf_gap_ms_median: Math.round(gaps[gaps.length >> 1]), raf_gap_ms_max: Math.round(gaps[gaps.length - 1]), long_tasks: lt.slice(0, 20), long_task_count: lt.length, display_during_idle: out };
})()`);
if (args.includes('--cpuprofile')) {
  await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 500 });
  await ev(`(async () => { setView('free'); goal = { ...iso }; await new Promise(r => setTimeout(r, 2500)); })()`);
  await send('Profiler.start');
  await ev(`(async () => { const s = performance.now(); await new Promise(res => { const tick = () => { if (performance.now() - s > 3000) return res(); goal.yaw += 1.2; redraw(); requestAnimationFrame(tick); }; tick(); }); })()`);
  const prof = (await send('Profiler.stop')).result.profile;
  const byId = new Map(prof.nodes.map(n => [n.id, n])), self = new Map();
  const dt = prof.timeDeltas; prof.samples.forEach((id, i) => { const n = byId.get(id), f = n.callFrame, k = (f.functionName || '(anon)') + ' @' + f.lineNumber; self.set(k, (self.get(k) || 0) + (dt[i] || 0) / 1000); });
  result.main_thread_top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => k + ': ' + Math.round(v) + ' ms');
}
result.frame_ms = {
  overview: await ev(`profileFrames({ camera: { ...iso }, frames: 5 }).then(r => r.frame_ms)`),
  close: await ev(`profileFrames({ view: 'avenue', frames: 5 }).then(r => r.frame_ms)`),
};
result.errors = errors;
console.log(JSON.stringify(result, null, 1));
chrome.kill(); await sleep(400); try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
process.exit(0);
