# 淡江大學淡水校園地圖

淡江大學淡水校園的手繪風立體地圖，可以旋轉、縮放、移動。畫面呈現淡水「現在」的樣子：天氣跟著即時資料，明暗跟著當下的太陽，從白天、黃昏一路到夜晚。

- 建築輪廓、道路、步道與水域：OpenStreetMap（ODbL）。
- 重要建築：依照片與文獻手工建模，來源列在 [docs/sources.md](docs/sources.md) 和頁面的 Field notes 裡。
- 繪製：three.js（MIT）；MapLibre 版的底圖用 MapLibre GL JS（BSD-3）與 OpenFreeMap 向量圖磚。

**線上瀏覽：** https://hankchou2004.github.io/tamkang-pocket-city/ （首頁是手機版，用手機打開最合適；MapLibre 版在 [proto/maplibre.html](https://hankchou2004.github.io/tamkang-pocket-city/proto/maplibre.html)，電腦用的 3D 版在 [3d.html](https://hankchou2004.github.io/tamkang-pocket-city/3d.html)；每次 `main` 更新後由 GitHub Actions 自動重建）

## 三個版本

- **手機版**（首頁，原始碼在 `web3d/main3d.js` 的 `APP_MODE`）：直式、全螢幕的校園地圖。單指移動、雙指縮放與旋轉，點建築會拉近，右下角按鈕回到全校。本機建置的 `_site/app/` 是同一頁，另外加上「加入主畫面」用的 PWA 外殼（`app/`，只在本機）。
- **MapLibre 版**（`proto/maplibre.html`）：地面用 MapLibre GL JS 加 OpenFreeMap 向量圖磚（需標示 © OpenMapTiles © OpenStreetMap），範圍沒有邊界。所有建築都用我們的畫法：方形範圍內是手工地標與 `scene.json`，範圍外從圖磚取輪廓與高度，邊載入邊畫。
- **3D 版**（`3d.html`，原始碼在 `web3d/`）：800 公尺見方的校園，等角視角，平塗色塊分亮、中、暗三階加墨線。

三個版本畫建築用的是同一套程式：`landmarks/` 的地標檔加上 `web3d/kit3d.js` 的零件，所以新增或修改地標，三個版本都會一起更新。

## 開發

```
python tools/build.py --app                    # 產生 _site/app/、_site/dev/ 與 _site/proto/
python -m http.server 8000 -d _site            # 開 http://localhost:8000/dev/
```

開發頁（`_site/dev/`）中間是手機 app 的實際畫面，可以切換 three.js 版與 MapLibre 版、手機尺寸；左右兩側可以即時調時間、天氣、建築配色與地圖樣式。`app/` 和 `dev/` 只在本機，不進 repo。

其他建置指令：

```
python tools/build.py                          # 3D 版，tamkang-campus.html
python tools/build.py --site-pages             # GitHub Pages 發布的內容（首頁手機版、proto/maplibre.html、3d.html）
python tools/build.py --views avenue --at 2026-11-27T18:30 --wx rain   # 3D 截圖（shots/3d/）
python tools/build.py --check 168,-62          # 在該點算六個角度、正上方與夜景的檢查圖
```

建置只需要 Python 3.9 以上。截圖另外需要 Node 22 以上與 Google Chrome，Chrome 找不到時，設定 `CHROME` 指向 chrome.exe。

## 檔案結構

| 位置 | 內容 |
|---|---|
| `landmarks/00-common.js` | 共用色票、座標轉換與零件，例如欄杆、太陽能板、樸素量體 |
| `landmarks/01-…08-*.js` | 各分區的手工地標，一區一檔 |
| `web3d/kit3d.js` | 繪圖零件（`block`、`roofOver`、`loft`、`shape`、`stick`、`ball`…），把地標程式變成立體模型 |
| `web3d/main3d.js`、`web3d/template.html` | 3D 版與手機 app：場景、著色、太陽與天氣、操作、版面 |
| `proto/` | MapLibre 版 |
| `work/city.json` | 樣式規則、校園配色、鏡頭、Field notes |
| `work/live.json` | 即時天氣與明暗的設定 |
| `work/zones.json` | 區域底色（目前有淡江大學，之後可加金雞母、大田寮等） |
| `work/scene.json` | 由 OpenStreetMap 轉出的場景（含疏伐樹木等手動調整） |
| `work/osm.json`、`plot.json` | 原始地圖資料與正方形位置 |
| `tools/` | 建置腳本與輔助工具 |
| `vendor/three/` | three.js r159（MIT） |
| `docs/sources.md`、`docs/buildings.md` | 來源清單、每棟地標的建模狀態 |

## 操作方式

- **旋轉**：拖曳（手機：單指）。
- **移動**：右鍵或按住 Shift 拖曳、方向鍵（手機：雙指拖曳），或按右上角 ✥ 按鈕後直接拖曳。
- **縮放**：滾輪或右上角的 − ／ +（手機：雙指縮放）。
- **地圖導覽**（左下欄）：視角、區域、操作說明與資料來源。

## 天氣與時間

- **季節外觀**依台灣當月：3至5月春天、6至10月夏天、11月到隔年2月東北季風季。
- **天氣**：向 [Open-Meteo](https://open-meteo.com/) 查淡水的即時天氣，分成晴或多雲、毛毛雨、下雨、起霧。
- **明暗**：依當下太陽在淡水的高度連續變化；陰影跟著真實的太陽方向。每 10 分鐘重新檢查。
- **測試用網址參數**：`?at=2026-11-27T18:30&wx=rain` 可以固定時間與天氣。

## 協作

想補照片、修正錯誤或建新的地標，請先讀 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 授權

- 地圖資料 © OpenStreetMap contributors，依 ODbL 授權；MapLibre 版底圖 © OpenMapTiles © OpenStreetMap。
- 照片版權屬於原作者，授權依各檔案頁面，頁面上已逐一標註。
- 本專案的程式碼：MIT，見 [LICENSE](LICENSE)。文字內容：CC BY-SA 4.0，見 [LICENSE-CONTENT.md](LICENSE-CONTENT.md)。
- **致謝**：本專案最早以 April Zhu 的 [Pocket City](https://april-zhu.com/pocketcity) 建立。目前已不含它的引擎檔案，但繪圖零件的名稱與用法、明暗三階與夜色的配色公式，是參照它的做法改寫的。
