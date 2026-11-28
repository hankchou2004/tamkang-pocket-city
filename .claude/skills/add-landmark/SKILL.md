---
name: add-landmark
description: 在淡江校園地圖新增或重畫一棟手工建模的建築、設施或雕塑。使用者給了建築名稱、照片或地點，要把它畫進地圖時使用。
---

# 新增或重畫地標

照這個順序做。規則以 AGENTS.md 和 CONTRIBUTING.md 為準。

## 1. 找到它
- 用 `python tools/list_famous.py` 找建築編號（`w123456`）。也可以在 `work/scene.json` 的 `buildings` 依 `n`（名稱）搜尋。
- 用 `python tools/district_viz.py <x> <y> 40 out.svg` 畫出周圍。轉成 PNG 看時，用 Chrome 無頭模式加 `--screenshot`。
- 記下外框 `obb`：`c` 中心、`ax` 長邊方向、`L` 長、`W` 寬。地圖上沒有輪廓的東西（例如雕塑、廣場），座標可以從 `work/osm.json` 的節點換算，參考 `tools/sports.py` 的 `P()`。
- 已經有人畫過的，先在 `landmarks/` 裡搜尋它的編號，改原本的函式，不要重複畫。

## 2. 看照片，列出特徵
- 每張照片都要看。列出：量體分段、樓層數、屋頂形式、牆色、窗戶樣式、一兩個招牌構件，例如入口雨庇、欄杆、圓筒、彩色玻璃。
- 判斷入口或特殊立面朝哪一側。拿不準時，在註解和 Field notes 寫「推定」。
- 沒有授權的照片只能看著畫，不要存進 repo。

## 3. 寫模組
- 放進對應分區的 `landmarks/NN-*.js`。新分區用下一個號碼。
- 函式前寫註解：來源，以及哪些是目測或推定的。
- 範本見 CONTRIBUTING.md 第三節。常用零件：
  - `block(ring, z0, z1, 樣式).draw()`：有窗戶的量體，`facade` 可用 `office`、`glass`、`apartment`、`civic`、`stucco`、`temple`、`plain`。
  - `solid(輪廓, z0, z1, 牆色, 頂色)`：實心量體。
  - `roofOver(obb, 牆高, {roof, pitch, roofColour})()`：斜屋頂。
  - `rail(p, q, z0, z1)`：欄杆。
  - `stick`、`ball`、`shape`、`loft`、`frame`、`toward`。
- 繪圖都放在 `obj(輪廓, 高度, () => ...)` 的函式裡。
- 一般建築的舊樣式設定如果在 `work/city.json` 的 `buildings` 裡，改成手工建模後要移除。

## 4. 視角、說明、狀態
- `work/city.json` 的 `views` 加一個視角，放在 `trees` 之前；`notes` 補一段說明，附來源連結。
- `docs/buildings.md` 加一列，狀態寫「照片」「文字」「部分示意」「示意」之一。`docs/sources.md` 補來源。

## 5. 檢查
```
python tools/build.py --views <視角id>
node tools/shot3d.mjs tamkang-campus.html --out shots/t --view check:<x>,<y>:<zoom>
python tools/build.py --views <視角id> --at 2026-11-27T19:30
```
- 六個角度都要看：沒有破洞、穿模，入口和特殊立面朝向正確，不會被鄰棟擋住。
- 夜景燈光正常，主控台沒有錯誤。
- 最後跑 `python tools/build.py --site-pages`，確認首頁（MapLibre 版）也能建置。
- 用完刪掉 `shots/t`。

## 6. 回報
用繁體中文告訴使用者：
- 畫了什麼。
- 依據哪些照片。
- 哪些是推定的。
- 新視角叫什麼。

不要自行提交或推送。
