# 截圖指南

本文件列出了使用者手冊中所有需要的截圖，以及拍攝建議。

## 📸 截圖清單

**總數：69 張截圖**

---

### 系統介紹和基本操作（1-4）

| 檔名 | 說明 | 拍攝建議 |
|------|------|----------|
| `01_system_overview.png` | FiftyOne Manager 主畫面 | 開啟 http://localhost:3000 的完整頁面截圖 |
| `02_login_page.png` | 開啟管理介面 | 首次開啟的畫面 |
| `03_interface_layout.png` | 主介面各區域說明 | 在主畫面上用箭頭和文字標註頂部、實例卡片區、操作按鈕 |
| `04_status_indicators.png` | 不同狀態的實例卡片 | 並排顯示運行中（綠）、停止（灰）、錯誤（紅）的實例 |

---

### 新增實例（5-10）

| 檔名 | 說明 | 拍攝建議 |
|------|------|----------|
| `05_add_instance_button.png` | 新增實例按鈕位置 | 標註右上角的「+ 新增實例」按鈕 |
| `06_add_instance_form.png` | 新增實例對話框 | 彈出的表單，包含所有欄位 |
| `07_folder_browser.png` | 瀏覽資料集資料夾 | 點擊「瀏覽」後的資料夾樹狀結構 |
| `08_dataset_structure.png` | 正確的資料集資料夾結構 | 使用檔案管理器顯示 images/ 和 labels/ 資料夾 |
| `09_iou_explanation.png` | IoU 閾值視覺化比較 | 圖示說明不同閾值的差異（可以是簡單的示意圖） |
| `10_instance_created.png` | 成功建立實例 | 顯示成功訊息或新實例出現在列表中 |

---

### 啟動和管理實例（11-22）

| 檔名 | 說明 | 拍攝建議 |
|------|------|----------|
| `11_start_button.png` | 實例卡片上的啟動按鈕 | 突顯啟動按鈕的實例卡片 |
| `12_starting_process.png` | 實例啟動中的狀態 | 顯示「啟動中」或 loading 狀態 |
| `13_open_button.png` | 開啟 FiftyOne 按鈕 | 運行中的實例，標註「開啟」按鈕 |
| `14_fiftyone_interface.png` | FiftyOne 資料集瀏覽介面 | 開啟 FiftyOne 後的完整介面 |
| `15_logs_button.png` | 查看日誌按鈕 | 實例卡片上的「日誌」按鈕 |
| `16_logs_window.png` | 實例日誌內容 | 點擊日誌後的彈出視窗 |
| `17_stop_button.png` | 停止實例按鈕 | 運行中實例的「停止」按鈕 |
| `18_restart_button.png` | 重新啟動按鈕 | 「重新啟動」按鈕 |
| `19_edit_button.png` | 編輯實例設定 | 停止狀態下的「編輯」按鈕 |
| `20_delete_confirm.png` | 刪除實例確認對話框 | 確認刪除的對話框 |
| `21_iou_calculation.png` | IoU 相似度計算示意圖 | 兩個重疊的邊界框，標註交集和聯集 |
| `22_duplicate_folder.png` | 去重後的資料夾結構 | 檔案管理器顯示 duplicate/ 資料夾 |

---

### FiftyOne 瀏覽資料集（23-30）

| 檔名 | 說明 | 拍攝建議 |
|------|------|----------|
| `23_fiftyone_overview.png` | FiftyOne 主要區域 | 標註工具列、側邊欄、網格檢視等區域 |
| `24_grid_view.png` | FiftyOne 網格檢視模式 | 顯示多張圖片縮圖的網格 |
| `25_detail_view.png` | 單張圖片詳細檢視 | 點擊圖片後的大圖檢視，顯示標註框 |
| `26_sidebar_filters.png` | 側邊欄篩選選項 | FiftyOne 左側側邊欄的篩選器 |
| `27_filter_example.png` | 篩選後的結果 | 套用篩選後只顯示特定圖片 |
| `28_statistics.png` | 資料集統計資訊面板 | 側邊欄中的統計資訊 |
| `29_sort_options.png` | 排序方式選單 | 展開排序選項的下拉選單 |
| `30_multi_select.png` | 選擇多張圖片 | 多張圖片被選中的狀態 |

---

### 標籤編輯器 - 開啟流程（31-37）

| 檔名 | 說明 | 拍攝建議 |
|------|------|----------|
| `31_select_image.png` | 在 FiftyOne 中選擇圖片 | FiftyOne 中選中一張圖片的狀態 |
| `32_operator_button.png` | FiftyOne 操作按鈕位置 | 標註右上角的操作按鈕（閃電圖示） |
| `33_search_edit.png` | 搜尋「Edit Label in Tool」 | 操作搜尋框顯示搜尋結果 |
| `34_execute_edit.png` | 執行編輯標籤操作 | 選中「Edit Label in Tool」的畫面 |
| `35_auto_open.png` | 自動開啟編輯器頁面 | auto-open.html 頁面顯示連結 |
| `36_editor_interface.png` | 標籤編輯器完整介面 | 標籤編輯器的完整截圖 |
| `37_editor_layout.png` | 編輯器各區域詳細說明 | 在編輯器截圖上標註各個區域 |

---

### 標籤編輯器 - 編輯操作（38-49）

| 檔名 | 說明 | 拍攝建議 |
|------|------|----------|
| `38_select_class.png` | 類別選擇下拉選單 | 展開的類別選擇器 |
| `39_draw_bbox.png` | 拖曳繪製邊界框 | 正在繪製邊界框的截圖（滑鼠拖曳中） |
| `40_adjust_bbox.png` | 調整邊界框大小和位置 | 滑鼠懸停在邊界框角落，顯示調整游標 |
| `41_delete_label.png` | 刪除標籤按鈕 | 標籤列表，標註刪除按鈕 |
| `42_reclass_label.png` | 重新分類按鈕 | 點擊「重新分類」按鈕的畫面 |
| `43_select_new_class.png` | 選擇新的類別 | 重新分類時的類別選擇 |
| `44_resize_bbox.png` | 調整邊界框示意 | 拖曳調整邊界框 |
| `45_save_button.png` | 儲存標籤按鈕 | 頂部工具列的「儲存」按鈕 |
| `46_save_success.png` | 儲存成功訊息 | 顯示成功通知的截圖 |
| `47_refresh_fiftyone.png` | 重新整理 FiftyOne | FiftyOne 重新整理後顯示更新的標籤 |
| `48_label_list.png` | 完整的標籤列表 | 左側面板顯示多個標籤 |
| `49_keyboard_shortcuts.png` | 鍵盤快速鍵參考 | 可以是簡單的表格圖片 |

---

### 標籤編輯器 - 常見情境（50-54）

| 檔名 | 說明 | 拍攝建議 |
|------|------|----------|
| `50_fix_class_flow.png` | 修正類別的完整步驟 | 分步驟截圖的組合或流程圖 |
| `51_add_missing_flow.png` | 新增遺漏物件的步驟 | 分步驟截圖的組合或流程圖 |
| `52_delete_wrong_flow.png` | 刪除錯誤標註 | 刪除流程示意 |
| `53_adjust_bbox_flow.png` | 調整邊界框的步驟 | 調整流程示意 |
| `54_quick_edit.png` | 快速編輯助手介面 | quick-edit.html 頁面 |

---

### 常見問題 - 故障排除（55-68）

| 檔名 | 說明 | 拍攝建議 |
|------|------|----------|
| `55_check_logs.png` | 查看實例日誌 | 日誌視窗顯示錯誤訊息 |
| `56_check_duplicates.png` | duplicate 資料夾位置 | 檔案管理器顯示 duplicate 資料夾 |
| `57_filter_by_class.png` | 點擊類別進行篩選 | FiftyOne 側邊欄類別篩選 |
| `58_zoom_image.png` | 圖片縮放操作 | FiftyOne 中縮放圖片 |
| `59_export_images.png` | 匯出圖片選項 | FiftyOne 的匯出功能 |
| `60_check_popup.png` | 檢查瀏覽器是否封鎖彈出視窗 | 瀏覽器的彈出視窗封鎖提示 |
| `61_image_load_error.png` | 圖片載入錯誤 | 編輯器顯示圖片無法載入 |
| `62_save_error.png` | 儲存失敗錯誤訊息 | 儲存失敗的錯誤對話框 |
| `63_refresh_reminder.png` | 重新整理 FiftyOne | 提示重新整理的說明 |
| `64_precise_drawing.png` | 精確繪製技巧 | 放大圖片繪製邊界框 |
| `65_yolo_format.png` | YOLO 標籤格式說明 | 文字編輯器顯示 .txt 檔案內容 |
| `66_restore_duplicates.png` | 手動復原重複圖片 | 檔案管理器移動檔案的操作 |
| `67_classes_file.png` | classes.txt 檔案內容 | 文字編輯器顯示類別列表 |
| `68_system_info.png` | 系統資訊顯示位置 | 管理介面底部的系統資訊 |

---

### 附錄（69）

| 檔名 | 說明 | 拍攝建議 |
|------|------|----------|
| `69_class_examples.png` | 各類別的視覺範例 | 並排顯示骰子 1-6 和無效的範例圖片 |

---

## 📝 拍攝建議

### 通用原則

1. **解析度**：建議至少 1280x720，最好 1920x1080
2. **格式**：PNG 格式（保持清晰度）
3. **內容**：確保截圖中沒有敏感資訊
4. **語言**：介面為英文或中文皆可
5. **清晰度**：文字和按鈕必須清晰可讀

### 工具建議

**Windows**：
- Snipping Tool（內建）
- ShareX（免費，支援標註）
- Greenshot（免費）

**macOS**：
- Cmd + Shift + 4（內建）
- Skitch（免費，支援標註）

**Linux**：
- Flameshot（推薦，支援標註）
- GNOME Screenshot（內建）
- Shutter

---

## 🎯 優先級

### 高優先級（必須有）- 15 張

這些截圖對理解系統使用至關重要：

- [ ] `01_system_overview.png` - 系統主畫面
- [ ] `04_status_indicators.png` - 狀態指示
- [ ] `06_add_instance_form.png` - 新增實例表單
- [ ] `14_fiftyone_interface.png` - FiftyOne 介面
- [ ] `16_logs_window.png` - 日誌視窗
- [ ] `24_grid_view.png` - 網格檢視
- [ ] `25_detail_view.png` - 詳細檢視
- [ ] `31_select_image.png` - 選擇圖片
- [ ] `32_operator_button.png` - 操作按鈕
- [ ] `36_editor_interface.png` - 編輯器介面
- [ ] `39_draw_bbox.png` - 繪製邊界框
- [ ] `48_label_list.png` - 標籤列表
- [ ] `45_save_button.png` - 儲存按鈕
- [ ] `47_refresh_fiftyone.png` - 重新整理
- [ ] `65_yolo_format.png` - YOLO 格式

### 中優先級（建議有）- 20 張

這些截圖能大幅提升使用體驗：

- [ ] `03_interface_layout.png` - 介面佈局說明
- [ ] `05_add_instance_button.png` - 新增按鈕
- [ ] `07_folder_browser.png` - 資料夾瀏覽器
- [ ] `08_dataset_structure.png` - 資料集結構
- [ ] `11_start_button.png` - 啟動按鈕
- [ ] `13_open_button.png` - 開啟按鈕
- [ ] `15_logs_button.png` - 日誌按鈕
- [ ] `17_stop_button.png` - 停止按鈕
- [ ] `23_fiftyone_overview.png` - FiftyOne 區域
- [ ] `26_sidebar_filters.png` - 側邊欄篩選
- [ ] `33_search_edit.png` - 搜尋編輯
- [ ] `34_execute_edit.png` - 執行操作
- [ ] `37_editor_layout.png` - 編輯器佈局
- [ ] `38_select_class.png` - 選擇類別
- [ ] `40_adjust_bbox.png` - 調整邊界框
- [ ] `41_delete_label.png` - 刪除標籤
- [ ] `42_reclass_label.png` - 重新分類
- [ ] `46_save_success.png` - 儲存成功
- [ ] `55_check_logs.png` - 查看日誌
- [ ] `67_classes_file.png` - 類別檔案

### 低優先級（可選）- 34 張

這些截圖是補充說明，可以用文字替代：

- 其他所有未列在上面的截圖
- 流程圖類（50-54）可以用簡單的圖示
- 錯誤截圖（56-64）可以用文字說明

---

## 📂 檔案放置

所有截圖檔案應該放在：

```
doc/images/
├── 01_system_overview.png
├── 02_login_page.png
├── 03_interface_layout.png
└── ... (共 69 張截圖)
```

### 命名規則

- 使用清單中的確切檔名
- 統一使用 PNG 格式
- 檔名使用底線分隔
- 包含兩位數編號（01-69）

---

## ✅ 檢查清單

拍攝完截圖後，請確認：

- [ ] 所有檔案都是 PNG 格式
- [ ] 檔名與清單完全一致
- [ ] 截圖內容清晰可讀
- [ ] 沒有敏感資訊（真實密碼、IP 等可以用範例取代）
- [ ] 所有檔案都放在 `doc/images/` 目錄
- [ ] 需要標註的截圖已加上箭頭或文字說明
- [ ] 在手冊中測試圖片連結都能正確顯示

---

## 🚀 快速開始指南

### 開始拍攝截圖的步驟：

1. **啟動系統**
   ```bash
   # 如果使用 Docker
   docker compose up -d

   # 或向系統管理員確認系統網址
   ```

2. **開啟管理介面**
   ```
   http://localhost:3000
   # 或您的系統網址
   ```

3. **準備截圖工具**
   - Windows: 按 Win + Shift + S
   - Mac: 按 Cmd + Shift + 4
   - Linux: 開啟 Flameshot

4. **按照優先級拍攝**
   - 先完成高優先級的 15 張
   - 再拍攝中優先級的 20 張
   - 最後考慮低優先級的截圖

5. **儲存檔案**
   ```
   儲存位置：doc/images/
   檔名格式：NN_description.png
   ```

6. **預覽效果**
   - 使用 Markdown 編輯器開啟手冊
   - 確認截圖正確顯示
   - 檢查圖片清晰度

---

## 💡 拍攝技巧

### 1. FiftyOne Manager 截圖

**拍攝完整頁面**：
- 確保整個瀏覽器視窗都在畫面中
- 包含所有實例卡片
- 顯示頂部標題列

**拍攝按鈕和操作**：
- 可以用滑鼠懸停讓按鈕反白
- 或用標註工具加上箭頭指示

### 2. FiftyOne 介面截圖

**網格檢視**：
- 調整視窗大小顯示適當數量的圖片
- 確保縮圖清晰可見

**詳細檢視**：
- 選擇一張有清晰標註框的圖片
- 確保邊界框和類別標籤清晰

### 3. 標籤編輯器截圖

**完整介面**：
- 包含左側列表、中央畫布、頂部工具列
- 選擇有 2-3 個標註的圖片作為範例

**繪製過程**：
- 可以請別人幫忙拍攝正在拖曳的畫面
- 或使用螢幕錄影軟體截取單幀

**標註說明**：
- 需要標註的截圖可以用任何圖片編輯器加上箭頭和文字
- 保持簡潔清晰

### 4. 流程圖和示意圖

**IoU 計算示意**：
- 可以用簡單的圖形繪製兩個重疊的矩形
- 用不同顏色表示交集和聯集
- 工具：draw.io, PowerPoint, 或任何繪圖軟體

**流程圖**：
- 使用箭頭連接步驟
- 保持簡單易懂
- 工具：draw.io, Excalidraw

---

## 🔄 批次處理建議

如果要高效率完成拍攝：

### 階段 1：FiftyOne Manager（20 張）
1. 開啟管理介面
2. 拍攝主畫面相關（1-5）
3. 建立實例並拍攝（6-10）
4. 操作實例並拍攝（11-22）

### 階段 2：FiftyOne 瀏覽（8 張）
1. 開啟一個 FiftyOne 實例
2. 拍攝介面和檢視模式（23-25）
3. 操作篩選和功能（26-30）

### 階段 3：標籤編輯器（24 張）
1. 從 FiftyOne 開啟編輯器
2. 拍攝開啟流程（31-37）
3. 執行各種編輯操作並拍攝（38-54）

### 階段 4：問題和附錄（15 張）
1. 重現常見問題場景
2. 拍攝故障排除相關（55-64）
3. 拍攝檔案內容和範例（65-69）

---

## 📞 需要協助？

如果在拍攝截圖過程中遇到問題：

1. **功能無法使用**
   - 確認系統正常運行
   - 向系統管理員確認設定
   - 先跳過該截圖

2. **不確定如何拍攝**
   - 參考手冊中的文字說明
   - 查看該截圖的上下文
   - 拍攝類似的畫面

3. **技術問題**
   - 嘗試不同的截圖工具
   - 調整螢幕解析度
   - 使用其他瀏覽器

---

## 📊 進度追蹤

使用以下命令查看進度：

```bash
# 計算已完成的截圖
ls doc/images/*.png 2>/dev/null | wc -l

# 顯示缺少的截圖
for i in {01..69}; do
  if ! ls doc/images/${i}_*.png 1>/dev/null 2>&1; then
    echo "缺少：${i}_*.png"
  fi
done
```

---

**記住**：截圖是為了幫助使用者理解，不需要完美。清晰度和實用性最重要！

如果某些截圖難以拍攝，可以：
- 用文字說明替代
- 使用簡單的示意圖
- 請其他人協助拍攝

祝您拍攝順利！ 📸
