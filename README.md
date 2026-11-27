# 淡江大學淡水校園 · Pocket City

淡江大學淡水校園的手繪等角立體模型，做成一個可以旋轉、縮放，並切換季節與夜景的網頁。範圍是 800 公尺見方，轉 60.5 度，涵蓋整個校園和校外兩座寺廟。

- 建築輪廓、道路、步道與水域：OpenStreetMap（ODbL）。
- 重要建築：依照片與文獻手工建模，來源列在 [docs/sources.md](docs/sources.md) 和頁面的 Field notes 裡。
- 畫風與引擎：April Zhu 的 [Pocket City](https://april-zhu.com/pocketcity)，限非商業使用（見下方授權）。

**線上瀏覽：** https://hankchou2004.github.io/tamkang-pocket-city/ （每次 `main` 更新後由 GitHub Actions 自動重建）

## 檔案結構

| 位置 | 內容 |
|---|---|
| `landmarks/00-common.js` | 共用色票、座標轉換與零件，例如欄杆、太陽能板、樸素量體 |
| `landmarks/01-…07-*.js` | 七個分區的手工地標，一區一檔 |
| `work/city.json` | 樣式規則、季節、特別場景、鏡頭、圖例與 Field notes |
| `work/scene.json` | 由 OpenStreetMap 轉出的場景（含疏伐樹木等手動調整） |
| `work/osm.json`、`plot.json` | 原始地圖資料與正方形位置 |
| `tools/` | 建置腳本與輔助工具 |
| `vendor/pocket-city/` | 建置需要的 Pocket City 引擎檔案（原封不動，附原授權） |
| `docs/sources.md` | 每一區的來源清單 |
| `docs/buildings.md` | 每棟地標的建模狀態，以及最缺資料的建築 |

## 建置

建置頁面只需要 Python 3.9 以上，引擎已放在 `vendor/pocket-city/`。算檢查圖另外需要 Node 22 以上與 Google Chrome，Chrome 找不到時，設定 `CHROME` 指向 chrome.exe。

```
python tools/build.py                          # 產生 pocket-city-tamkang-campus.html
python tools/build.py --check 168,-62          # 另外在該點算六個角度、正上方與夜景的檢查圖（shots/check/）
python tools/build.py --views avenue,library   # 算 city.json 裡指定鏡頭的圖
```

產生的頁面可以直接從硬碟打開，不需要網路。

## 協作

想補照片、修正錯誤或建新的地標，請先讀 [CONTRIBUTING.md](CONTRIBUTING.md)，裡面有來源規則、風格守則與檢查方式。

## 授權

- 地圖資料 © OpenStreetMap contributors，依 ODbL 授權。
- 照片版權屬於原作者，授權依各檔案頁面，多為 CC BY-SA 4.0，頁面上已逐一標註。
- **Pocket City 引擎與工具組**（`vendor/pocket-city/`）© 2026 April Zhu，依 [PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0) 授權，**只限非商業使用**，詳見 [vendor/pocket-city/LICENSE](vendor/pocket-city/LICENSE)。其中的繪圖工具組以 Tolga Cohce 的 iso-figure（MIT）為基礎。
- **產生的頁面與算圖**包含 Pocket City 引擎，同樣只限非商業使用：不得販售、不得用於付費案件或商業宣傳。
- 本專案自己寫的程式碼（`landmarks/`、`tools/`）：MIT，見 [LICENSE](LICENSE)。
- 本專案的文字內容（Field notes、說明文件）：CC BY-SA 4.0，見 [LICENSE-CONTENT.md](LICENSE-CONTENT.md)。
