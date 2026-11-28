# AGENTS.md

給 AI 寫程式助理（Claude Code、Codex、Cursor、Copilot 等）的專案說明。人類協作者請看 [README.md](README.md) 和 [CONTRIBUTING.md](CONTRIBUTING.md)，細節以那兩份為準。

## 專案是什麼

淡江大學淡水校園的手繪風立體地圖，是一個靜態網頁，沒有後端也沒有套件安裝。
- **MapLibre 版**：網站首頁，原始碼在 `proto/`。
- **3D 版**：`3d.html`，原始碼在 `web3d/main3d.js`。

兩個版本畫建築用同一套程式，就是 `landmarks/*.js` 加上 `web3d/kit3d.js`，改一次兩邊都會變。

## 語言

- 回覆使用者、提交訊息、Field notes、文件：**繁體中文**。
- 程式註解：英文或中文都可以，同一個檔案內統一。

## 指令

```
python tools/build.py --site-pages             # 產生 _site/：首頁（MapLibre）、3d.html
python -m http.server 8000 -d _site            # 預覽 http://localhost:8000/
python tools/build.py                          # 只產生 3D 版 tamkang-campus.html（可直接開檔）
python tools/build.py --views <視角id> --at 2026-11-27T19:30 --wx rain   # 3D 截圖到 shots/3d/
node tools/shot3d.mjs tamkang-campus.html --out shots/t --view check:<x>,<y>:<zoom>   # 六個角度加正上方
python tools/list_famous.py                    # 列出建築編號、名稱、座標
python tools/district_viz.py <x> <y> <半徑> out.svg   # 畫出一帶的輪廓與編號
```

- **環境需求**：建置只要 Python 3.9 以上。截圖要 Node 22 以上和 Chrome，找不到 Chrome 時設定環境變數 `CHROME`。
- **Windows**：輸出中文前先設 `PYTHONUTF8=1`。
- **網址參數**：`?at=…&wx=clear|drizzle|rain|fog` 可以固定時間與天氣，用來檢查夜景與雨天。

## 結構

- `landmarks/NN-*.js`：手工地標，一區一檔，依檔名順序串接成一支程式。
  - `00-common.js` 放共用色票與零件。
  - 每個地標用 `LANDMARKS.push({ name, ids, build })` 登記。
- `web3d/kit3d.js`：繪圖零件，例如 `block`、`solid`、`roofOver`、`shape`、`loft`、`stick`、`ball`、`rail`，零件表在 CONTRIBUTING.md。
- `work/city.json`：一般建築樣式、校園配色、視角（`views`）、Field notes（`notes`）。
- `work/scene.json`：由 OpenStreetMap 轉出的場景。**不要手改**，要調整就寫成 `tools/` 裡可重跑的腳本，例如 `tools/sports.py`、`tools/thin_trees.py`。
- `docs/buildings.md`：每棟地標的建模狀態。`docs/sources.md`：來源清單。
- **座標**：公尺，以地塊中心為原點，`x`、`y` 是地面，`z` 往上。地塊轉了 60.5 度，所以 `x`、`y` 不是正東和正北。

## 規則

1. **照參考資料畫，不憑印象**：沒有依據的部分寫進 Field notes，標成「示意」或「推定」。
2. **照片版權**：沒有授權的照片只能看著畫，不要放進 repo。例如淡江校園素材庫、Google 街景、使用者自己傳的截圖。
3. **畫風**：
   - 顏色不比照片鮮豔，不加漸層或發光。
   - 欄杆用 `rail()`，不用半透明面。
   - 細節抓大特徵就好。
4. **繪圖指令放在 `obj(輪廓, 高度, () => ...)` 的函式裡**，建置時才收得到，也才有名稱標籤。
5. **夜晚發光**：用 `LANTERN` 色或暖光色，不要在地標裡判斷 `SEASON.night`，因為建築只在載入時建一次。
6. **新增或修改地標時一併更新**：
   - `work/city.json` 的視角與 Field notes。
   - `docs/buildings.md` 的狀態列：狀態寫「照片」「文字」「部分示意」「示意」之一。
   - `docs/sources.md`。
7. **完成前檢查**：
   - 建置不出錯。
   - 用 `check:` 截圖看六個角度：沒有破洞、穿模、方向錯誤。
   - 夜景正常，主控台沒有錯誤。
8. **不要推送或提交，除非使用者要求**。`app/`、`dev/` 是維護者本機專用的資料夾，不在 repo 裡；沒有它們也能正常開發。
