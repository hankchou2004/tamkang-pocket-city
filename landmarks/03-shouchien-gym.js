/* ====================== District 3: 守謙國際會議中心, 紹謨紀念體育館 and the north gate ======================
   淡江時報 659期 (紹謨紀念體育館興建記): begun 2004, finished two years later; eight storeys and one basement; glass
   curtain walls, its form and colours matching the natatorium; designed by 黃秀莊建築事務所. No photo of the gym itself
   was found: it is drawn in the natatorium's colours (Commons "Shao-mo Memorial Natatorium Complex 20250804": light
   silver-grey panels, white end piers, faceted green glass bays, a curved name band). Its parts come from OSM: the
   eight-storey main part (w1281242966) and a four-level band cantilevered from level 2 (w520435334).
   淡江時報 1049期 (守謙國際會議中心興建記): four storeys and one basement, a 380-seat hall, fifteen meeting rooms, an open
   plaza and a roof garden; 1050期: opened at the 67th anniversary (2017); 1089期: designed by alumnus 徐維志's practice,
   greenery with glass curtain walls. Commons photo (2025): light grey concrete bands with rounded edges, dark glazing,
   glass balustrades. 1185期: 麗澤大學 paid for the 麗澤 international house (no photo found: plain and illustrative).
   Main gate guardhouse: Commons "Tamkang University Tamsui Campus Main Entrance Guardhouse" (2026): a white flat canopy
   on slim white columns over a small booth, under banyans. 大忠管制站: no photo, drawn like the main gate. */
const GYM = 'w1281242966', GYM_BAND = 'w520435334', GYM_ROOF = 'w1281236188', NATA = ['w235413781', 'w964268106'],
      SQ = 'w964267202', LIZE = 'w235418071', DAZHONG = 'w642840343', MAINGATE = 'w971523384';
const SILVER = '#cdd0cf', SILVER_TOP = '#bfc3c2', TEAL = ['#7fb7b1', '#8fc2bc', '#74aaa6'];

function gymnasium() {
  const b = findBuilding(GYM), band = findBuilding(GYM_BAND); if (!b) return null;
  const ring = ccw(b.ring), F = 4.2, top = 8 * F;
  return obj(ring, top + 1, () => {
    // 素材庫 photos: a grey concrete base, white tiled walls and blue-tinted glass curtain bays above
    const BLUE = ['#8fb0cf', '#9dbbd8', '#86a6c6'];
    let main = block(ring, 0, F, { facade: 'plain', wall: '#c9c8c2', top: SILVER_TOP, shop: 'none', floor: F }).draw();
    main += block(ring, F, top, { facade: 'glass', wall: '#ecece7', top: SILVER_TOP, shop: 'none', floor: F, glass: BLUE, frame: '#f4f4f0' }).draw();
    main += shape(atZ(toward(b.obb.c, ring, .97), top + .05), '#d7d9d6', .4);   // parapet line
    if (!band) return main;
    // the band wraps the main block's south-west and south-east sides, lower than it: in front only when seen from that side
    const bandSvg = block(ccw(band.ring), 2 * F, 6 * F, { facade: 'office', wall: '#ecece7', top: '#c8cbca', shop: 'none', floor: F, bay: 2.6, glass: BLUE, frame: '#f4f4f0' }).draw();
    const d = [band.obb.c[0] - b.obb.c[0], band.obb.c[1] - b.obb.c[1], 0];
    return vis(d) ? main + bandSvg : bandSvg + main;
  });
}

function natatorium() {
  const b = findBuilding(NATA[0]); if (!b) return null;
  const ring = ccw(b.ring), h = 15.5;
  return obj(ring, h + 1, () => block(ring, 0, h, { facade: 'glass', wall: SILVER, top: SILVER_TOP, shop: 'none', floor: 5.2, glass: TEAL, frame: '#f4f3ee' }).draw() +
    shape(atZ(toward(b.obb.c, ring, .96), h + .05), '#d3d6d3', .4));
}

// 守謙: four floors of light concrete bands and dark glass, a roof garden on top
function shouChien() {
  const b = findBuilding(SQ); if (!b) return null;
  const ring = ccw(b.ring), c = b.obb.c, F = 4.4;
  return obj(ring, 4 * F + 1.2, () => {
    let s = block(ring, 0, F, { facade: 'glass', wall: '#cfd0cc', top: '#d9dad6', shop: 'none', floor: F, glass: ['#55646a', '#5d6d73'], frame: '#e7e7e2' }).draw();
    s += block(toward(c, ring, 1.0), F, 3 * F, { facade: 'office', wall: '#dcddd8', top: '#d9dad6', shop: 'none', floor: F, bay: 2.2, glass: ['#5a6a70', '#647479'], frame: '#eeeeea', trim: '#f4f4f0' }).draw();
    s += block(toward(c, ring, .9), 3 * F, 4 * F, { facade: 'office', wall: '#dcddd8', top: '#d3d4cf', shop: 'none', floor: F, bay: 2.2, glass: ['#5a6a70'], frame: '#eeeeea' }).draw();
    s += shape(atZ(toward(c, ring, .78), 4 * F + .05), '#a9c68e', .4);                 // roof garden
    for (let k = 0; k < 7; k++) { const q = toward(c, [ring[k % ring.length]], .55)[0]; s += ball([q[0], q[1], 4 * F + .8], .9, soft('#7fa66a'), .3); }
    s += loft(atZ(toward(c, ring, .9), 4 * F), atZ(toward(c, ring, .9), 4 * F + 1.1), () => 'rgba(200,222,224,.35)');   // glass balustrade
    return s;
  });
}

function lizeHouse() {
  const b = findBuilding(LIZE); if (!b) return null;
  const ring = ccw(b.ring);
  // 素材庫 photos: beige stone tiles, rounded balcony planters, dark window frames
  return obj(ring, 13.6, () => block(ring, 0, 13.2, { facade: 'apartment', wall: '#d9c7a5', top: '#cdbf9f', shop: 'none', floor: 3.3, balcony: 'some', frame: '#5e5148' }).draw());
}

// a guardhouse: a small booth under a thin white canopy on slim columns
function guardhouse(id, grow) {
  const b = findBuilding(id); if (!b) return null;
  const ring = ccw(b.ring), { c, ax, L, W } = b.obb, can = frame(c, ax, L + grow[0], W + grow[1]);
  return obj(can.ring, 5, () => {
    let s = block(ring, 0, 2.9, { facade: 'office', wall: '#f3f2ee', top: '#e2e0da', shop: 'none', floor: 2.9, bay: 1.6, glass: GLASS }).draw();
    for (const [u, v] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const q = can.P(u * (L + grow[0]) / 2 * .9, v * (W + grow[1]) / 2 * .85); s += stick([q[0], q[1], 0], [q[0], q[1], 4.1], .12, '#f4f3ef'); }
    s += solid(can.ring, 4.1, 4.5, '#f4f3ef', '#e9e8e3');
    return s;
  });
}

LANDMARKS.push(
  { name: '紹謨紀念體育館', ids: [GYM, GYM_BAND, GYM_ROOF, 'w964229634'], build: gymnasium },
  { name: '紹謨紀念游泳館', ids: NATA, build: natatorium },
  { name: '守謙國際會議中心', ids: [SQ], build: shouChien },
  { name: '麗澤國際學舍', ids: [LIZE], build: lizeHouse },
  { name: '大門管制站', ids: [MAINGATE], build: () => guardhouse(MAINGATE, [3, 3.5]) },
  { name: '大忠管制站', ids: [DAZHONG], build: () => guardhouse(DAZHONG, [2, 3]) },
);
