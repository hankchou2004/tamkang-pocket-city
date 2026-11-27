/* Tamkang University, Tamsui campus, drawn with three.js in the Pocket City manner.
   Data: SCENE (OpenStreetMap, plot metres), CITY (styles, views, notes), LIVE_CFG (weather and light), LANDMARKS.
   Look: flat colours in three steps (light / mid / dark, the 2D kit's tone()), ink outlines, warm paper, real sun and
   shadows for the time now in 淡水, the weather now from Open-Meteo, dusk and night as the 2D kit's night colours. */
(() => {
const $ = id => document.getElementById(id);
const META = SCENE.meta, HALF = META.half, SIZE = Math.round(META.size);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const link = (label, url) => url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(label) + '</a>' : esc(label);
const phoneProfile = () => innerWidth <= 760 || (matchMedia('(pointer:coarse)').matches && Math.min(screen.width, screen.height) <= 760);
let phone = phoneProfile();
const params = new URLSearchParams(location.search);
// APP_MODE (tools/build.py --app): the phone app, a full-screen portrait map. Map-app gestures (one finger moves, two fingers
// zoom and turn), a tap on a building flies to it, no side panels. Everything is sized from SCENE.meta, so a bigger plot needs no change here.
const APP = typeof APP_MODE !== 'undefined' && !!APP_MODE;

/* ====================== page text (place, notes, credits) ====================== */
const fmt = (v, p, n) => Math.abs(v).toFixed(5) + '° ' + (v >= 0 ? p : n);
document.title = 'Pocket City · ' + (CITY.title || CITY.name);
$('cityName').textContent = CITY.name; $('placeTab').textContent = CITY.name;
document.querySelector('.stamp-line span').textContent = CITY.region || '';
const flag = document.querySelector('.flag'); if (flag) flag.hidden = true;
document.querySelector('.location').textContent = CITY.place || '';
document.querySelector('.coords').lastChild.textContent = ' ' + fmt(META.lat, 'N', 'S') + '　' + fmt(META.lon, 'E', 'W');
const notesHtml = (CITY.notes || []).map(n => '<dt>' + esc(n.title) + '</dt><dd>' + esc(n.text) + (n.links && n.links.length ? ' ' + n.links.map(l => link(l.label, l.url)).join(' · ') : '') + '</dd>').join('');
document.querySelector('.dialog-body').innerHTML = '<dl class="source-list">' + notesHtml +
  '<dt>地圖資料</dt><dd>建築輪廓、道路、步道、水域與樹林來自 ' + esc(META.osm_base ? META.osm_base.slice(0, 10) : '') + ' 的 OpenStreetMap 資料。這塊 ' + SIZE + ' 公尺見方的地塊轉了 ' + Math.round(META.rotation) + '° 以對齊道路。' + link('© OpenStreetMap contributors', 'https://www.openstreetmap.org/copyright') + '</dd>' +
  '<dt>繪製</dt><dd>以 three.js 繪製（MIT）。畫風、配色與手工地標的零件沿用 April Zhu 的 Pocket City（非商業授權）；繪圖工具組以 Tolga Cohce 的 iso-figure 為基礎。</dd></dl>';
$('notesBtn').onclick = () => $('notes').showModal(); $('closeNotes').onclick = () => $('notes').close();
$('notes').onclick = e => { if (e.target === $('notes')) { const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); } };

/* ====================== layout: the upper card stays; views, how-to and sources go in 地圖導覽 ====================== */
const css = document.createElement('style');
css.textContent = `
#play,#chips,#snow,.season-scroll,.foot,.control-area .gesture,.control-area .views,.select-wrap.view-select{display:none!important}
.workspace{height:calc(100% - 64px)!important}
@media(max-width:760px){.workspace{height:calc(100% - 48px)!important}}
@media(max-height:480px) and (orientation:landscape){.workspace{height:calc(100% - 38px)!important}}
.key-sub{margin:8px 0 5px;font:600 10px var(--mono,monospace);letter-spacing:.06em;color:#65705e}
.key-sub:first-child{margin-top:2px}
#views.views-panel{display:flex;flex-wrap:wrap;gap:4px;padding:0 0 8px;border-bottom:1px solid var(--rule,#d8d4c4)}
#views.views-panel .vbtn{flex:none;font-size:11px;padding:4px 8px;border:1px solid #c9cdbf;border-radius:999px;background:#fffcf2;cursor:pointer}
#views.views-panel .vbtn[aria-pressed="true"]{background:#2f4f43;color:#fff;border-color:#2f4f43}
#panMode[aria-pressed="true"]{background:#2f4f43;color:#fff}
.key-text{font:12px/1.5 var(--serif,serif);color:#5e6a5c;margin:0 2px 6px}
.key-src{font:10px/1.6 var(--mono,monospace);color:#65705e;margin:0 2px 4px;word-break:break-word}
.key-src a{color:inherit}
.osm-credit{position:absolute;right:10px;bottom:6px;z-index:3;font:9px var(--mono,monospace);color:#65705e;background:#fbf9f0cc;padding:1px 5px;border-radius:4px;text-decoration:none}
.haze{position:absolute;inset:0;pointer-events:none;background:rgba(224,207,176,.38);mix-blend-mode:multiply;opacity:0;transition:opacity 2s;z-index:1}
#fig{touch-action:none}`;
document.head.appendChild(css);
document.querySelector('.season-box .subhead').textContent = '淡水 · 現在';
const keyBody = $('keyBody');
keyBody.querySelectorAll('[data-f], .key-help').forEach(e => e.remove());
const toggle = $('keyToggle'); if (toggle.firstChild && toggle.firstChild.nodeType === 3) toggle.firstChild.textContent = '地圖導覽 ';
toggle.onclick = () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', open); keyBody.hidden = !open; };
const views = $('views'); views.classList.add('views-panel');
const mkH = t => { const h = document.createElement('h3'); h.className = 'key-sub'; h.textContent = t; return h; };
const how = document.createElement('p'); how.className = 'key-text';
const src = document.createElement('div'); src.className = 'key-src';
src.innerHTML = '範圍 ' + SIZE + ' × ' + SIZE + ' m<br>' + link('© OpenStreetMap contributors', 'https://www.openstreetmap.org/copyright') + (CITY.credits ? ' · ' + CITY.credits.map(c => link(c.label, c.url)).join(' · ') : '') + ' · ' + link('three.js', 'https://threejs.org/');
const zoneKey = document.createElement('div'); zoneKey.className = 'key-text';
zoneKey.innerHTML = (typeof ZONES !== 'undefined' ? ZONES : []).map(z => '<span style="display:inline-flex;align-items:center;gap:5px;margin-right:10px"><i style="width:14px;height:10px;border-radius:3px;background:' + esc(z.colour) + ';border:1.5px solid ' + esc(z.edge) + '"></i>' + esc(z.name) + '</span>').join('');
keyBody.append(mkH('視角'), views, mkH('區域'), zoneKey, mkH('操作'), how, mkH('資料來源'), src);
const howText = () => APP ? '單指移動 · 雙指縮放與旋轉 · 點建築拉近' : phone ? '單指旋轉 · 雙指移動與縮放 · 按右上角 ✥ 改成單指移動' : '拖曳旋轉 · 右鍵或 Shift 拖曳移動 · 滾輪縮放 · 也可按右上角 ✥ 改成直接拖曳移動';
how.textContent = howText();
const stage = $('stage'), canvas = $('fig');
const osmA = document.createElement('a'); osmA.className = 'osm-credit'; osmA.href = 'https://www.openstreetmap.org/copyright'; osmA.target = '_blank'; osmA.textContent = '© OpenStreetMap'; stage.appendChild(osmA);
const haze = document.createElement('div'); haze.className = 'haze'; stage.insertBefore(haze, canvas.nextSibling);
$('status').lastElementChild.textContent = '3D · three.js';
// the move button where the pause button was
const panBtn = document.createElement('button'); panBtn.className = 'tool'; panBtn.id = 'panMode'; panBtn.type = 'button';
panBtn.title = '移動畫面（開啟後拖曳即可移動）'; panBtn.setAttribute('aria-label', '移動畫面'); panBtn.setAttribute('aria-pressed', 'false');
panBtn.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M3 12h18M12 3l-3 3m3-3 3 3M12 21l-3-3m3 3 3-3M3 12l3-3m-3 3 3 3M21 12l-3-3m3 3-3 3"/></svg>';
$('play').after(panBtn);

/* ====================== the phone app: full-screen map, a small title bar, a button back to the whole campus ====================== */
let appWx = null;
if (APP) {
  document.title = CITY.app_name || '淡江校園';
  const a = document.createElement('style');
  a.textContent = `
.top,.rail,.control-area,.foot,.tools,.mark,#viewName,.scale{display:none!important}
html,body{background:var(--paper,#f6f3e9)}
.workspace{position:fixed!important;inset:0!important;height:auto!important}
.stage{position:fixed!important;inset:0!important;margin:0!important;border:0!important;border-radius:0!important;box-shadow:none!important}
.compass{top:calc(env(safe-area-inset-top) + 12px)!important;right:12px!important;bottom:auto!important;width:40px!important;height:44px!important}
.osm-credit{bottom:calc(env(safe-area-inset-bottom) + 6px)!important;left:10px;right:auto!important}
.app-bar{position:absolute;z-index:4;left:12px;right:64px;top:calc(env(safe-area-inset-top) + 12px);pointer-events:none}
.app-bar>div{display:inline-block;max-width:100%;padding:8px 12px 7px;border:1px solid #c9cdbf;border-radius:12px;background:#fffcf2ee;box-shadow:0 3px 0 #7b80661a}
.app-bar b{display:block;font:700 17px/1.15 var(--serif,serif);letter-spacing:-.3px;color:var(--ink,#263c35)}
.app-bar small{display:block;margin-top:2px;font:11px/1.3 var(--sans,sans-serif);color:#5e6a5c;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.app-home{position:absolute;z-index:4;right:12px;bottom:calc(env(safe-area-inset-bottom) + 16px);width:48px;height:48px;border-radius:50%;border:1px solid #c1c7b8;background:#fffcf2;box-shadow:0 3px 0 #7b80661a,0 3px 10px #4d543624;display:grid;place-items:center;color:var(--ink,#263c35)}
.app-home svg{width:22px;height:22px}
.app-home:active{transform:translateY(1px)}
.lmk{font-size:12px;padding:5px 9px}`;
  document.head.appendChild(a);
  const bar = document.createElement('div'); bar.className = 'app-bar';
  bar.innerHTML = '<div><b></b><small></small></div>'; bar.querySelector('b').textContent = CITY.app_name || CITY.name;
  appWx = bar.querySelector('small'); stage.appendChild(bar);
  const home = document.createElement('button'); home.type = 'button'; home.className = 'app-home'; home.title = '回到全校'; home.setAttribute('aria-label', '回到全校');
  home.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><circle cx="12" cy="12" r="2.2"/></svg>';
  home.onclick = () => setView('iso'); stage.appendChild(home);
}

/* ====================== renderer, cameras ====================== */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // colours are used exactly as written (the kit's hex colours)
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, phone ? 2 : 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
const scene = new THREE.Scene();
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -3000, 3000); cam.up.set(0, 0, 1);
let W = 1, H = 1;
const K = Math.sqrt(1.5);
const autoZoom = +(302 / (SIZE * 1.62)).toFixed(3);
const iso = { yaw: -35, pitch: 33, zoom: autoZoom, x: 0, y: 0, z: 4, ...((CITY.cameras || {}).iso || {}) };
if (APP) { iso.zoom *= 2.1; iso.pitch += 7; }   // a portrait screen: the zoom is set by its width, so the square would sit small in the middle; look down a little more to fill the height
const maxZoom = iso.zoom * 16, minZoom = iso.zoom * .55;
const cameras = { iso, bird: { yaw: iso.yaw - 5, pitch: 72, zoom: iso.zoom * .95, x: 0, y: 0, z: 4 } };
const viewList = [['cine', '自動環繞']];
for (const v of CITY.views || []) { cameras[v.id] = { ...iso, ...v.camera }; viewList.push([v.id, v.label]); }
viewList.push(['bird', '鳥瞰']);
let camera = { ...iso }, goal = { ...iso }, view = 'cine', movie = 0;
const ppu = c => Math.min(W / 302, H / 202) * c.zoom * K;          // CSS pixels per metre, as in the 2D engine
function applyCamera(c) {
  const t = c.yaw * Math.PI / 180, p = c.pitch * Math.PI / 180, ct = Math.cos(t), st = Math.sin(t), cp = Math.cos(p), sp = Math.sin(p);
  const V = new THREE.Vector3(cp * ct, cp * st, sp);
  cam.position.set(c.x + V.x * 1000, c.y + V.y * 1000, c.z + V.z * 1000);
  cam.up.set(-sp * ct, -sp * st, cp); cam.lookAt(c.x, c.y, c.z);
  const k = ppu(c); cam.left = -W / 2 / k; cam.right = W / 2 / k; cam.top = H / 2 / k; cam.bottom = -H / 2 / k; cam.updateProjectionMatrix();
  U.uView.value.copy(V);
  // compass needle and the 20 m scale bar
  const N = META.north, R = [-st, ct, 0], D = [sp * ct, sp * st, -cp];
  const nx = N[0] * R[0] + N[1] * R[1], ny = N[0] * D[0] + N[1] * D[1];
  $('needle').setAttribute('transform', 'rotate(' + (Math.atan2(ny, nx) * 180 / Math.PI + 90) + ' 34 39)');
  $('scaleLine').style.width = (20 * k) + 'px';
  $('zoom').textContent = Math.round(c.zoom / iso.zoom * 100) + '%';
}

/* ====================== the toon material ====================== */
const U = {
  uTone: { value: new THREE.Vector3(.4, -.5, .77).normalize() }, uView: { value: new THREE.Vector3(1, 1, 1).normalize() },
  uNight: { value: 0 }, uLitShare: { value: 0 }, uShadowOn: { value: 1 }, uWet: { value: 0 }, uAtlas: { value: null }, uAtlasN: { value: 32 }, uTime: { value: 0 },
};
const VERT = THREE.ShaderLib.shadow.vertexShader
  .replace('void main() {', `attribute vec3 aCol; attribute float aLit; attribute float aTile; attribute vec2 aUv;
varying vec3 vCol; varying float vLit; varying float vTile; varying vec2 vUv; varying vec3 vWN;
void main() {
  #ifdef USE_INSTANCING_COLOR
  vCol = instanceColor;
  #else
  vCol = aCol;
  #endif
  vLit = aLit; vTile = aTile; vUv = aUv;`)
  .replace('#include <shadowmap_vertex>', '#include <shadowmap_vertex>\n  vWN = normalize(inverseTransformDirection(transformedNormal, viewMatrix));');
const FRAG = `
#include <common>
#include <packing>
#include <bsdfs>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
uniform vec3 uTone; uniform vec3 uView; uniform float uNight; uniform float uLitShare; uniform float uShadowOn; uniform float uWet;
uniform sampler2D uAtlas; uniform float uAtlasN; uniform float uGround;
varying vec3 vCol; varying float vLit; varying float vTile; varying vec2 vUv; varying vec3 vWN;
float ss(float a, float b, float x) { float k = clamp((x - a) / (b - a), 0., 1.); return k * k * (3. - 2. * k); }
vec3 tone3(vec3 base, float d) {
  vec3 m = mix(base, vec3(.5333, .4745, .5922), .18), dk = mix(base, vec3(.4392, .3725, .5059), .33);
  float S = .05, a = ss(.28 - S, .28 + S, d), b = ss(-.30 - S, -.30 + S, d);
  if (a >= 1.) return base; if (b <= 0.) return dk; if (a > 0.) return mix(m, base, a); if (b < 1.) return mix(dk, m, b); return m; }
vec3 nightCol(vec3 c, float k) { return vec3(c.r * (1. - .5 * k) + .047 * k, c.g * (1. - .52 * k) + .063 * k, c.b * (1. - .4 * k) + .157 * k); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec3 base = vCol; bool lit = vLit > .5;
  if (vTile >= 0.) {
    float col = mod(vTile, uAtlasN), row = floor(vTile / uAtlasN);
    vec2 f = fract(vUv), cell = floor(vUv);
    vec2 auv = (vec2(col, row) + vec2(.06) + f * .88) / uAtlasN;
    vec4 t = texture2D(uAtlas, auv);
    base = t.rgb;
    if (t.a < .4 && uNight > .05) { gl_FragColor = vec4(mix(nightCol(t.rgb, uNight), vec3(1., .851, .541), clamp(uNight * 2.5, 0., 1.)), 1.); return; }   // 宮燈教室: every window lit after dark
    if (t.a < .75 && uNight > .05 && hash2(cell + vec2(vTile * 7.13, vTile)) < uLitShare) { gl_FragColor = vec4(hash2(cell * 1.7) > .5 ? vec3(1., .851, .541) : vec3(1., .906, .659), 1.); return; }
  }
  if (vLit > 1.5 && uNight > .05) { gl_FragColor = vec4(mix(nightCol(base, uNight), vec3(1., .953, .769), clamp(uNight * 2.5, 0., 1.)), 1.); return; }   // lanterns glow after dark
  if (vLit > .5 && vLit < 1.5) { gl_FragColor = vec4(base, 1.); return; }
  vec3 n = normalize(vWN); if (dot(n, uView) < 0.) n = -n;
  float d = dot(n, uTone);
  float sh = uShadowOn > .5 ? getShadowMask() : 1.;
  d = mix(-1., d, sh);
  if (uGround > .5) base = mix(base, base * vec3(.93, .94, .96), uWet);
  vec3 c = tone3(base, d);
  c = nightCol(c, uNight);
  gl_FragColor = vec4(c, 1.);
}`;
function toonMaterial(extra = {}) {
  return new THREE.ShaderMaterial({ uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.lights, { uGround: { value: extra.ground ? 1 : 0 } }]),
    vertexShader: VERT, fragmentShader: FRAG, lights: true, side: THREE.DoubleSide, ...extra.opts });
}
// share the live uniforms between every toon material
function shareUniforms(m) { for (const k in U) m.uniforms[k] = U[k]; return m; }

/* ====================== building the scene ====================== */
const SEASONS_BASE = (LIVE_CFG && LIVE_CFG.months) || [];
let SEASON = { leaves: 'summer' };
window.SEASON = SEASON;

function meshFromGEO(kind, opts = {}) {
  const geom = new THREE.BufferGeometry();
  if (kind === 'flat') {
    const G = GEO.flat; if (!G.p.length) return null;
    geom.setAttribute('position', new THREE.Float32BufferAttribute(G.p, 3)); geom.setAttribute('normal', new THREE.Float32BufferAttribute(G.n, 3));
    geom.setAttribute('aCol', new THREE.Float32BufferAttribute(G.c, 3)); geom.setAttribute('aLit', new THREE.Float32BufferAttribute(G.lit, 1));
    const n = G.p.length / 3; geom.setAttribute('aTile', new THREE.Float32BufferAttribute(new Float32Array(n).fill(-1), 1)); geom.setAttribute('aUv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
  } else if (kind === 'wall') {
    const G = GEO.wall; if (!G.p.length) return null;
    geom.setAttribute('position', new THREE.Float32BufferAttribute(G.p, 3)); geom.setAttribute('normal', new THREE.Float32BufferAttribute(G.n, 3));
    geom.setAttribute('aCol', new THREE.Float32BufferAttribute(G.c, 3)); geom.setAttribute('aLit', new THREE.Float32BufferAttribute(new Float32Array(G.p.length / 3), 1));
    geom.setAttribute('aTile', new THREE.Float32BufferAttribute(G.tile, 1)); geom.setAttribute('aUv', new THREE.Float32BufferAttribute(G.uv, 2));
  }
  const mesh = new THREE.Mesh(geom, shareUniforms(toonMaterial(opts)));
  mesh.castShadow = !opts.ground; mesh.receiveShadow = true; mesh.frustumCulled = false;
  return mesh;
}
function inkFromGEO() {
  const G = GEO.ink; if (!G.p.length) return null;
  const geom = new THREE.BufferGeometry(); geom.setAttribute('position', new THREE.Float32BufferAttribute(G.p, 3)); geom.setAttribute('aCol', new THREE.Float32BufferAttribute(G.c, 3));
  const mat = new THREE.ShaderMaterial({ uniforms: { uNight: U.uNight }, transparent: true, depthWrite: false,
    vertexShader: 'attribute vec3 aCol; varying vec3 vC; void main(){ vC = aCol; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); p.z -= 0.0004 * p.w; gl_Position = p; }',
    fragmentShader: 'uniform float uNight; varying vec3 vC; void main(){ vec3 c = vC; float k = uNight; c = vec3(c.r*(1.-.5*k)+.047*k, c.g*(1.-.52*k)+.063*k, c.b*(1.-.4*k)+.157*k); gl_FragColor = vec4(c, 1.); }' });
  const l = new THREE.LineSegments(geom, mat); l.frustumCulled = false; return l;
}
function glassFromGEO() {
  const G = GEO.glass; if (!G.p.length) return null;
  const geom = new THREE.BufferGeometry(); geom.setAttribute('position', new THREE.Float32BufferAttribute(G.p, 3)); geom.setAttribute('aCol', new THREE.Float32BufferAttribute(G.c, 4));
  const mat = new THREE.ShaderMaterial({ uniforms: { uNight: U.uNight }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: 'attribute vec4 aCol; varying vec4 vC; void main(){ vC = aCol; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform float uNight; varying vec4 vC; void main(){ vec3 c = vC.rgb; float k = uNight; c = vec3(c.r*(1.-.5*k)+.047*k, c.g*(1.-.52*k)+.063*k, c.b*(1.-.4*k)+.157*k); gl_FragColor = vec4(c, vC.a); }' });
  const m = new THREE.Mesh(geom, mat); m.frustumCulled = false; m.renderOrder = 2; return m;
}

// polygons on the ground (with holes)
function ringsOf(g) { const out = []; const walk = x => { if (x && Array.isArray(x[0]) && typeof x[0][0] === 'number') { out.push([x]); return; }
  if (x && Array.isArray(x[0]) && Array.isArray(x[0][0]) && typeof x[0][0][0] === 'number') { out.push(x); return; } if (Array.isArray(x)) x.forEach(walk); }; walk(g); return out; }
function groundPoly(poly, z, colour) {
  const [outer, ...holes] = poly; if (!outer || outer.length < 3) return;
  const V = r => r.map(p => new THREE.Vector2(p[0], p[1]));
  let tris; try { tris = THREE.ShapeUtils.triangulateShape(V(outer), holes.map(V)); } catch (e) { return; }
  const pts = outer.concat(...holes), rgba = hex2rgb(colour), G = GEO.flat;
  for (const t of tris) for (const i of t) { const p = pts[i]; G.p.push(p[0], p[1], z); G.n.push(0, 0, 1); G.c.push(rgba[0], rgba[1], rgba[2]); G.lit.push(0); }
}
const PAL = CITY.palette || {};
function buildGround() {
  geoReset();
  const C = SCENE.corners, SLAB = 4;
  groundPoly([C], 0, PAL.ground || '#e9e1cd');
  // the plate's edge: a slab under the square, like the printed diorama
  loft(atZ(C, -SLAB), atZ(C, 0), PAL.slab || '#d6c8ab'); shape(atZ(C, -SLAB), mix(PAL.slab || '#d6c8ab', '#705f81', .3), 0);
  inkLoop(atZ(C, 0), lineOf(PAL.slab || '#d6c8ab')); inkLoop(atZ(C, -SLAB), lineOf(PAL.slab || '#d6c8ab'));
  // area tints (work/zones.json): open ground inside each zone takes its colour; lawns, roads and paths keep theirs
  for (const z of (typeof ZONES !== 'undefined' ? ZONES : [])) {
    const r = z.ring[0][0] === z.ring[z.ring.length - 1][0] && z.ring[0][1] === z.ring[z.ring.length - 1][1] ? z.ring.slice(0, -1) : z.ring;
    groundPoly([ccw(r)], .02, z.colour); inkLoop(atZ(r, .3), z.edge); inkLoop(atZ(r, .32), z.edge);
  }
  for (const l of SCENE.lawns || []) for (const p of ringsOf(l.r)) groundPoly(p, .04, l.kind === 'grass' || !l.kind ? (PAL.grass || '#abcb87') : (PAL.grass || '#abcb87'));
  for (const p of ringsOf(SCENE.quay || [])) groundPoly(p, .05, PAL.paving || '#c9bfae');
  for (const p of ringsOf(SCENE.water || [])) groundPoly(p, .02, PAL.water || '#94c0c2');
  for (const p of ringsOf(SCENE.roads || [])) groundPoly(p, .08, PAL.road || '#b0a9ad');
  for (const p of ringsOf(SCENE.paths || [])) groundPoly(p, .1, PAL.pavement || '#e2dacb');
  for (const p of ringsOf(SCENE.walk || [])) groundPoly(p, .12, PAL.walk || '#ddd3c0');
  // road centre markings
  for (const c of SCENE.centerlines || []) { const p = c.p; for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let s = 0; s < L; s += 6) { const t0 = s / L, t1 = Math.min(1, (s + 3) / L); inkLoop([[a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0, .14], [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1, .14]], PAL.marking || '#f4efe2', false); } } }
  const g = meshFromGEO('flat', { ground: true }); scene.add(g);
  const ink = inkFromGEO(); if (ink) scene.add(ink);
  return g;
}

/* generic buildings: style rules from city.json, as the 2D engine reads them */
const areaOf = r => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
function matches(c, b) {
  if (!c) return true; const any = (v, x) => (Array.isArray(v) ? v : [v]).includes(x);
  if (c.type && !any(c.type, b.type)) return false; if (c.use && !any(c.use, b.use)) return false;
  if (c.famous !== undefined && !!b.famous !== c.famous) return false; if (c.cut !== undefined && !!b.cut !== c.cut) return false;
  if (c.name && !new RegExp(c.name, 'i').test(b.n || '')) return false;
  const h = b.h ?? (b.lv ? b.lv * LEVEL : null);
  if (c.minH !== undefined && !(h >= c.minH)) return false; if (c.maxH !== undefined && !(h !== null && h <= c.maxH)) return false;
  if (c.minLevels !== undefined && !((b.lv ?? (h ? h / LEVEL : 0)) >= c.minLevels)) return false;
  if (c.maxLevels !== undefined && !((b.lv ?? (h ? h / LEVEL : 99)) <= c.maxLevels)) return false;
  const area = areaOf(b.ring); if (c.minArea !== undefined && !(area >= c.minArea)) return false; if (c.maxArea !== undefined && !(area <= c.maxArea)) return false;
  if (c.unknownHeight !== undefined && (b.h == null && b.lv == null) !== c.unknownHeight) return false;
  return true;
}
function styleFor(b) {
  let s = { facade: 'house', wall: ['#eee2ca'], roofColour: ['#c8c4b8'], roof: 'auto', pitch: 30, eaves: .45, levels: 3, floor: LEVEL, parapet: .5, ...(STYLES.default || {}) };
  for (const rule of STYLES.rules || []) if (matches(rule.if, b)) { s = { ...s, ...rule.set }; if (!rule.more) break; }
  return { ...s, ...((CITY.buildings || {})[b.id] || {}) };
}
const inPoly = (p, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const a = r[i], b = r[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const onCampus = b => typeof CAMPUS === 'undefined' || inPoly(b.obb.c, CAMPUS);
const PALE = '#f2ede2';
function genericBuilding(b) {
  let st = styleFor(b), body = pickOf(st.wall, b.id);
  if (!onCampus(b)) {   // outside the campus: paler walls, roofs and glass, so the campus buildings stand out
    body = mix(body, PALE, .55);
    st = { ...st, wall: body, flatRoof: mix(pickOf(st.flatRoof || st.roofColour, b.id), PALE, .55), roofColour: mix(pickOf(st.roofColour, b.id), PALE, .45),
      glass: (st.glass || ['#a9bcc1']).map(g => mix(g, body, .6)), frame: mix(st.frame || '#7d7f80', body, .6), trim: st.trim ? mix(st.trim, body, .6) : st.trim };
  }
  const ring = ccw(b.ring);
  const pitched = (st.roof === 'gabled' || st.roof === 'hipped') && b.obb && b.obb.fill >= (st.rectFill ?? .78) && b.obb.W <= (st.maxSpan ?? 22);
  let wall = b.h ? b.h : b.lv ? b.lv * st.floor + (pitched ? 0 : .6) : (st.levels || 3) * st.floor + (pitched ? 0 : .6);
  if (st.height) wall = st.height;
  const z0 = b.min || 0; wall = Math.max(wall, z0 + 2.4);
  walls3d(ring, z0, wall, st, body);
  for (const h of b.holes || []) walls3d(h.slice().reverse(), z0, wall, st, body);
  if (pitched) pitchedRoof3d(b.obb, wall, st, st.roof, pickOf(st.roofColour, b.id));
  else {
    const top = pickOf(st.flatRoof || st.roofColour, b.id);
    groundPoly([ring, ...(b.holes || [])], wall, top); inkLoop(atZ(ring, wall), lineOf(top));
    if (st.parapet && wall - z0 > 5) { const inner = ring.map(p => { const c = b.obb.c; return [c[0] + (p[0] - c[0]) * .985, c[1] + (p[1] - c[1]) * .985]; }); inkLoop(atZ(inner, wall + .02), mix(top, '#51465a', .3)); }
  }
}

/* façade atlas: a tile per façade, drawn on a canvas */
function drawAtlas() {
  const N = ATLAS.size / ATLAS.tile, cv = document.createElement('canvas'); cv.width = cv.height = ATLAS.size;
  const g = cv.getContext('2d'), T = ATLAS.tile;
  ATLAS.list.forEach((t, i) => {
    const x0 = (i % N) * T, y0 = Math.floor(i / N) * T;
    g.fillStyle = t.wall; g.fillRect(x0, y0, T, T);
    const win = (x, y, w, h, frame = t.frame) => { g.fillStyle = frame; g.fillRect(x0 + x - 1, y0 + y - 1, w + 2, h + 2); g.fillStyle = t.glass; g.fillRect(x0 + x, y0 + y, w, h); };
    switch (t.facade) {
      case 'office': win(4, 18, T - 8, 30); g.fillStyle = t.frame; for (let k = 1; k < 3; k++) g.fillRect(x0 + 4 + k * (T - 8) / 3, y0 + 18, 1.5, 30); if (t.trim) { g.fillStyle = t.trim; g.fillRect(x0, y0 + T - 6, T, 6); } break;
      case 'glass': g.fillStyle = t.glass; g.fillRect(x0 + 2, y0 + 2, T - 4, T - 4); g.fillStyle = t.frame; g.fillRect(x0, y0 + T - 5, T, 5); g.fillRect(x0 + T / 2 - 1, y0, 2, T); break;
      case 'apartment': win(14, 16, T - 28, 30); if (t.balcony) { g.fillStyle = mix(t.wall, '#51465a', .25); g.fillRect(x0 + 6, y0 + 44, T - 12, 4); } break;
      case 'civic': win(18, 10, T - 36, 42); if (t.trim) { g.fillStyle = t.trim; g.fillRect(x0, y0 + T - 4, T, 4); } break;
      case 'stucco': win(22, 16, T - 44, 32); if (t.shutters) { g.fillStyle = t.shutters; g.fillRect(x0 + 14, y0 + 16, 7, 32); g.fillRect(x0 + T - 21, y0 + 16, 7, 32); } if (t.trim) { g.fillStyle = t.trim; g.fillRect(x0, y0 + T - 4, T, 4); } break;
      case 'temple': g.fillStyle = t.glass; g.fillRect(x0 + 10, y0 + 16, T - 20, 34); g.fillStyle = mix(t.wall, '#51465a', .35); for (let k = 0; k < 6; k++) g.fillRect(x0 + 8 + k * 8, y0 + 14, 2, 40); g.fillRect(x0 + 6, y0 + 14, T - 12, 2); g.fillRect(x0 + 6, y0 + 52, T - 12, 2); g.fillRect(x0 + 6, y0 + 32, T - 12, 2); break;
      default: win(22, 20, T - 44, 26);
    }
    // alpha marks glass so lit windows can be drawn at night
    const img = g.getImageData(x0, y0, T, T), gl = hex2rgb(t.glass).map(v => Math.round(v * 255));
    const glassA = t.facade === 'temple' ? 64 : 128;   // 64: always lit after dark (palace classrooms), 128: some lit
    for (let p = 0; p < img.data.length; p += 4) if (Math.abs(img.data[p] - gl[0]) < 3 && Math.abs(img.data[p + 1] - gl[1]) < 3 && Math.abs(img.data[p + 2] - gl[2]) < 3) img.data[p + 3] = glassA;
    g.putImageData(img, x0, y0);
  });
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.NoColorSpace; tex.flipY = false; tex.generateMipmaps = false; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.premultiplyAlpha = false; U.uAtlas.value = tex; U.uAtlasN.value = N;
}

/* trees: crowns of soft balls and a trunk, colours from city.json's tree rules */
function treeRule(species) { const T = CITY.trees || {}; for (const r of T.rules || []) if (r.match && new RegExp(r.match, 'i').test(species)) return r; return null; }
function buildTrees(season) {
  const T = CITY.trees || {}, def = T.default || {};
  for (const [i, tr] of (SCENE.trees || []).entries()) {
    const [x, y, si, extra] = tr, species = extra || (si >= 0 ? SCENE.species[si] : '') || '';
    const rule = treeRule(species); let look = { ...def };
    if (rule && rule.mix) { const tot = rule.mix.reduce((s, m) => s + (m.share || 1), 0); let h = hashStr('t' + i) % 1000 / 1000 * tot; for (const m of rule.mix) { h -= m.share || 1; if (h <= 0) { look = { ...look, ...m }; break; } } }
    else if (rule) look = { ...look, ...rule };
    const vary = 1 + ((hashStr('h' + i) % 100) / 100 - .5) * (rule && rule.vary || .3);
    const h = (look.height || 9) * vary, cols = look.colours || ['#7fa868'];
    let col = cols[hashStr('c' + i) % cols.length];
    if (season === 'spring' && look.blossom) col = look.blossom; else if (season === 'spring' && look.spring) col = look.spring;
    else if (season === 'monsoon' && !look.evergreen && look.autumn) col = mix(col, look.autumn, .4);
    stick([x, y, 0], [x, y, h * .55], .18 * vary, '#9b795d');
    if (look.style === 5) {   // conifer: stacked cones
      for (let k = 0; k < 3; k++) { const r0 = h * (.32 - k * .08), z0 = h * (.25 + k * .22); peak(polygon(x, y, r0, 8), z0, [x, y, z0 + h * .38], col); }
    } else {
      const r = h * .3;
      ball([x, y, h * .66], r, soft(col)); ball([x + r * .45, y - r * .2, h * .56], r * .72, soft(mix(col, '#ffffff', .06))); ball([x - r * .4, y + r * .3, h * .58], r * .7, soft(mix(col, '#51465a', .06)));
    }
  }
}

/* street furniture and lamps */
const LAMP = CITY.lamp || {};
function buildFurniture() {
  for (const f of SCENE.furniture || []) {
    if (f.k === 'bench') { shape(atZ(rect(f.x, f.y, 1.6, .5), .45), '#9b795d', .4); stick([f.x - .7, f.y, 0], [f.x - .7, f.y, .45], .05, '#6c716e'); stick([f.x + .7, f.y, 0], [f.x + .7, f.y, .45], .05, '#6c716e'); }
    else if (f.k === 'bus_stop') { solidBox(rect(f.x, f.y, 3, 1.4), 2.5, 2.7, '#c9ccc7'); stick([f.x - 1.3, f.y, 0], [f.x - 1.3, f.y, 2.5], .05, '#6c716e'); stick([f.x + 1.3, f.y, 0], [f.x + 1.3, f.y, 2.5], .05, '#6c716e'); }
  }
  if (LAMP.auto !== false) for (const c of SCENE.centerlines || []) { const p = c.p; let carry = 0, side = 1;
    for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L;
      for (let s = 30 - carry; s < L; s += 30) { side = -side; const x = a[0] + ux * s - uy * 6 * side, y = a[1] + uy * s + ux * 6 * side;
        if (Math.abs(x) > HALF - 2 || Math.abs(y) > HALF - 2) continue; lampPost(x, y); }
      carry = (carry + L) % 30; } }
}
function solidBox(fp, z0, z1, col) { loft(atZ(fp, z0), atZ(fp, z1), col); shape(atZ(fp, z1), col, .5); }
const LAMPS = [];
function lampPost(x, y) { const h = LAMP.height || 6; stick([x, y, 0], [x, y, h], .08, LAMP.colour || '#6c716e'); ball([x, y, h + .1], .3, '#fff3c4'); LAMPS.push([x, y]); lightPool(x, y, 5, '#ffcf7a', .45); }

/* ====================== people and cars ====================== */
const MOVERS = [];
let peds = null, heads = null, cars = null, umbs = null;
function routeLen(p) { let L = 0; for (let i = 0; i < p.length - 1; i++) L += Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]); return L; }
function at(p, s) { for (let i = 0; i < p.length - 1; i++) { const a = p[i], b = p[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (s <= L || i === p.length - 2) { const t = L ? Math.min(1, s / L) : 0; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(b[1] - a[1], b[0] - a[0])]; } s -= L; } return [p[0][0], p[0][1], 0]; }
function buildMovers() {
  const R = (SCENE.routes || []).filter(r => r.p && r.p.length > 1).map(r => ({ ...r, L: routeLen(r.p) })).filter(r => r.L > 8);
  const pedR = R.filter(r => r.kind === 'ped'), carR = R.filter(r => r.kind === 'car');
  const P = CITY.people || {}, V = CITY.vehicles || {};
  const nPed = phone ? 160 : 320, nCar = phone ? 16 : 30;
  const rnd = (i, k) => (hashStr(i + ':' + k) % 10000) / 10000;
  for (let i = 0; i < nPed && pedR.length; i++) { const r = pedR[Math.floor(rnd(i, 1) * pedR.length)]; MOVERS.push({ kind: 'ped', r, s: rnd(i, 2) * r.L, v: (1.0 + rnd(i, 3) * .5) * (rnd(i, 4) > .5 ? 1 : -1), off: (rnd(i, 5) - .5) * 2.4, col: pickOf(P.clothes || ['#3d4a5e'], 'p' + i), umb: pickOf(P.umbrellas || ['#2f3540'], 'u' + i), i }); }
  for (let i = 0; i < nCar && carR.length; i++) { const r = carR[Math.floor(rnd(i, 6) * carR.length)]; const taxi = V.taxi && rnd(i, 7) < (V.taxi.share || 0);
    MOVERS.push({ kind: 'car', r, s: rnd(i, 8) * r.L, v: (6 + rnd(i, 9) * 4) * (rnd(i, 10) > .5 ? 1 : -1), off: 0, col: taxi ? V.taxi.colours[0] : pickOf(V.colours || ['#c9ccd0'], 'c' + i), i }); }
  const nP = MOVERS.filter(m => m.kind === 'ped').length, nC = MOVERS.filter(m => m.kind === 'car').length;
  const toon = () => shareUniforms(toonMaterial());
  const withAttrs = g => { const n = g.attributes.position.count; g.setAttribute('aCol', new THREE.Float32BufferAttribute(new Float32Array(n * 3).fill(1), 3)); g.setAttribute('aLit', new THREE.Float32BufferAttribute(new Float32Array(n), 1)); g.setAttribute('aTile', new THREE.Float32BufferAttribute(new Float32Array(n).fill(-1), 1)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2)); return g; };
  const body = withAttrs(new THREE.CylinderGeometry(.22, .26, 1.25, 6).rotateX(Math.PI / 2).translate(0, 0, .62));
  const head = withAttrs(new THREE.IcosahedronGeometry(.15, 1).translate(0, 0, 1.42));
  const car = withAttrs(new THREE.BoxGeometry(4.2, 1.8, 1.0).translate(0, 0, .65)); const cabin = withAttrs(new THREE.BoxGeometry(2.3, 1.6, .6).translate(-.2, 0, 1.45));
  const umb = withAttrs(new THREE.ConeGeometry(.6, .3, 8).rotateX(Math.PI / 2).translate(0, 0, 2.05));
  peds = new THREE.InstancedMesh(body, toon(), nP); heads = new THREE.InstancedMesh(head, toon(), nP); umbs = new THREE.InstancedMesh(umb, toon(), nP);
  const carGeo = mergeGeos([car, cabin]); cars = new THREE.InstancedMesh(carGeo, toon(), Math.max(1, nC));
  let ip = 0, ic = 0; const c = new THREE.Color();
  for (const m of MOVERS) { if (m.kind === 'ped') { m.k = ip++; peds.setColorAt(m.k, c.set(m.col)); heads.setColorAt(m.k, c.set('#e9c9a6')); umbs.setColorAt(m.k, c.set(m.umb)); } else { m.k = ic++; cars.setColorAt(m.k, c.set(m.col)); } }
  for (const im of [peds, heads, umbs, cars]) { im.frustumCulled = false; im.castShadow = false; im.receiveShadow = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; scene.add(im); }
}
function mergeGeos(gs) { const out = new THREE.BufferGeometry(), names = Object.keys(gs[0].attributes);
  for (const n of names) { const arrs = gs.map(g => (g.index ? g.toNonIndexed() : g).attributes[n].array); const tot = arrs.reduce((s, a) => s + a.length, 0); const f = new Float32Array(tot); let o = 0; for (const a of arrs) { f.set(a, o); o += a.length; } out.setAttribute(n, new THREE.BufferAttribute(f, gs[0].attributes[n].itemSize)); }
  return out; }
const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), Vp = new THREE.Vector3(), Vs = new THREE.Vector3(1, 1, 1), Zax = new THREE.Vector3(0, 0, 1), HID = new THREE.Vector3(0, 0, 0);
function moveMovers(dt) {
  if (!peds) return;
  const crowd = STATE.crowd ?? 1, wet = !!STATE.wet;
  for (const m of MOVERS) {
    m.s += m.v * dt; if (m.s > m.r.L) { m.s = m.r.L; m.v = -m.v; } if (m.s < 0) { m.s = 0; m.v = -m.v; }
    const [x, y, a] = at(m.r.p, m.s), dir = m.v > 0 ? a : a + Math.PI, nx = -Math.sin(a), ny = Math.cos(a), off = m.kind === 'car' ? (m.v > 0 ? -1.8 : 1.8) : m.off;
    const shown = m.kind === 'car' || (m.i % 100) / 100 < crowd * .55;
    Q.setFromAxisAngle(Zax, dir); Vp.set(x + nx * off, y + ny * off, 0);
    M4.compose(Vp, Q, shown ? Vs : HID);
    if (m.kind === 'ped') { peds.setMatrixAt(m.k, M4); heads.setMatrixAt(m.k, M4); M4.compose(Vp, Q, shown && wet ? Vs : HID); umbs.setMatrixAt(m.k, M4); }
    else cars.setMatrixAt(m.k, M4);
  }
  for (const im of [peds, heads, umbs, cars]) im.instanceMatrix.needsUpdate = true;
}

/* ====================== weather: rain, drizzle, haze; glows at night ====================== */
let rain = null;
function buildRain() {
  const N = phone ? 2500 : 6000, pos = new Float32Array(N * 6), seed = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { seed[i * 3] = Math.random(); seed[i * 3 + 1] = Math.random(); seed[i * 3 + 2] = Math.random(); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.LineBasicMaterial({ color: 0x7d8fa3, transparent: true, opacity: .45, depthWrite: false });
  rain = new THREE.LineSegments(g, m); rain.frustumCulled = false; rain.visible = false; rain.userData = { N, seed }; scene.add(rain);
}
function moveRain(t) {
  if (!rain || !rain.visible) return;
  const { N, seed } = rain.userData, p = rain.geometry.attributes.position.array, k = ppu(camera);
  const span = Math.max(W, H) / k * 1.2, drizzle = STATE.wx === 'drizzle', len = drizzle ? .7 : 1.8, speed = drizzle ? 6 : 16, top = 70;
  const n = drizzle ? Math.floor(N * .5) : N;
  for (let i = 0; i < N; i++) {
    const o = i * 6; if (i >= n) { p.fill(0, o, o + 6); continue; }
    const x = camera.x + (seed[i * 3] - .5) * span, y = camera.y + (seed[i * 3 + 1] - .5) * span, z = top - ((seed[i * 3 + 2] * top + t * speed) % top);
    p[o] = x; p[o + 1] = y; p[o + 2] = z; p[o + 3] = x + .4; p[o + 4] = y + .2; p[o + 5] = z - len;
  }
  rain.geometry.attributes.position.needsUpdate = true;
}
let glowMesh = null;
function buildGlows() {
  const geo = new THREE.CircleGeometry(1, 24), n = GLOWS.length; if (!n) return;
  const mat = new THREE.ShaderMaterial({ uniforms: { uNight: U.uNight }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.); }',
    fragmentShader: 'uniform float uNight; varying vec2 vP; void main(){ float d = length(vP); gl_FragColor = vec4(vec3(1., .81, .48) * (1. - smoothstep(.2, 1., d)) * .55 * uNight, 1.); }' });
  glowMesh = new THREE.InstancedMesh(geo, mat, n); const m = new THREE.Matrix4();
  GLOWS.forEach((g, i) => { m.makeScale(g.r, g.r, 1); m.setPosition(g.x, g.y, g.z + .15); glowMesh.setMatrixAt(i, m); });
  glowMesh.frustumCulled = false; glowMesh.renderOrder = 3; scene.add(glowMesh);
}

/* ====================== sun, weather and time: 淡水 now ====================== */
const CFG = LIVE_CFG, fixedAt = params.get('at'), fixedWx = params.get('wx');
const STATE = { wx: 'clear', crowd: 1, wet: false, level: 0, base: 'summer' };
let weather = null, temp = null, failed = false;
function sunPosition(date, lat, lon) {   // NOAA's approximate solar position: altitude and azimuth (from north, clockwise), degrees
  const rad = Math.PI / 180, d = date.getTime() / 86400000 - 10957.5;
  const g = (357.529 + 0.98560028 * d) * rad, L = (280.459 + 0.98564736 * d) * rad;
  const lam = L + (1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad, eps = (23.439 - 0.00000036 * d) * rad;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam)), ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
  const gmst = (18.697374558 + 24.06570982441908 * d) % 24, ha = ((gmst * 15 + lon) * rad) - ra, la = lat * rad;
  const alt = Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(ha));
  const az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(la) - Math.sin(la) * Math.cos(ha));
  return { alt: alt / rad, az: ((az / rad) + 360) % 360 };
}
const now = () => fixedAt ? new Date(fixedAt + (/[zZ]|[+-]\d\d:?\d\d$/.test(fixedAt) ? '' : '+08:00')) : new Date();
const tz = CFG.place.timezone;
const monthOf = t => Number(new Intl.DateTimeFormat('en', { timeZone: tz, month: 'numeric' }).format(t));
const hourOf = t => Number(new Intl.DateTimeFormat('en', { timeZone: tz, hour: 'numeric', hourCycle: 'h23' }).format(t));
const clock = t => new Intl.DateTimeFormat('zh-TW', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(t);
const sunLight = new THREE.DirectionalLight(0xffffff, 1); sunLight.castShadow = true;
sunLight.shadow.mapSize.set(phone ? 2048 : 4096, phone ? 2048 : 4096);
Object.assign(sunLight.shadow.camera, { left: -HALF * 1.15, right: HALF * 1.15, top: HALF * 1.15, bottom: -HALF * 1.15, near: 1, far: 3000 });
sunLight.shadow.bias = -0.0004; sunLight.shadow.normalBias = .3;
scene.add(sunLight, sunLight.target);
let builtSeason = null, treeMeshes = [];
function applyState() {
  const t = now(), base = CFG.months[monthOf(t) - 1], { alt, az } = sunPosition(t, CFG.place.lat, CFG.place.lon);
  const level = CFG.levels.findIndex(l => alt >= l.minSun), wx = fixedWx || weather || CFG.fallback[base] || 'clear';
  Object.assign(STATE, { base, wx, level: level < 0 ? CFG.levels.length - 1 : level, alt });
  const W_ = CFG.weathers[wx] || CFG.weathers.clear, lv = CFG.levels[STATE.level];
  STATE.wet = !!(W_.set && W_.set.wet); STATE.crowd = (CFG.bases[base]?.crowd ?? 1) * (W_.crowd ?? 1) * (lv.crowd ?? 1);
  // light: the sun's direction in plot coordinates (north from the scene; east is north turned clockwise)
  const N = META.north, E = [N[1], -N[0]], ra = alt * Math.PI / 180, za = az * Math.PI / 180;
  const sunDir = new THREE.Vector3(Math.cos(ra) * (Math.sin(za) * E[0] + Math.cos(za) * N[0]), Math.cos(ra) * (Math.sin(za) * E[1] + Math.cos(za) * N[1]), Math.sin(ra)).normalize();
  const day = alt > 2;
  // dusk and night: the 2D kit's night colouring, growing as the sun goes down (strength .88 at full night)
  U.uNight.value = .88 * Math.max(0, Math.min(1, (4 - alt) / 12));
  U.uLitShare.value = .6 * Math.max(0, Math.min(1, (6 - alt) / 10));
  U.uShadowOn.value = day && wx !== 'rain' && wx !== 'fog' ? 1 : 0;
  // face shading keeps the 2D kit's fixed light (its SUN), so walls read as in the original drawings; the real sun casts the shadows
  U.uTone.value.copy(new THREE.Vector3(-.47, -.63, .91).normalize());
  sunLight.position.set(sunDir.x * 1000, sunDir.y * 1000, Math.max(.05, sunDir.z) * 1000); sunLight.target.position.set(0, 0, 0);
  renderer.shadowMap.needsUpdate = true;
  U.uWet.value = STATE.wet ? 1 : 0;
  if (rain) rain.visible = wx === 'rain' || wx === 'drizzle';
  haze.style.opacity = wx === 'fog' ? 1 : 0;
  if (builtSeason !== base) rebuildTrees(base);
  const parts = [`${clock(t)} · ${(hourOf(t) < 12 && lv.morning) || lv.label} · ${CFG.weathers[wx].label}`];
  if (temp != null && !fixedWx) parts.push(`${Math.round(temp)}°C`);
  const a = document.createElement('a'); a.href = CFG.note.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Open-Meteo ↗';
  $('note').replaceChildren(document.createTextNode(parts.join(' · ') + (failed && !fixedWx ? '（暫時取不到即時天氣，顯示這個月份的典型天氣）' : '') + ' 天氣資料：'), a);
  if (appWx) appWx.textContent = '淡水 ' + parts.join(' · ');
  dirty = true;
}
async function fetchWeather() {
  if (!fixedWx) try {
    const p = CFG.place, url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=weather_code,temperature_2m&timezone=${encodeURIComponent(p.timezone)}`;
    const r = await fetch(url, { cache: 'no-store' }); if (!r.ok) throw new Error('HTTP ' + r.status);
    const c = (await r.json()).current; weather = Object.keys(CFG.wmo).find(k => Array.isArray(CFG.wmo[k]) && CFG.wmo[k].includes(c.weather_code)) || 'clear'; temp = c.temperature_2m; failed = false;
  } catch (e) { failed = true; }
  applyState();
}
function rebuildTrees(base) {
  for (const m of treeMeshes) { scene.remove(m); m.geometry.dispose(); }
  geoReset(); buildTrees(base); builtSeason = base;
  const m = meshFromGEO('flat'); treeMeshes = m ? [m] : []; if (m) scene.add(m);
  renderer.shadowMap.needsUpdate = true;
}

/* ====================== build everything ====================== */
function build() {
  buildGround();
  // buildings: hand-built landmarks first, then every other outline as a generic block
  geoReset();
  const replaced = new Set(); for (const lm of LANDMARKS) for (const id of lm.ids || []) replaced.add(id);
  for (const lm of LANDMARKS) {
    try { const r = lm.build(), parts = [].concat(r || []).filter(o => o && typeof o.draw === 'function'); for (const o of parts) o.draw(); collectLabel(lm.name, parts); collectPick(lm.name, parts); }
    catch (e) { console.warn('landmark', lm.name, e); }
  }
  for (const b of SCENE.buildings) if (!replaced.has(b.id) && !replaced.has(b.of)) { try { genericBuilding(b); PICKS.push({ name: b.n || '', fps: [b.ring], h: b.h ?? (b.lv ? b.lv * LEVEL : 10) }); } catch (e) { console.warn('building', b.id, e); } }
  buildFurniture();
  if (typeof LANTERN_AT === 'function') for (const [x, y] of LANTERN_AT()) lightPool(x, y, 3.6, '#ffe7a8', .5);
  drawAtlas();
  for (const m of [meshFromGEO('flat'), meshFromGEO('wall'), inkFromGEO(), glassFromGEO()]) if (m) { scene.add(m); if (m.isMesh && !m.material.transparent) PICKABLE.push(m); }
  buildGlows();
  buildMovers(); buildRain(); buildLabels();
}

/* ====================== landmark names ====================== */
const LABEL_SKIP = /^(亭|宮燈大道 beds|操場燈柱與圍網|籃球架|大忠管制站|勤務監控管制站)/;
const LABEL_RENAME = { '宮燈大道 lanterns': '宮燈大道', '操場與球場': '操場', '松濤2館 · 文錙藝術中心': '松濤2館 · 文錙' };
const LABELS = new Map();
const areaOfFp = r => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
function collectLabel(name, parts) {
  if (!parts.length || LABEL_SKIP.test(name)) return;
  const base = name.replace(/ w\d+$/, ''), key = LABEL_RENAME[name] || LABEL_RENAME[base] || base;
  // a landmark spread over many parts (the track and courts) is labelled at its largest part
  let use = parts; if (key === '操場') use = [parts.reduce((m, p) => areaOfFp(p.fp) > areaOfFp(m.fp) ? p : m, parts[0])];
  const L = LABELS.get(key) || { name: key, pts: [], h: 0, area: 0 };
  for (const p of use) { L.pts.push(...p.fp); L.h = Math.max(L.h, p.h || 0); L.area += areaOfFp(p.fp); }
  LABELS.set(key, L);
}
const labelLayer = document.createElement('div');
labelLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:2;overflow:hidden';
const lcss = document.createElement('style');
lcss.textContent = `.lmk{position:absolute;transform:translate(-50%,-100%);pointer-events:auto;cursor:pointer;white-space:nowrap;font:600 11px/1 var(--sans,sans-serif);color:#24433a;background:#fffcf2ee;border:1px solid #9fb3a6;border-radius:999px;padding:4px 8px;box-shadow:0 2px 0 #7b80661a}
.lmk::after{content:'';position:absolute;left:50%;top:100%;width:1px;height:9px;background:#7f948a}
.lmk:hover{background:#2f4f43;color:#fff;border-color:#2f4f43}
.lmk.night{background:#24332ee6;color:#f4efe2;border-color:#5e7a6e}
#showLabels{margin-right:6px;vertical-align:-2px}`;
document.head.appendChild(lcss);
let labelEls = [], labelsOn = true;
try { labelsOn = localStorage.getItem('tku-labels') !== 'off'; } catch (_) {}
function buildLabels() {
  stage.insertBefore(labelLayer, canvas.nextSibling);
  labelEls = [...LABELS.values()].map(L => {
    const xs = L.pts.map(p => p[0]), ys = L.pts.map(p => p[1]);
    const x = (Math.min(...xs) + Math.max(...xs)) / 2, y = (Math.min(...ys) + Math.max(...ys)) / 2;
    const el = document.createElement('div'); el.className = 'lmk'; el.textContent = L.name; el.title = '飛到 ' + L.name;
    el.onclick = () => { const pg = pickGroups.get(L.name); if (APP && pg) return flyTo(pg); freeView(); goal = { ...goal, x, y, z: Math.min(L.h, 20) / 2, zoom: Math.max(goal.zoom, iso.zoom * 6) }; dirty = true; };
    labelLayer.appendChild(el);
    return { el, pos: new THREE.Vector3(x, y, L.h + 2), area: L.area, w: 0 };
  }).sort((a, b) => b.area - a.area);   // bigger landmarks win when names overlap
  const sw = document.createElement('label'); sw.className = 'key-text'; sw.style.display = 'block';
  sw.innerHTML = '<input type="checkbox" id="showLabels">顯示地標名稱（點名稱可飛過去）';
  how.after(sw); const cb = sw.querySelector('input'); cb.checked = labelsOn;
  cb.onchange = () => { labelsOn = cb.checked; labelLayer.hidden = !labelsOn; try { localStorage.setItem('tku-labels', labelsOn ? 'on' : 'off'); } catch (_) {} };
  labelLayer.hidden = !labelsOn;
}
const V3 = new THREE.Vector3();
function placeLabels() {
  if (!labelsOn || !labelEls.length) return;
  const placed = [], night = U.uNight.value > .45;
  for (const L of labelEls) {
    V3.copy(L.pos).project(cam);
    const x = (V3.x + 1) / 2 * W, y = (1 - V3.y) / 2 * H;
    if (!L.w) L.w = L.el.offsetWidth || 60;
    const box = [x - L.w / 2 - 3, y - 34, x + L.w / 2 + 3, y + 2];
    const off = x < -40 || x > W + 40 || y < 10 || y > H + 20, hit = placed.some(b => b[0] < box[2] && box[0] < b[2] && b[1] < box[3] && box[1] < b[3]);
    const show = !off && !hit;
    L.el.style.display = show ? '' : 'none';
    if (show) { placed.push(box); L.el.style.left = x.toFixed(1) + 'px'; L.el.style.top = (y - 9).toFixed(1) + 'px'; L.el.classList.toggle('night', night); }
  }
}

/* ====================== controls ====================== */
const smallerMotion = matchMedia('(prefers-reduced-motion:reduce)').matches;
function setView(name) {
  view = name; markViews();
  if (cameras[name]) goal = { ...cameras[name] };
  if (name === 'cine') movie = 0;
  $('viewName').textContent = name === 'free' ? '自由視角' : (viewList.find(v => v[0] === name) || [, ''])[1];
  dirty = true;
}
function freeView() { if (view !== 'free') setView('free'); }
function zoomBy(f) { freeView(); goal.zoom = Math.max(minZoom, Math.min(maxZoom, goal.zoom * f)); dirty = true; }
views.replaceChildren(...viewList.map(([id, label]) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'vbtn'; b.textContent = label; b.dataset.v = id; b.onclick = () => setView(id); return b; }));
function markViews() { views.querySelectorAll('.vbtn').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === view)); }
$('zIn').onclick = () => zoomBy(1.25); $('zOut').onclick = () => zoomBy(.8);
let panMode = false; panBtn.onclick = () => { panMode = !panMode; panBtn.setAttribute('aria-pressed', panMode); canvas.focus(); };
function moveBy(dx, dy, from) {
  const k = ppu(camera), t = camera.yaw * Math.PI / 180, p = camera.pitch * Math.PI / 180, st = Math.sin(t), ct = Math.cos(t), sp = Math.sin(p);
  const sx = dx / k, sy = dy / k, qx = -st * sx + ct * sy / sp, qy = ct * sx + st * sy / sp;
  freeView(); goal.x = Math.max(-HALF * 1.05, Math.min(HALF * 1.05, from.x - qx)); goal.y = Math.max(-HALF * 1.05, Math.min(HALF * 1.05, from.y - qy)); dirty = true;
}
const touches = new Map(); let base = null, pan = null;
const mid = () => { const p = [...touches.values()]; return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 }; };
function resetTouch() { const p = [...touches.values()]; base = p.length ? { x: p[0].x, y: p[0].y, yaw: goal.yaw, pitch: goal.pitch, zoom: goal.zoom, dist: p[1] ? Math.max(1, Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)) : 0, mid: p[1] ? mid() : null, from: { x: goal.x, y: goal.y } } : null; }
canvas.oncontextmenu = e => e.preventDefault();
canvas.onpointerdown = e => {
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  if (e.pointerType !== 'touch' && (e.button === 2 || e.button === 1 || (e.button === 0 && (e.shiftKey || panMode)))) { pan = { id: e.pointerId, x: e.clientX, y: e.clientY, from: { x: goal.x, y: goal.y } }; return; }
  if (e.pointerType === 'touch' && panMode && touches.size === 0) { pan = { id: e.pointerId, x: e.clientX, y: e.clientY, from: { x: goal.x, y: goal.y } }; return; }
  if (e.button !== 0 && e.pointerType !== 'touch') return;
  touches.set(e.pointerId, { x: e.clientX, y: e.clientY }); resetTouch();
};
canvas.onpointermove = e => {
  if (pan && e.pointerId === pan.id) { moveBy(e.clientX - pan.x, e.clientY - pan.y, pan.from); return; }
  if (!touches.has(e.pointerId)) return; touches.set(e.pointerId, { x: e.clientX, y: e.clientY }); const p = [...touches.values()], b = base;
  if (p.length === 2 && b.dist) { freeView(); goal.zoom = Math.max(minZoom, Math.min(maxZoom, b.zoom * Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) / b.dist)); const m = mid(); moveBy(m.x - b.mid.x, m.y - b.mid.y, b.from); }
  else if (p.length === 1 && Math.hypot(p[0].x - b.x, p[0].y - b.y) > 2) { freeView(); goal.yaw = b.yaw - (p[0].x - b.x) * .36; goal.pitch = Math.max(12, Math.min(80, b.pitch + (p[0].y - b.y) * .22)); }
  dirty = true;
};
canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = e => { if (pan && e.pointerId === pan.id) { pan = null; return; } touches.delete(e.pointerId); resetTouch(); };
canvas.addEventListener('wheel', e => { e.preventDefault(); zoomBy(Math.exp(-Math.max(-120, Math.min(120, e.deltaY * (e.deltaMode === 1 ? 16 : 1))) * .0018)); }, { passive: false });
canvas.ondblclick = () => setView('cine');
canvas.tabIndex = 0;
canvas.onkeydown = e => {
  const mv = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] }[e.key];
  if (mv) { e.preventDefault(); moveBy(mv[0], mv[1], { x: goal.x, y: goal.y }); }
  else if (e.key === 'Home') setView('cine'); else if (['+', '='].includes(e.key)) zoomBy(1.25); else if (e.key === '-') zoomBy(.8);
};

/* ====================== picking: which building is under a tap, and flying to it ====================== */
const PICKS = [], PICKABLE = [], pickGroups = new Map();
const PICK_ALIAS = { '操場燈柱與圍網': '操場', '籃球架': '操場', '宮燈大道 beds': '宮燈大道' };   // small parts count as the landmark they belong to
function collectPick(name, parts) {
  const base = name.replace(/ w\d+$/, ''), key0 = LABEL_RENAME[name] || LABEL_RENAME[base] || base, key = PICK_ALIAS[key0] || key0;
  let g = pickGroups.get(key); if (!g) { g = { name: key, fps: [], h: 0 }; pickGroups.set(key, g); PICKS.unshift(g); }   // landmarks before generic outlines
  for (const p of parts) if (p.fp && p.fp.length > 2) { g.fps.push(p.fp); g.h = Math.max(g.h, p.h || p.z1 || 0); }
}
// fly so the whole building fills about 60% of the shorter side of the screen
function flyTo(g) {
  const pts = g.fps.flat(), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const x = (Math.min(...xs) + Math.max(...xs)) / 2, y = (Math.min(...ys) + Math.max(...ys)) / 2;
  const span = Math.max(12, Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), (g.h || 0) * 1.2);
  const zoom = Math.min(W, H) * .6 / span / (Math.min(W / 302, H / 202) * K);
  freeView(); goal = { ...goal, x, y, z: Math.min(g.h || 8, 24) / 2, zoom: Math.max(iso.zoom * 2.5, Math.min(maxZoom, zoom)) }; dirty = true;
}
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), HIT = new THREE.Vector3();
function buildingAt(x, y) { return PICKS.find(g => g.fps.some(fp => inPoly([x, y], fp))); }
function pickAt(cx, cy) {
  const r = canvas.getBoundingClientRect(); ndc.set((cx - r.left) / r.width * 2 - 1, -(cy - r.top) / r.height * 2 + 1);
  ray.setFromCamera(ndc, cam);
  for (const h of ray.intersectObjects(PICKABLE, false).slice(0, 8)) {
    HIT.copy(h.point).addScaledVector(ray.ray.direction, .6);   // a little way in, so a hit on a wall falls inside the outline
    const g = buildingAt(HIT.x, HIT.y); if (g) { flyTo(g); return g; }
  }
  // flat landmarks (the track, the plazas) are drawn on the ground: try where the tap meets the ground
  const r0 = ray.ray, t = r0.direction.z ? -r0.origin.z / r0.direction.z : -1;
  if (t > 0) { const g = buildingAt(r0.origin.x + r0.direction.x * t, r0.origin.y + r0.direction.y * t); if (g) { flyTo(g); return g; } }
  return null;
}

/* the app's gestures: one finger (or the left mouse button) moves the map, two fingers zoom, move and turn it,
   the right mouse button or Shift turns it, a tap flies to the building under it */
let appHeld = 0;
if (APP) {
  const pts = new Map(); let g0 = null, tap = null;
  const snap = () => { const p = [...pts.values()]; g0 = !p.length ? null : { from: { x: goal.x, y: goal.y }, yaw: goal.yaw, pitch: goal.pitch, zoom: goal.zoom,
    c: p[1] ? { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 } : { x: p[0].x, y: p[0].y },
    d: p[1] ? Math.max(1, Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y)) : 0, a: p[1] ? Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x) : 0 }; };
  canvas.onpointerdown = e => {
    if (e.pointerType !== 'touch' && ![0, 2].includes(e.button)) return;
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY, turn: e.pointerType !== 'touch' && (e.button === 2 || e.shiftKey) });
    tap = pts.size === 1 ? { x: e.clientX, y: e.clientY, t: performance.now() } : null; appHeld = pts.size; snap();
  };
  canvas.onpointermove = e => {
    const q = pts.get(e.pointerId); if (!q) return; q.x = e.clientX; q.y = e.clientY;
    if (tap && Math.hypot(e.clientX - tap.x, e.clientY - tap.y) > 8) tap = null;
    const p = [...pts.values()], b = g0; if (!b) return;
    if (p.length === 1 && p[0].turn) { freeView(); goal.yaw = b.yaw - (p[0].x - b.c.x) * .36; goal.pitch = Math.max(12, Math.min(80, b.pitch + (p[0].y - b.c.y) * .22)); }
    else if (p.length === 1) moveBy(p[0].x - b.c.x, p[0].y - b.c.y, b.from);
    else if (p.length === 2) {
      freeView(); goal.zoom = Math.max(minZoom, Math.min(maxZoom, b.zoom * Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) / b.d));
      goal.yaw = b.yaw + (Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x) - b.a) * 180 / Math.PI;
      moveBy((p[0].x + p[1].x) / 2 - b.c.x, (p[0].y + p[1].y) / 2 - b.c.y, b.from);
    }
    dirty = true;
  };
  canvas.onpointerup = canvas.onpointercancel = e => {
    if (!pts.has(e.pointerId)) return;
    const wasTap = tap && e.type === 'pointerup' && pts.size === 1 && performance.now() - tap.t < 450;
    pts.delete(e.pointerId); tap = null; appHeld = pts.size; snap();
    if (wasTap) pickAt(e.clientX, e.clientY);
  };
  canvas.onlostpointercapture = null;
  canvas.ondblclick = null;
}

/* ====================== loop ====================== */
let dirty = true, lastT = 0, simT = 0;
function resize() {
  const r = stage.getBoundingClientRect(); W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
  renderer.setSize(W, H, false); canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  const p = phoneProfile(); if (p !== phone) { phone = p; how.textContent = howText(); }
  dirty = true;
}
new ResizeObserver(resize).observe(stage);
function tick(nowMs) {
  requestAnimationFrame(tick);
  const dt = Math.min(.1, (nowMs - (lastT || nowMs)) / 1000); lastT = nowMs;
  if (document.hidden) return;
  simT += dt; U.uTime.value = simT;
  if (view === 'cine') { movie += dt; const k = (1 - Math.cos(movie * .095)) * .5; goal = { yaw: iso.yaw + 38 * k, pitch: iso.pitch - 9 * k, zoom: iso.zoom * (1 + .44 * k), x: iso.x, y: iso.y, z: iso.z }; }
  const smooth = smallerMotion ? 1 : 1 - Math.exp(-dt * (touches.size || pan || appHeld ? 19 : 6.5));
  for (const k of Object.keys(goal)) { let d = goal[k] - camera[k]; if (k === 'yaw') d = ((d + 180) % 360 + 360) % 360 - 180; camera[k] = Math.abs(d) < 1e-4 ? goal[k] : camera[k] + d * smooth; }
  $('zIn').disabled = goal.zoom >= maxZoom; $('zOut').disabled = goal.zoom <= minZoom;
  moveMovers(dt); moveRain(simT);
  applyCamera(camera);
  renderer.render(scene, cam);
  placeLabels();
  if (!$('loading').hidden) $('loading').hidden = true;
}

/* ====================== start ====================== */
resize(); applyCamera(camera);
$('loading').textContent = '正在搭建 3D 校園…';
setTimeout(() => {
  build(); setView(APP ? 'iso' : 'cine'); applyState(); fetchWeather(); setInterval(fetchWeather, 10 * 60 * 1000); setInterval(applyState, 60 * 1000);
  requestAnimationFrame(tick);
  window.__three = { scene, renderer, cam, U, STATE, setView, pickAt, PICKS, get camera() { return camera; }, get goal() { return goal; }, set goal(g) { goal = g; } };
}, 30);
})();
