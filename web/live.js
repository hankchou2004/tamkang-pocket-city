/* Live weather and time of day for the Tamkang page (added after the engine's page.js by tools/build.py).
   The page shows 淡水 as it is now: the season look comes from the month, the weather from Open-Meteo's current
   conditions, and the light (day, dusk, twilight, night) from the sun's height over 淡水 at this moment. It checks
   again every 10 minutes. There are no manual controls; if the weather cannot be fetched the page shows the month's
   typical weather.
   For testing only, the URL can fix the moment and the weather: ?at=2026-11-27T18:30&wx=rain
   Any other call to selectSeason (such as render.mjs --season) stops the live updates for that page. */
(() => {
  const CFG = LIVE_CFG;
  const q = new URLSearchParams(location.search);
  const fixedAt = q.get('at'), fixedWx = q.get('wx');
  let weather = null, temp = null, failed = false, live = true, calling = false;

  // hide the season chips and special-scene menu: the scene follows the real weather and time
  const style = document.createElement('style');
  style.textContent = '#chips,#snow,.season-scroll{display:none!important}';
  document.head.appendChild(style);
  if ($('event')) $('event').parentElement.hidden = true;
  const head = document.querySelector('.season-box .subhead');
  if (head) head.textContent = '淡水 · 現在';

  // the sun's altitude in degrees (NOAA's approximate solar position)
  function sunAltitude(date, lat, lon) {
    const rad = Math.PI / 180, d = date.getTime() / 86400000 - 10957.5;   // days since J2000.0
    const g = (357.529 + 0.98560028 * d) * rad, L = (280.459 + 0.98564736 * d) * rad;
    const lam = L + (1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad, eps = (23.439 - 0.00000036 * d) * rad;
    const dec = Math.asin(Math.sin(eps) * Math.sin(lam)), ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
    const gmst = (18.697374558 + 24.06570982441908 * d) % 24, ha = ((gmst * 15 + lon) * rad) - ra;
    return Math.asin(Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(ha)) / rad;
  }
  const now = () => fixedAt ? new Date(fixedAt + (/[zZ]|[+-]\d\d:?\d\d$/.test(fixedAt) ? '' : '+08:00')) : new Date();
  const month = t => Number(new Intl.DateTimeFormat('en', { timeZone: CFG.place.timezone, month: 'numeric' }).format(t));
  const clock = t => new Intl.DateTimeFormat('zh-TW', { timeZone: CFG.place.timezone, hour: '2-digit', minute: '2-digit', hour12: false }).format(t);

  function stateNow() {
    const t = now(), base = CFG.months[month(t) - 1];
    const sun = sunAltitude(t, CFG.place.lat, CFG.place.lon);
    const level = CFG.levels.findIndex(l => sun >= l.minSun);
    const wx = fixedWx || weather || CFG.fallback[base] || 'clear';
    return { t, base, wx, level: level < 0 ? CFG.levels.length - 1 : level };
  }

  function apply() {
    if (!live) return;
    const s = stateNow(), id = `${s.base}-${s.wx}-${s.level}`;
    calling = true; try { if (id !== season) orig(id); } finally { calling = false; }
    const lv = CFG.levels[s.level], morning = Number(new Intl.DateTimeFormat('en', { timeZone: CFG.place.timezone, hour: 'numeric', hourCycle: 'h23' }).format(s.t)) < 12;
    const parts = [`${clock(s.t)} · ${(morning && lv.morning) || lv.label} · ${CFG.weathers[s.wx].label}`];
    if (temp != null && !fixedWx) parts.push(`${Math.round(temp)}°C`);
    const a = document.createElement('a'); a.href = CFG.note.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = 'Open-Meteo ↗';
    const text = parts.join(' · ') + (failed && !fixedWx ? '（暫時取不到即時天氣，顯示這個月份的典型天氣）' : '') + ' 天氣資料：';
    $('note').replaceChildren(document.createTextNode(text), a);
  }

  async function fetchWeather() {
    if (fixedWx || !live) return apply();
    try {
      const p = CFG.place, url = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}` +
        `&current=weather_code,temperature_2m&timezone=${encodeURIComponent(p.timezone)}`;
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const c = (await r.json()).current, code = c.weather_code;
      weather = Object.keys(CFG.wmo).find(k => Array.isArray(CFG.wmo[k]) && CFG.wmo[k].includes(code)) || 'clear';
      temp = c.temperature_2m; failed = false;
    } catch (e) { failed = true; }
    apply();
  }

  // wrap selectSeason: our own calls keep the live mode, anyone else's (a test render) ends it
  const orig = window.selectSeason;
  window.selectSeason = s => { if (!calling) live = false; return orig(s); };

  apply();
  fetchWeather();
  setInterval(fetchWeather, 10 * 60 * 1000);
})();
