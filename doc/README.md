# 📚 FiftyOne Manager 文件目錄

此目錄包含 FiftyOne Manager 的完整使用者文件。

## 📖 文件列表

### 主要文件

- **[USER_MANUAL_ZH_TW.md](USER_MANUAL_ZH_TW.md)**
  完整的繁體中文使用者手冊，包含：
  - 系統安裝與設定
  - FiftyOne Manager 使用指南
  - 標籤編輯器完整教學
  - CVAT 整合說明
  - 常見問題解答
  - 故障排除指南

### 輔助文件

- **[SCREENSHOT_GUIDE.md](SCREENSHOT_GUIDE.md)**
  截圖拍攝指南，包含：
  - 完整的截圖清單（共 74 張）
  - 每張截圖的詳細說明
  - 拍攝建議和工具推薦
  - 優先級指引

## 🖼️ 截圖目錄

截圖檔案存放在 `images/` 子目錄中：

```
doc/
├── USER_MANUAL_ZH_TW.md          # 主要手冊
├── SCREENSHOT_GUIDE.md            # 截圖指南
├── README.md                      # 本文件
└── images/                        # 截圖目錄
    ├── 01_system_overview.png
    ├── 02_env_config.png
    ├── 03_docker_status.png
    └── ... (共 74 張截圖)
```

## 🎯 快速開始

### 閱讀手冊

1. 開啟 [USER_MANUAL_ZH_TW.md](USER_MANUAL_ZH_TW.md)
2. 根據目錄跳轉到您需要的章節
3. 跟隨步驟操作

### 添加截圖

1. 閱讀 [SCREENSHOT_GUIDE.md](SCREENSHOT_GUIDE.md)
2. 根據清單拍攝所需的截圖
3. 將截圖以正確的檔名儲存到 `images/` 目錄
4. 截圖會自動在手冊中顯示

## 📋 截圖進度追蹤

目前截圖狀態：

- ✅ 已完成：0 / 74
- ⏳ 待完成：74 / 74

### 高優先級截圖（必須有）

- [ ] `04_manager_homepage.png` - 管理介面首頁
- [ ] `07_add_instance_form.png` - 新增實例表單
- [ ] `16_status_indicators.png` - 實例狀態指示器
- [ ] `18_fiftyone_interface.png` - FiftyOne 介面
- [ ] `37_label_editor_interface.png` - 標籤編輯器完整介面
- [ ] `41_draw_bbox.png` - 繪製邊界框
- [ ] `45_label_list.png` - 標籤列表

### 中優先級截圖（建議有）

- [ ] `09_folder_browser.png` - 資料夾瀏覽器
- [ ] `20_logs_window.png` - 實例日誌視窗
- [ ] `28_duplicate_structure.png` - 去重資料夾結構
- [ ] `33_operator_button.png` - FiftyOne 操作面板
- [ ] `34_search_edit_label.png` - 搜尋編輯操作
- [ ] `35_execute_operator.png` - 執行操作
- [ ] `39_editor_layout.png` - 編輯器佈局說明

完整清單請參考 [SCREENSHOT_GUIDE.md](SCREENSHOT_GUIDE.md)。

## 🛠️ 推薦工具

### 截圖工具

**跨平台**：
- Flameshot（免費，支援標註）
- ShareX（Windows，免費）

**在線繪圖**：
- draw.io (https://app.diagrams.net/) - 繪製架構圖和流程圖
- Excalidraw (https://excalidraw.com/) - 手繪風格圖表

### Markdown 編輯器

推薦使用支援即時預覽的編輯器：

- **VS Code** + Markdown Preview Enhanced 擴充功能
- **Typora** (付費，所見即所得)
- **Mark Text** (免費，開源)
- **Obsidian** (免費)

## 📐 文件規範

### Markdown 格式

- 使用 GitHub Flavored Markdown (GFM)
- 圖片使用相對路徑：`![說明](images/檔名.png)`
- 表格對齊使用標準 Markdown 語法

### 截圖規範

- **格式**：PNG
- **解析度**：最小 1280x720，推薦 1920x1080
- **檔名**：使用清單中的確切檔名
- **內容**：不包含敏感資訊（密碼、真實 IP 等）

### 語言規範

- 使用繁體中文（台灣）
- 技術術語保留英文，後加中文說明
- 範例：Docker（容器技術）

## 🔄 更新流程

### 更新手冊內容

1. 編輯 `USER_MANUAL_ZH_TW.md`
2. 確認 Markdown 格式正確
3. 提交變更

### 更新或新增截圖

1. 拍攝新截圖或更新現有截圖
2. 使用正確的檔名儲存到 `images/` 目錄
3. 如果是新增截圖：
   - 在手冊中加入圖片引用
   - 更新 SCREENSHOT_GUIDE.md

### 版本控制

建議使用 Git 追蹤文件變更：

```bash
# 提交手冊更新
git add doc/USER_MANUAL_ZH_TW.md
git commit -m "docs: update user manual"

# 提交新截圖
git add doc/images/*.png
git commit -m "docs: add screenshots for user manual"
```

## 📝 貢獻指南

歡迎協助改進文件！

### 如何貢獻

1. **回報問題**：
   - 發現錯誤或不清楚的地方
   - 建議新增內容
   - 回報連結失效

2. **改進文件**：
   - 修正錯字或語法
   - 補充說明或範例
   - 改善排版和格式

3. **提供截圖**：
   - 拍攝清晰的截圖
   - 確保檔名正確
   - 必要時加上標註

### 文件品質標準

- ✅ 內容正確且最新
- ✅ 說明清晰易懂
- ✅ 範例完整可執行
- ✅ 截圖清晰且相關
- ✅ 格式統一規範

## 📞 問題回報

如果發現文件問題，請：

1. 記錄問題位置（章節、段落）
2. 描述問題（錯誤、不清楚、過時等）
3. 如果可能，提供建議的改進方案
4. 回報給維護團隊

## 📚 相關資源

### 官方文件

- [FiftyOne 官方文件](https://docs.voxel51.com/)
- [Docker 文件](https://docs.docker.com/)
- [CVAT 文件](https://opencv.github.io/cvat/docs/)

### 專案文件

- [README.md](../README.md) - 專案主要說明（英文）
- [QUICK_START.md](../QUICK_START.md) - 快速開始指南
- [LABEL_EDITOR_GUIDE.md](../LABEL_EDITOR_GUIDE.md) - 標籤編輯器指南
- [CVAT_INTEGRATION.md](../CVAT_INTEGRATION.md) - CVAT 整合文件

## 🎓 學習路徑

### 新手入門

1. 閱讀「系統簡介」和「系統需求」章節
2. 跟隨「安裝與設定」完成環境設定
3. 學習「新增 FiftyOne 實例」
4. 嘗試「啟動和管理實例」

### 進階使用

1. 理解「去重功能」的原理和調整
2. 學習「標籤編輯器」進行標註修正
3. 探索「CVAT 整合」進行專業標註
4. 參考「最佳實踐」優化工作流程

### 問題解決

1. 遇到問題時先查閱「常見問題」章節
2. 查看相關的故障排除小節
3. 檢查系統日誌
4. 尋求社群協助

## 📊 文件統計

- **總字數**：約 25,000 字
- **章節數**：9 個主要章節
- **截圖數**：74 張（待補充）
- **範例代碼**：20+ 個
- **表格**：30+ 個

## 🏆 致謝

感謝所有為此文件做出貢獻的人員！

---

**文件維護**：FiftyOne Manager 開發團隊
**最後更新**：2024 年 12 月
**版本**：1.0

如有任何問題或建議，歡迎回饋！
