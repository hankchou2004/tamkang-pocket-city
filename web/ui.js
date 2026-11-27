/* Page layout and controls for the Tamkang page (added after the engine's page.js by tools/build.py):
   - the upper left card (place, coordinates, the weather now) stays; everything else moves into the lower left
     panel, renamed 地圖導覽: the camera views (one per landmark), how to move the map, and the sources (the footer
     goes; a small OpenStreetMap credit stays on the map);
   - the map can be moved as well as turned: drag with the right button or with Shift held, use two fingers on a
     touch screen, the arrow keys, or switch the 移動 button on so a plain drag moves the map;
   - there is no pause button: the scene always runs. */
(() => {
  const css = document.createElement('style');
  css.textContent = `
#play{display:none!important}
.control-area .views{display:none!important}
.key-sub{margin:8px 0 5px;font:600 10px var(--mono,monospace);letter-spacing:.06em;color:#65705e}
.key-sub:first-child{margin-top:2px}
#views.views-panel{display:flex;flex-wrap:wrap;gap:4px;overflow:visible;max-width:none;padding:0 0 8px;border:0;border-bottom:1px solid var(--rule,#d8d4c4);border-radius:0;background:none;box-shadow:none;-webkit-mask-image:none;mask-image:none}
#views.views-panel .vbtn{flex:none;font-size:11px;padding:4px 8px;border:1px solid #c9cdbf;border-radius:999px;background:#fffcf2}
#views.views-panel .vbtn[aria-pressed="true"]{background:#2f4f43;color:#fff;border-color:#2f4f43}
#panMode[aria-pressed="true"]{background:#2f4f43;color:#fff}
#fig.panning{cursor:grabbing}#fig.pan-ready{cursor:grab}
.foot{display:none!important}
.workspace{height:calc(100% - 64px)!important}
@media(max-width:760px){.workspace{height:calc(100% - 48px)!important}}
@media(max-height:480px) and (orientation:landscape){.workspace{height:calc(100% - 38px)!important}}
.control-area .gesture{display:none!important}
.key-text{font:12px/1.5 var(--serif,serif);color:#5e6a5c;margin:0 2px 6px}
.key-text a{color:inherit}
.key-src{font:10px/1.6 var(--mono,monospace);color:#65705e;margin:0 2px 4px;word-break:break-word}
.key-src a{color:inherit}
.osm-credit{position:absolute;right:10px;bottom:6px;z-index:3;font:9px var(--mono,monospace);color:#65705e;background:#fbf9f0cc;padding:1px 5px;border-radius:4px;text-decoration:none}`;
  document.head.appendChild(css);

  // views: into the legend panel, above the landmark rows
  const views = $('views'), body = $('keyBody');
  if (views && body) {
    views.classList.add('views-panel');
    const h1 = document.createElement('h3'); h1.className = 'key-sub'; h1.textContent = '視角';
    body.prepend(h1, views);
    // the engine's legend shows only its first four rows; every landmark already has a view above, so the rows go
    body.querySelectorAll('[data-f]').forEach(r => r.remove());
    const toggle = $('keyToggle'); if (toggle && toggle.firstChild && toggle.firstChild.nodeType === 3) toggle.firstChild.textContent = '地圖導覽 ';
    // how to move the map, then the sources from the footer, at the end of the panel
    const h3 = document.createElement('h3'); h3.className = 'key-sub'; h3.textContent = '操作';
    const how = document.createElement('p'); how.className = 'key-text'; how.id = 'howTo';
    const h4 = document.createElement('h3'); h4.className = 'key-sub'; h4.textContent = '資料來源';
    const src = document.createElement('div'); src.className = 'key-src';
    const foot = document.querySelector('.foot');
    if (foot) { const metric = foot.querySelector('.metric'), links = foot.querySelector('div:last-child');
      src.innerHTML = (metric ? '範圍 ' + metric.textContent.trim() + '<br>' : '') + (links ? links.innerHTML : ''); }
    const help = body.querySelector('.key-help'); if (help) help.remove();
    body.append(h3, how, h4, src);
  }
  // a small map-data credit stays on the map itself
  const osm = document.createElement('a'); osm.className = 'osm-credit'; osm.href = 'https://www.openstreetmap.org/copyright';
  osm.target = '_blank'; osm.rel = 'noopener'; osm.textContent = '© OpenStreetMap'; $('stage').appendChild(osm);

  // no pause: keep the scene running whatever asks to stop it
  const origPlay = window.setPlay;
  window.setPlay = () => origPlay(true);
  setPlay(true);

  // the move button, where the pause button was
  const MOVE_ICON = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M3 12h18M12 3l-3 3m3-3 3 3M12 21l-3-3m3 3 3-3M3 12l3-3m-3 3 3 3M21 12l-3-3m3 3-3 3"/></svg>';
  const btn = document.createElement('button');
  btn.className = 'tool'; btn.id = 'panMode'; btn.type = 'button'; btn.innerHTML = MOVE_ICON;
  btn.title = '移動畫面（開啟後拖曳即可移動）'; btn.setAttribute('aria-label', '移動畫面'); btn.setAttribute('aria-pressed', 'false');
  $('play').after(btn);
  let panMode = false;
  btn.onclick = () => { panMode = !panMode; btn.setAttribute('aria-pressed', panMode); canvas.classList.toggle('pan-ready', panMode); canvas.focus(); };

  // screen pixels → ground metres for the current camera (inverts the engine's projection on the ground plane)
  const LIMIT = 420;   // keep the centre within the 800 m plot
  function moveBy(dx, dy, from) {
    const ppu = Math.min(W / 302, H / 202) * camera.zoom, K = Math.sqrt(1.5);
    const t = camera.yaw * Math.PI / 180, p = camera.pitch * Math.PI / 180, st = Math.sin(t), ct = Math.cos(t), sp = Math.sin(p);
    const sx = dx / ppu / K, sy = dy / ppu / K;
    const qx = -st * sx + ct * sy / sp, qy = ct * sx + st * sy / sp;
    freeView();
    goal.x = Math.max(-LIMIT, Math.min(LIMIT, from.x - qx));
    goal.y = Math.max(-LIMIT, Math.min(LIMIT, from.y - qy));
    redraw();
  }

  // one-pointer move (right button, Shift, or the move button); everything else goes to the engine's handlers
  const down0 = canvas.onpointerdown, move0 = canvas.onpointermove, up0 = canvas.onpointerup;
  let pan = null, twin = null;
  const mid = () => { const p = [...touches.values()]; return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 }; };
  canvas.oncontextmenu = e => e.preventDefault();
  canvas.onpointerdown = e => {
    if (e.pointerType !== 'touch' && (e.button === 2 || e.button === 1 || (e.button === 0 && (e.shiftKey || panMode)))) {
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {} pan = { id: e.pointerId, x: e.clientX, y: e.clientY, from: { x: goal.x, y: goal.y } };
      canvas.classList.add('panning'); e.preventDefault(); return;
    }
    if (e.pointerType === 'touch' && panMode && touches.size === 0) {
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {} pan = { id: e.pointerId, x: e.clientX, y: e.clientY, from: { x: goal.x, y: goal.y } }; return;
    }
    down0(e);
    if (touches.size === 2) { const m = mid(); twin = { x: m.x, y: m.y, from: { x: goal.x, y: goal.y } }; } else twin = null;
  };
  canvas.onpointermove = e => {
    if (pan && e.pointerId === pan.id) { moveBy(e.clientX - pan.x, e.clientY - pan.y, pan.from); return; }
    move0(e);
    if (twin && touches.size === 2) { const m = mid(); moveBy(m.x - twin.x, m.y - twin.y, twin.from); }
  };
  const end = e => {
    if (pan && e.pointerId === pan.id) { pan = null; canvas.classList.remove('panning'); return; }
    up0(e);
    if (touches.size !== 2) twin = null;
  };
  canvas.onpointerup = canvas.onpointercancel = canvas.onlostpointercapture = end;

  // arrow keys move the map
  canvas.addEventListener('keydown', e => {
    const k = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] }[e.key];
    if (!k) return;
    moveBy(k[0], k[1], { x: goal.x, y: goal.y });
  });

  // Chinese names for the two built-in views
  const NAMES = { 'Cinematic': '自動環繞', 'Free view': '自由視角', 'Bird’s-eye': '鳥瞰', "Bird's-eye": '鳥瞰', 'Isometric': '等角' };
  for (const o of $('view').options) if (NAMES[o.text]) o.text = NAMES[o.text];
  buildViews(); markViews();
  const vn = $('viewName');
  const fixName = () => { const n = NAMES[vn.textContent]; if (n) vn.textContent = n; };
  new MutationObserver(fixName).observe(vn, { childList: true, characterData: true, subtree: true }); fixName();

  // the hint under the map
  const hint = $('hint');
  const text = () => phone ? '單指旋轉 · 雙指移動與縮放 · 按右上角 ✥ 改成單指移動' : '拖曳旋轉 · 右鍵或 Shift 拖曳移動 · 滾輪縮放 · 也可按右上角 ✥ 改成直接拖曳移動';
  const how = $('howTo'); const showHow = () => { if (how) how.textContent = text(); };
  addEventListener('resize', showHow); showHow();
  const setHint = () => { if (hint && hint.textContent !== text()) hint.textContent = text(); };
  if (hint) { new MutationObserver(setHint).observe(hint, { childList: true, characterData: true, subtree: true }); setHint(); }
})();
