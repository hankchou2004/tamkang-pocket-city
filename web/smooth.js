/* Smooth camera motion for the Tamkang page (added after the engine's page.js by tools/build.py).
   The whole-campus overview takes about half a second to draw, so turning, moving or zooming there showed only 3 or 4
   pictures a second. While a new picture is being drawn, this shows the last finished picture moved, scaled and turned
   to the camera as it is now, at the screen's full rate; each new picture replaces it as soon as it is ready, and the
   last one, drawn for the camera where it stops, is exact. Nothing is drawn differently: only the waiting is hidden.
   Moving and zooming are exact (the projection is orthographic); turning and tilting are exact on the ground and lean
   tall buildings a little until the next picture arrives. */
(() => {
  const K = Math.sqrt(1.5);
  const cams = new Map();          // seq → camera the frame was requested with
  let last = null;                 // { cam, canvas } of the picture on screen
  const copy = document.createElement('canvas'), cg = copy.getContext('2d');
  const sg = canvas.getContext('2d');
  window.__smooth = { warps: 0, frames: 0 };

  // remember which camera each request used (workers start at different times, so wrap them as they appear)
  function wrapWorkers() {
    for (const slot of workers) {
      const w = slot.worker; if (w.__wrapped) continue; w.__wrapped = true;
      const post = w.postMessage.bind(w);
      w.postMessage = (m, ...rest) => { if (m && m.seq != null && m.camera) { cams.set(m.seq, { ...m.camera, W: m.width, H: m.height }); if (cams.size > 64) cams.delete(cams.keys().next().value); } return post(m, ...rest); };
    }
  }

  // keep a copy of each picture the page accepts, with its camera
  const display0 = window.display;
  window.display = (frame, g) => {
    const seq = frame.seq, before = shown;
    display0(frame, g);
    if (shown === seq && shown !== before && cams.has(seq)) {
      if (copy.width !== canvas.width || copy.height !== canvas.height) { copy.width = canvas.width; copy.height = canvas.height; }
      cg.clearRect(0, 0, copy.width, copy.height); cg.drawImage(canvas, 0, 0);
      last = { cam: cams.get(seq) }; window.__smooth.frames++;
    }
  };

  // ground plane (z = target height) → canvas pixels for a camera: [a, b, c, d, e, f] as in setTransform
  function groundToScreen(c, dpr) {
    const ppu = Math.min(c.W / 302, c.H / 202) * c.zoom * K * dpr;
    const t = c.yaw * Math.PI / 180, p = c.pitch * Math.PI / 180, st = Math.sin(t), ct = Math.cos(t), sp = Math.sin(p);
    // screen = ppu * ( R·(q - c), D·(q - c) ) + centre, R = (-st, ct), D = (sp ct, sp st) on the ground
    const a = -st * ppu, b = sp * ct * ppu, cc = ct * ppu, d = sp * st * ppu;
    const ex = c.W * dpr / 2 - (a * c.x + cc * c.y), fy = c.H * dpr / 2 - (b * c.x + d * c.y);
    return [a, b, cc, d, ex, fy];
  }
  const invert = ([a, b, c, d, e, f]) => { const det = a * d - b * c; return [d / det, -b / det, -c / det, a / det, (c * f - d * e) / det, (b * e - a * f) / det]; };
  const mul = ([a1, b1, c1, d1, e1, f1], [a2, b2, c2, d2, e2, f2]) =>   // m1 ∘ m2
    [a1 * a2 + c1 * b2, b1 * a2 + d1 * b2, a1 * c2 + c1 * d2, b1 * c2 + d1 * d2, a1 * e2 + c1 * f2 + e1, b1 * e2 + d1 * f2 + f1];
  const same = (p, q) => Math.abs(p.x - q.x) < 1e-3 && Math.abs(p.y - q.y) < 1e-3 && Math.abs(p.zoom - q.zoom) < 1e-5 &&
    Math.abs(p.yaw - q.yaw) < 1e-3 && Math.abs(p.pitch - q.pitch) < 1e-3;

  function loop() {
    requestAnimationFrame(loop);
    wrapWorkers();
    if (!last || document.hidden || !W || !H) return;
    const now = { ...camera, W, H };
    if (same(now, last.cam) || now.W !== last.cam.W || now.H !== last.cam.H) return;
    const dpr = canvas.width / W;
    const m = mul(groundToScreen(now, dpr), invert(groundToScreen(last.cam, dpr)));
    sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, canvas.width, canvas.height);
    sg.setTransform(...m); sg.drawImage(copy, 0, 0); sg.setTransform(1, 0, 0, 1, 0, 0);
    window.__smooth.warps++;
  }
  requestAnimationFrame(loop);
})();
