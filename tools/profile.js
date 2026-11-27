/* Measure how long the engine takes to draw one frame, split by stage, while the camera turns.
   Paste into the browser console on the built page (or run through a browser tool), after the map has appeared:
     await profileFrames({ view: 'avenue', frames: 12, dpr: 1 })
   It starts its own drawing thread from the page's engine text, so the page itself is not disturbed.
   Each frame turns the camera by 1 degree so nothing is reused from the frame before (as when someone drags). */
async function profileFrames({ view = null, camera: cam = null, frames = 12, dpr = 1, width = W, height = H, turn = 1 } = {}) {
  const probe = `
const T = {}; const add = (k, v) => { T[k] = (T[k] || 0) + v; };
const _scene = scene, _compile = compileInk, _paint = paintOps, _stamp = stamp, _plan = planSort;
scene = t => { const a = performance.now(); const r = _scene(t); add('scene (shapes as markup)', performance.now() - a); return r; };
compileInk = m => { const a = performance.now(); const r = _compile(m); add('compile markup to paths', performance.now() - a); return r; };
paintOps = (g, o) => { const a = performance.now(); const r = _paint(g, o); add('paint on canvas', performance.now() - a); return r; };
planSort = p => { const a = performance.now(); const r = _plan(p); add('  sort back to front', performance.now() - a); return r; };
stamp = (key, fn, ...rest) => { const a = performance.now(); const r = _stamp(key, fn, ...rest); add('  ' + String(key).replace(/\\d+$/, ''), performance.now() - a); return r; };
self.onmessage = ({ data: m }) => { for (const k in T) delete T[k];
  const a = performance.now(); const r = renderFrame(m); const total = performance.now() - a; r.bitmap.close && r.bitmap.close();
  postMessage({ total, parts: { ...T } }); };
postMessage({ ready: true });`;
  const url = URL.createObjectURL(new Blob([profileConfig() + engine + '\n' + probe], { type: 'text/javascript' }));
  const w = new Worker(url);
  await new Promise(r => { w.onmessage = ({ data }) => data.ready && r(); });
  const base = cam || (view ? { ...cameras[view] } : { ...camera });
  const runs = [];
  for (let i = 0; i < frames + 1; i++) {
    const m = { width, height, dpr, camera: { ...base, yaw: base.yaw + i * turn }, frontage: false, entrance: false, time: i * 0.033, wobble: 0, finish: 'wash', season, seq: i, generation: 0 };
    runs.push(await new Promise(r => { w.onmessage = ({ data }) => r(data); w.postMessage(m); }));
  }
  w.terminate(); URL.revokeObjectURL(url);
  const steady = runs.slice(1);   // the first frame also builds caches that last for the whole page
  const avg = k => steady.reduce((s, r) => s + (k ? (r.parts[k] || 0) : r.total), 0) / steady.length;
  const keys = [...new Set(steady.flatMap(r => Object.keys(r.parts)))];
  const out = { first_ms: Math.round(runs[0].total), frame_ms: Math.round(avg()), fps: +(1000 / avg()).toFixed(1) };
  for (const k of keys.sort((a, b) => avg(b) - avg(a))) out[k] = Math.round(avg(k));
  return out;
}
