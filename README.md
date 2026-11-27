# 淡江大學淡水校園 · Pocket City

淡江大學淡水校園的手繪等角立體模型，做成一個可以旋轉、縮放的網頁。畫面呈現淡水「現在」的樣子：天氣跟著即時資料，明暗跟著當下的太陽，從白天、黃昏一路到夜晚。範圍是 800 公尺見方，轉 60.5 度，涵蓋整個校園。

- 建築輪廓、道路、步道與水域：OpenStreetMap（ODbL）。
- 重要建築：依照片與文獻手工建模，來源列在 [docs/sources.md](docs/sources.md) 和頁面的 Field notes 裡。
- 畫風與引擎：April Zhu 的 [Pocket City](https://april-zhu.com/pocketcity)，限非商業使用（見下方授權）。

**線上瀏覽：** https://hankchou2004.github.io/tamkang-pocket-city/ （每次 `main` 更新後由 GitHub Actions 自動重建）

## 3D 版（three.js）

網頁預設是 three.js 繪製的 3D 版，盡量保留原本 Pocket City 的畫風：平塗色塊分亮、中、暗三階，加上墨線、紙張底色。地標程式不用改，`web3d/kit3d.js` 把原本工具組的零件（`block`、`roofOver`、`loft`、`shape`、`stick`、`ball`…）改成產生立體模型。

- 旋轉、移動、縮放都即時，全校總覽每秒約 56 張。
- 陰影依淡水當下真實的太陽位置投射；牆面明暗沿用 2D 版的固定光線，看起來和原本一致。
- 天氣與夜色沿用即時資料；雨、窗燈、路燈光暈、行人與車輛都有。
- 原本的 2D 版仍可用 `python tools/build.py --classic` 產生（`pocket-city-tamkang-campus-2d.html`）。

## 檔案結構

| 位置 | 內容 |
|---|---|
| `landmarks/00-common.js` | 共用色票、座標轉換與零件，例如欄杆、太陽能板、樸素量體 |
| `landmarks/01-…06-*.js` | 六個分區的手工地標，一區一檔 |
| `work/city.json` | 樣式規則、鏡頭、圖例與 Field notes |
| `work/live.json` | 即時天氣與明暗的設定：季節外觀、四種天氣、四級明暗、天氣代碼對照 |
| `web/live.js` | 頁面上依即時天氣與太陽高度切換畫面的程式 |
| `web/smooth.js` | 流暢度：新畫面還在畫時，先把上一張畫面依鏡頭即時移動、縮放、轉動，畫好就換上 |
| `web/ui.js` | 版面與操作：左上保留地點與即時天氣，其餘的視角（每個地標一個）、操作說明與資料來源收進左下「地圖導覽」；平移畫面；拿掉暫停鍵；中文介面字樣 |
| `work/scene.json` | 由 OpenStreetMap 轉出的場景（含疏伐樹木等手動調整） |
| `work/osm.json`、`plot.json` | 原始地圖資料與正方形位置 |
| `tools/` | 建置腳本與輔助工具 |
| `vendor/pocket-city/` | 建置需要的 Pocket City 引擎檔案（原封不動，附原授權）；3D 版只用到它的頁面版型 |
| `vendor/three/` | three.js r159（MIT） |
| `web3d/` | 3D 版：`kit3d.js` 零件轉接層、`main3d.js` 場景、著色、太陽與天氣、操作 |
| `docs/sources.md` | 每一區的來源清單 |
| `docs/buildings.md` | 每棟地標的建模狀態，以及最缺資料的建築 |

## 建置

建置頁面只需要 Python 3.9 以上，引擎已放在 `vendor/pocket-city/`。算檢查圖另外需要 Node 22 以上與 Google Chrome，Chrome 找不到時，設定 `CHROME` 指向 chrome.exe。

```
python tools/build.py                          # 產生 pocket-city-tamkang-campus.html（3D）
python tools/build.py --views avenue --at 2026-11-27T18:30 --wx rain   # 3D 截圖（shots/3d/）
python tools/build.py --classic                # 原本的 2D 版
python tools/build.py --check 168,-62          # 另外在該點算六個角度、正上方與夜景的檢查圖（shots/check/）
python tools/build.py --views avenue,library   # 算 city.json 裡指定鏡頭的圖
```

產生的頁面可以直接從硬碟打開。即時天氣需要連網，連不上時改用該月份的典型天氣，時間與明暗照樣更新。

## 操作方式

- **旋轉**：拖曳（手機：單指）。
- **移動**：右鍵或按住 Shift 拖曳、方向鍵（手機：雙指拖曳），或按右上角 ✥ 按鈕後直接拖曳。
- **縮放**：滾輪或右上角的 − ／ +（手機：雙指縮放）。
- **地圖導覽**（左下欄）：視角、操作說明與資料來源。每個地標都有一個視角，點一下畫面就飛過去。

## 流暢度

整校 800 公尺見方的總覽，一張要畫 0.2 到 0.5 秒。為了讓拖曳跟手，做了兩件事，畫風都不變：

- **背景繪圖改用 CPU**（建置時的引擎修補）：原本用顯示卡畫，數千個圖形塞滿顯示卡，螢幕每秒只能更新 3 到 4 次。
- **即時預覽**（`web/smooth.js`）：新畫面畫好之前，先把上一張畫面依鏡頭移動、縮放、轉動。平移和縮放完全準確；旋轉時地面準確，建築會短暫略歪。

用 `node tools/measure.mjs [--phone] [--gpu]` 可以量測第一張畫面的時間，以及各種操作下每秒畫出與顯示的張數。`tools/profile.js` 則用來分項計時一張畫面。

| 總覽畫面（每秒張數） | 改善前 | 改善後 |
|---|---|---|
| 桌機：實際畫出 | 3 到 4 | 10 到 13 |
| 桌機：螢幕上看到 | 3 到 4 | 約 66 到 69 |
| 手機等級：實際畫出 | 1 到 3 | 約 8 到 9 |
| 手機等級：螢幕上看到 | 5 到 13 | 約 64 |

## 天氣與時間怎麼運作

- **季節外觀**依台灣當月：3至5月春天、6至10月夏天、11月到隔年2月東北季風季。
- **天氣**：頁面向 [Open-Meteo](https://open-meteo.com/) 查淡水的即時天氣，分成晴或多雲、毛毛雨、下雨、起霧四種。
- **明暗**：依當下太陽在淡水的高度分成四級，白天、黃昏／清晨、暮色／破曉、夜晚。
- 每 10 分鐘重新檢查一次。畫面沒有手動切換的按鈕。
- 建置時，`tools/build.py` 把 3 種季節外觀 × 4 種天氣 × 4 級明暗組成 48 種狀態，名稱是 `季節-天氣-明暗`，例如 `summer-rain-3`。
- **測試用網址參數**（不會出現在畫面上）：`?at=2026-11-27T18:30&wx=rain` 可以固定時間與天氣，方便檢查。
- 引擎有一個小修補（夜色暫存），在建置時套用，`vendor/` 保持原樣，見 `tools/build.py` 的 `PATCHES`。

## 協作

想補照片、修正錯誤或建新的地標，請先讀 [CONTRIBUTING.md](CONTRIBUTING.md)，裡面有來源規則、風格守則與檢查方式。

## 授權

- 地圖資料 © OpenStreetMap contributors，依 ODbL 授權。
- 照片版權屬於原作者，授權依各檔案頁面，多為 CC BY-SA 4.0，頁面上已逐一標註。
- **Pocket City 引擎與工具組**（`vendor/pocket-city/`）© 2026 April Zhu，依 [PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0) 授權，**只限非商業使用**，詳見 [vendor/pocket-city/LICENSE](vendor/pocket-city/LICENSE)。其中的繪圖工具組以 Tolga Cohce 的 iso-figure（MIT）為基礎。
- **產生的頁面與算圖**包含 Pocket City 引擎，同樣只限非商業使用：不得販售、不得用於付費案件或商業宣傳。
- 本專案自己寫的程式碼（`landmarks/`、`tools/`）：MIT，見 [LICENSE](LICENSE)。
- 本專案的文字內容（Field notes、說明文件）：CC BY-SA 4.0，見 [LICENSE-CONTENT.md](LICENSE-CONTENT.md)。
