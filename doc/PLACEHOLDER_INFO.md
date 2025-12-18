# 截圖佔位符說明

## 📸 關於手冊中的截圖

使用者手冊 `USER_MANUAL_ZH_TW.md` 中已經包含了 74 個截圖引用，格式如下：

```markdown
![截圖說明](images/檔名.png)
> **截圖說明**：詳細的說明文字
```

## 🎯 當前狀態

- **截圖引用**：✅ 已在手冊中加入所有引用（74 個）
- **截圖檔案**：⏳ 待拍攝（0 / 74）
- **截圖目錄**：✅ 已建立（`doc/images/`）

## 📋 下一步操作

### 選項 1：逐步添加截圖（推薦）

您可以按照以下步驟逐步完成截圖：

1. **參考截圖指南**
   ```bash
   # 開啟截圖指南
   cat doc/SCREENSHOT_GUIDE.md
   ```

2. **從高優先級開始**
   先拍攝以下 7 張最重要的截圖：
   - `04_manager_homepage.png` - 管理介面首頁
   - `07_add_instance_form.png` - 新增實例表單
   - `16_status_indicators.png` - 實例狀態指示器
   - `18_fiftyone_interface.png` - FiftyOne 介面
   - `37_label_editor_interface.png` - 標籤編輯器介面
   - `41_draw_bbox.png` - 繪製邊界框
   - `45_label_list.png` - 標籤列表

3. **儲存到正確位置**
   ```bash
   # 將截圖儲存到
   doc/images/檔名.png
   ```

4. **查看效果**
   使用 Markdown 編輯器打開手冊，截圖會自動顯示

### 選項 2：使用佔位符圖片

如果您想先預覽手冊的完整效果，可以建立佔位符圖片：

```bash
# 使用 ImageMagick 建立佔位符（如果已安裝）
for i in {01..74}; do
  convert -size 800x600 xc:lightgray \
    -pointsize 30 -gravity center \
    -annotate +0+0 "截圖 ${i}\n待補充" \
    doc/images/${i}_*.png
done
```

或使用線上工具生成佔位符：
- https://placeholder.com/
- https://via.placeholder.com/

### 選項 3：跳過截圖

手冊內容本身已經非常詳細，即使沒有截圖也可以使用。截圖只是輔助理解的視覺元素。

## 🖼️ 截圖檔案命名

所有截圖必須遵循以下命名格式：

```
NN_description.png
```

其中：
- `NN` 是兩位數編號（01-74）
- `description` 是英文描述（使用底線分隔）
- 副檔名必須是 `.png`

**範例**：
- ✅ `01_system_overview.png`
- ✅ `37_label_editor_interface.png`
- ❌ `screenshot1.png` （格式錯誤）
- ❌ `37_label_editor.jpg` （副檔名錯誤）

## 📂 目錄結構

```
doc/
├── README.md                      # 文件目錄說明
├── USER_MANUAL_ZH_TW.md          # 使用者手冊（主要文件）
├── SCREENSHOT_GUIDE.md            # 截圖拍攝指南
├── PLACEHOLDER_INFO.md            # 本文件
└── images/                        # 截圖目錄
    ├── .gitkeep                   # Git 追蹤標記
    ├── 01_system_overview.png     # 待添加
    ├── 02_env_config.png          # 待添加
    └── ... （共 74 張截圖待添加）
```

## ✅ 檢查清單

添加截圖時，請確認：

- [ ] 檔案格式為 PNG
- [ ] 檔名與 SCREENSHOT_GUIDE.md 中完全一致
- [ ] 圖片清晰可讀（解析度 ≥ 1280x720）
- [ ] 沒有包含敏感資訊（密碼、真實 IP 等）
- [ ] 圖片已儲存到 `doc/images/` 目錄
- [ ] 在 Markdown 編輯器中預覽確認顯示正常

## 🎨 截圖品質建議

### 良好的截圖應該：

✅ **清晰**：文字和 UI 元素清晰可讀
✅ **完整**：包含必要的上下文
✅ **聚焦**：突出重要的功能或區域
✅ **一致**：整體風格和尺寸相似

### 避免：

❌ 模糊或解析度太低
❌ 包含不相關的內容
❌ 截圖太小看不清細節
❌ 包含敏感或私人資訊

## 🛠️ 推薦工具

### 截圖工具

**Windows**：
- **Snipping Tool**（內建）
- **ShareX**（免費，功能強大）
- **Greenshot**（免費，支援標註）

**macOS**：
- **Cmd + Shift + 4**（內建）
- **Skitch**（免費，支援標註）

**Linux**：
- **GNOME Screenshot**（內建）
- **Flameshot**（推薦，支援標註）
- **Shutter**（功能完整）

### 圖片標註工具

如果需要在截圖上添加箭頭、文字或框線：

- **Flameshot**（Linux/Windows）
- **ShareX**（Windows）
- **Skitch**（macOS）
- **draw.io**（線上，適合繪製流程圖）

## 📊 進度追蹤

您可以使用以下命令查看已完成的截圖數量：

```bash
# 計算已添加的截圖
ls doc/images/*.png 2>/dev/null | wc -l

# 列出缺少的截圖（需要 bash）
for i in {01..74}; do
  if ! ls doc/images/${i}_*.png 1>/dev/null 2>&1; then
    echo "缺少：${i}_*.png"
  fi
done
```

## 🎯 快速開始

### 開始拍攝截圖的最快方式：

1. **啟動系統**
   ```bash
   docker compose up -d
   ```

2. **開啟管理介面**
   ```
   http://localhost:3000
   ```

3. **開啟截圖工具**（例如 Flameshot）
   ```bash
   flameshot gui
   ```

4. **拍攝第一張截圖**
   - 截取管理介面首頁
   - 儲存為 `doc/images/04_manager_homepage.png`

5. **預覽效果**
   - 使用 Markdown 編輯器開啟 `USER_MANUAL_ZH_TW.md`
   - 找到對應章節，查看截圖是否正確顯示

6. **繼續拍攝**
   - 參考 `SCREENSHOT_GUIDE.md` 中的清單
   - 按優先級順序完成

## 💡 小提示

1. **批次處理**：在同一個頁面可以拍多張截圖
2. **重複使用**：某些相似的截圖可以使用同一張
3. **靈活調整**：如果某些截圖難以拍攝，可以先跳過
4. **求助他人**：可以請同事或朋友協助拍攝

## 📞 需要協助？

如果在拍攝截圖過程中遇到問題：

1. **參考 SCREENSHOT_GUIDE.md** 查看詳細說明
2. **檢查系統是否正常運行** 確保可以存取各個功能
3. **嘗試不同工具** 每個截圖工具有不同特點
4. **先拍核心截圖** 不必一次完成所有截圖

---

**記住**：手冊的文字內容已經非常完整，截圖是錦上添花。即使只完成高優先級的 7 張截圖，也能大大提升閱讀體驗！

祝您拍攝順利！ 📸
