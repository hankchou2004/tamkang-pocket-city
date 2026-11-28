# 協作指南

歡迎一起擴充這張校園地圖。可以用兩種方式參與：

- **寫程式**：新增或修改建築、改善畫面、加新功能。從第一節開始看。
- **提供照片或資料**：不需要寫程式，見第六節。

送出的程式碼以 MIT 授權，文字內容以 CC BY-SA 4.0 授權，與本專案相同（見 [LICENSE](LICENSE) 和 [LICENSE-CONTENT.md](LICENSE-CONTENT.md)）。

## 一、開始開發

需要 Git、Python 3.9 以上。要截圖檢查時，另外需要 Node 22 以上與 Google Chrome。不需要安裝任何套件。

```
git clone https://github.com/hankchou2004/tamkang-pocket-city.git
cd tamkang-pocket-city
python tools/build.py --site-pages            # 產生 _site/：首頁（MapLibre 版）、3d.html
python -m http.server 8000 -d _site           # 開 http://localhost:8000/ 與 http://localhost:8000/3d.html
```

改完程式，重跑第一行，再重新整理瀏覽器即可。

- **只看 3D 版**：`python tools/build.py`，產生 `tamkang-campus.html`，直接從硬碟打開。
- **手機版畫面**：首頁的 MapLibre 版就是手機版。用瀏覽器開發者工具切成手機尺寸來看。
- **固定時間與天氣**：網址加 `?at=2026-11-27T19:30&wx=rain`。天氣可以是 `clear`、`drizzle`、`rain`、`fog`，方便檢查夜景與雨天。

維護者本機另有一個開發頁（`dev/`），可以即時切換時間、天氣、配色與版本。它不在 repo 裡，沒有也不影響開發。

## 二、專案怎麼組成

兩個版本（MapLibre 首頁，也就是手機版，以及 3D 版）畫建築用的是**同一套程式**，所以改一次，兩個版本都會更新。

| 位置 | 做什麼 | 常改嗎 |
|---|---|---|
| `landmarks/*.js` | 手工地標，一個分區一個檔案，依檔名順序載入 | **最常改** |
| `landmarks/00-common.js` | 共用色票（`WHITE`、`GLASS`、`RED_WALL`…）與共用零件 | 偶爾 |
| `work/city.json` | 一般建築的樣式規則、校園配色、視角、Field notes | 常改 |
| `work/zones.json` | 區域底色（淡江大學，之後的金雞母、大田寮…） | 偶爾 |
| `work/live.json` | 天氣與明暗的設定 | 很少 |
| `web3d/kit3d.js` | 繪圖零件：把地標程式變成立體模型 | 很少 |
| `web3d/main3d.js` | 3D 版：場景、著色、太陽與天氣、操作、標籤 | 加功能時 |
| `web3d/template.html` | 3D 版的頁面版型 | 很少 |
| `proto/maplibre.js` | MapLibre 版：底圖、地圖樣式、圖磚範圍外的建築 | 加功能時 |
| `tools/build.py` | 把以上組成網頁 | 很少 |
| `work/scene.json` | 從 OpenStreetMap 轉出的場景資料（建築輪廓、道路、樹） | 不手改 |

**座標**：單位是公尺。以地塊中心為原點，`x`、`y` 是地面，`z` 往上。地塊轉了 60.5 度，所以 `x`、`y` 不是正東和正北。

## 三、新增一棟地標

### 1. 找到建築
- **用工具查**：`python tools/list_famous.py` 列出有名稱的建築、編號和座標。
- **用地圖看**：`python tools/district_viz.py <x> <y> <範圍半徑> 輸出.svg` 會畫出那一帶的輪廓與編號。
- **編號格式**：OpenStreetMap 的建築編號寫成 `w123456`。

### 2. 寫地標函式
放進對應分區的檔案。如果是新的分區，就用下一個號碼新增檔案，例如 `09-xxx.js`。

```js
/* 某某館（OSM w123456）：依據什麼來源；哪些是目測或推定的。 */
const MY_HALL = 'w123456';
function myHall() {
  const b = findBuilding(MY_HALL); if (!b) return null;
  const ring = ccw(b.ring), F = 3.6, h = 5 * F;              // 5 層、每層 3.6 公尺
  return obj(ring, h + 1, () => {
    let s = block(ring, 0, h, { facade: 'office', wall: '#efece4', top: '#d6d4ce', floor: F, bay: 3, glass: GLASS }).draw();
    s += solid(toward(b.obb.c, ring, 1.04), h, h + .8, WHITE, WHITE_TOP);   // 頂上一圈簷口
    return s;
  });
}
LANDMARKS.push({ name: '某某館', ids: [MY_HALL], build: myHall });
```

- **`ids`**：列在這裡的建築，不會再被一般建築畫一次。
- **`name`**：會變成地圖上的名稱標籤。
- **簡單的建築**：一行 `plainHall(id, 樓層數, 層高, 樣式)` 就夠了，例如 `{ name: '建築館', ids: [ARCH], build: plainHall(ARCH, 4, 3.8, {...}) }`。

### 3. 常用零件
| 零件 | 用途 |
|---|---|
| `findBuilding(id)` | 取得建築輪廓 `ring` 與外框 `obb`（`c` 中心、`ax` 長邊方向、`L` 長、`W` 寬） |
| `block(ring, z0, z1, 樣式).draw()` | 有立面（窗戶）的量體。`facade`：`office`、`glass`、`apartment`、`civic`、`stucco`、`temple`、`plain` |
| `solid(輪廓, z0, z1, 牆色, 頂色)` | 沒有窗戶的實心量體：柱子、台座、簷口 |
| `roofOver(obb, 牆高, { roof: 'hipped' 或 'gabled', pitch, roofColour })()` | 斜屋頂 |
| `shape(點列, 顏色)` | 一個平面，例如地面鋪面、屋頂花園 |
| `loft(下圈, 上圈, 顏色)` | 兩圈之間的側面，例如圓筒、斜牆 |
| `stick(a, b, 半徑, 顏色)` | 柱子、燈桿、欄杆 |
| `ball(中心, 半徑, soft(顏色))` | 球形，例如樹冠、燈籠、灌木 |
| `rail(p, q, z0, z1)` | 細柱加扶手的欄杆 |
| `frame(c, ax, L, W)` | 依中心、方向和長寬做一個矩形，`P(s, t)` 取裡面的點 |
| `toward(中心, 點列, 倍率)` | 把輪廓放大或縮小，例如做退縮、簷口 |
| `polygon(x, y, r, 邊數)`、`rect(x, y, 寬, 深)` | 圓形、矩形輪廓 |

### 4. 夜晚會亮的東西
- **`LANTERN`**（`'#f6efdc'`）：白天是一般顏色，入夜後自動發光，用在燈籠、燈箱。
- **`'#fff3c4'`、`'#ffd98a'` 等暖光色**：一直發光。
- **`lightPool(x, y, 半徑)`**：地面的光暈，只在夜晚出現。
- **不要用 `SEASON.night` 寫判斷**：建築只在載入時建一次，判斷不會隨時間更新。

### 5. 視角與說明
- **視角**：在 `work/city.json` 的 `views` 加一個 `{ "id", "label", "camera": { "yaw", "pitch", "zoom", "x", "y", "z" } }`。
- **說明**：Field notes 寫在 `notes`。
- **來源與狀態**：來源補進 `docs/sources.md`，建模狀態更新到 `docs/buildings.md`。

## 四、檢查

```
python tools/build.py --check <x>,<y>                                    # 六個角度、正上方，加上夜景
python tools/build.py --views 某視角 --at 2026-11-27T19:30 --wx rain      # 指定視角、時間、天氣
```

圖在 `shots/` 底下。逐張看：
- **六個角度**：都沒有破洞或穿模。
- **夜景**：燈光正常。
- **標籤**：名稱標在對的位置。

再用瀏覽器打開，確認主控台沒有錯誤。修改說明裡附上兩三張截圖。

## 五、送出修改

1. **Fork** 這個 repo，或請維護者加你為協作者。
2. **開新分支**：例如 `git checkout -b add-xxx-hall`。不要直接改 `main`。
3. **一次一件事**：一棟建築或一個功能一個提交，提交訊息用中文寫清楚改了什麼。
4. **開 Pull Request**：GitHub Actions 會自動試建一次網頁，失敗會顯示紅叉。
5. **審查與上線**：維護者看過截圖、試過網頁後合併，網站會自動更新。

不確定怎麼做時，先開一個 Issue 討論。

## 六、提供照片或資料（不需要寫程式）

到 [Issues](https://github.com/hankchou2004/tamkang-pocket-city/issues/new/choose) 選「建築資料回報」填表，附上：

1. **哪一棟**：建築名稱，不確定時附地圖位置。
2. **照片**：最好是斜角全景，一張同時看到正面與側面。其他面、入口或特殊構件的近照也有幫助。
3. **拍攝年份**：建築可能重新粉刷或增建過。
4. **授權**：同意以 CC BY-SA 4.0 或 CC0 釋出，或給 Wikimedia Commons 連結。

目前最缺資料的建築列在 [docs/buildings.md](docs/buildings.md)。

## 七、規則

### 來源
- **畫面上的說法都要有具名來源**：照片、淡江時報、志書等，記在 `docs/sources.md` 與 Field notes。
- **找不到依據的部分標成示意**：例如「樓層數地圖沒標，畫成 5 層」。
- **照著參考資料畫，不憑印象**：照片和地圖矛盾時，以較新、較可靠的來源為準，並寫下理由。
- **照片的版權**：沒有授權的照片（例如校園素材庫、Google 街景）只能當繪製參考，不要放進 repo。

### 畫風
- **顏色**：從照片取色，不要比照片鮮豔。先用 `00-common.js` 的色票，新顏色取有意義的名字。
- **細節程度**：抓得出這棟樓的大特徵就夠了，包括量體分段、屋頂形式、立面顏色、窗戶樣式，再加一兩個招牌構件。細紋、招牌字、材質紋理不畫。
- **欄杆**：用 `rail()` 細柱加扶手，不要用半透明的面。
- **不加特效**：不加漸層、發光或額外陰影，明暗交給著色器處理。

### 程式
- **先找共用零件**：別區也可能用到的零件，加進 `00-common.js`，不要複製一份。
- **畫圖放在函式裡**：繪圖指令放在 `obj(輪廓, 高度, () => ...)` 的函式裡，建置時才會正確收集，也才有名稱標籤。
- **輪廓優先用地圖編號**：真的要手寫座標時，在註解寫清楚是怎麼量的。
- **每個地標函式前寫一段註解**：依據什麼來源、哪些是目測的。
- **不要手改 `work/scene.json`**：要調整時寫成 `tools/` 裡的腳本，例如 `tools/thin_trees.py`、`tools/sports.py`，讓別人可以重跑。

## 八、審查清單（給維護者）

- 來源齊全，示意的部分有標出。
- 顏色不比照片鮮豔，細節程度和既有地標相當。
- 用了共用零件，沒有重複造輪子。
- 兩個版本都能正常打開，六個角度和夜景都沒有問題，主控台沒有錯誤。
