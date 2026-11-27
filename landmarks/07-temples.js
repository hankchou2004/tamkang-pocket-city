/* ====================== District 7: the two temples off campus ======================
   普學禪寺 (OSM w291863345, 學府路90號): 淡水區公所《宗教禮俗志》 p.29 — a 中台山 temple: from 2002 its monks led meditation
   at the Tamkang Buddhist society's hall, then a 普學精舍 on 中山北路, and now the spacious 普學禪寺 on 學府路 near 鄧公國小.
   無極順天宮 (OSM w294321324, 鄧公路23巷, taoist): no source beyond the map was found.
   No photo of either was found: both are drawn plainly as illustrative, a pale two-storey hall with a grey hipped roof for
   the meditation temple, a one-storey red-walled hall with an orange gabled roof for the folk temple. */
const PUXUE = 'w291863345', SHUNTIAN = 'w294321324';

function puxueTemple() {
  const b = findBuilding(PUXUE); if (!b) return null;
  const ring = ccw(b.ring), { c, ax, L, W } = b.obb, h = 7.4;
  return obj(ring, h + W / 2 * Math.tan(28 * Math.PI / 180) + 1, () =>
    block(ring, 0, h, { facade: 'civic', wall: '#ece4d2', top: '#ddd5c4', shop: 'none', floor: 3.7, bay: 3, frame: '#7a6a58', trim: '#d9cdb6' }).draw() +
    roofOver({ c, ax, L: L * .96, W: W * .96 }, h, { roofColour: '#6e716d', roofTex: 'kawara', ridgeCap: .3, roof: 'hipped', pitch: 24, eaves: .7 })());
}

function shuntianTemple() {
  const b = findBuilding(SHUNTIAN); if (!b) return null;
  const ring = ccw(b.ring), { c, ax, L, W } = b.obb, h = 4.6;
  return obj(ring, h + W / 2 * Math.tan(30 * Math.PI / 180) + 1, () =>
    solid(toward(c, ring, 1.04), 0, .45, PLINTH, PLINTH_TOP) +
    block(ring, .45, h, { facade: 'temple', wall: RED_WALL, top: RED_WALL, shop: 'none', bay: 3, floor: h - .45, frame: '#5a3a2e', trim: BEAM }).draw() +
    roofOver({ c, ax, L: L * .9, W: W * .9 }, h, { roofColour: '#c8703a', roofTex: 'kawara', ridgeCap: .3, roof: 'gabled', pitch: 22, eaves: .8, wall: '#e6d6bd' })());
}

LANDMARKS.push(
  { name: '普學禪寺', ids: [PUXUE], build: puxueTemple },
  { name: '無極順天宮', ids: [SHUNTIAN], build: shuntianTemple },
);
