"use client";

import { useEffect } from 'react';
import { useTranslation } from './LanguageProvider';
import styles from './EditorHelpModal.module.css';

function ChineseContent() {
  return (
    <div className={styles.content}>
      <div className={styles.layout}>
        <nav className={styles.sidebar} aria-label="目錄">
          <div className={styles.sidebarTitle}>目錄</div>
          <ul className={styles.toc}>
            <li><a href="#manager-intro">系統介紹</a></li>
            <li><a href="#manager-add">新增實例</a></li>
            <li><a href="#manager-ops">實例操作</a></li>
            <li><a href="#manager-fiftyone">FiftyOne 操作</a></li>
            <li><a href="#manager-obb">啟用 OBB 格式</a></li>
            <li><a href="#manager-editor">開啟標籤編輯器</a></li>
            <li><a href="#manager-shortcuts">FiftyOne 快速鍵</a></li>
            <li><a href="#manager-faq">常見問題</a></li>
          </ul>
        </nav>
        <div className={styles.main}>
      <section>
        <h3 id="manager-intro">系統介紹</h3>
        <p>FiftyOne Manager 提供以下功能：</p>
        <ul>
          <li><strong>管理多個 FiftyOne 實例</strong> - 同時開啟多個資料集</li>
          <li><strong>瀏覽和檢視資料集</strong> - 視覺化圖片和標註</li>
          <li><strong>編輯 YOLO 標籤</strong> - 直接修正標註錯誤</li>
          <li><strong>智慧去重</strong> - 自動偵測重複圖片</li>
        </ul>
        <img src="/doc-images/01_overview.png" alt="系統首頁" className={styles.image} />
      </section>

      <section>
        <h3 id="manager-add">新增實例</h3>
        <p>點擊<strong>「新增實例」</strong>按鈕新增實例：</p>
        <img src="/doc-images/02_add_instance.png" alt="新增實例" className={styles.image} />
        <img src="/doc-images/02_add_instance-2.png" alt="新增實例 - 進階設定" className={styles.image} />

        <table className={styles.table}>
          <thead>
            <tr><th>欄位</th><th>說明</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>實例名稱</strong></td><td>實例名稱，只能使用英文、數字、底線和連字號</td></tr>
            <tr><td><strong>埠號</strong></td><td>FiftyOne 服務埠號（通常 5151-5160）</td></tr>
            <tr><td><strong>資料集路徑</strong></td><td>資料集路徑，必須包含 images/ 和 labels/ 子資料夾</td></tr>
            <tr><td><strong>類別檔案</strong></td><td>類別名稱檔案（選填）</td></tr>
            <tr><td><strong>重複檢測閾值</strong></td><td>去重檢測相似度（0.0-1.0）</td></tr>
            <tr><td><strong>自動同步標籤</strong></td><td>儲存時自動同步標籤到 FiftyOne</td></tr>
            <tr><td><strong>OBB 格式</strong></td><td>啟用旋轉標註格式</td></tr>
          </tbody>
        </table>

        <h4>資料集結構要求</h4>
        <pre className={styles.codeBlock}>{`您的資料集/
├── images/       # 圖片檔案
│   ├── img001.jpg
│   └── ...
└── labels/       # YOLO 標註檔案
    ├── img001.txt
    └── ...`}</pre>
      </section>

      <section>
        <h3 id="manager-ops">實例操作</h3>

        <h4>頂部工具列（批次操作）</h4>
        <ul>
          <li><strong>啟動選取</strong> - 啟動選取的實例</li>
          <li><strong>停止選取</strong> - 停止選取的實例</li>
          <li><strong>移除選取</strong> - 移除選取的實例（不會刪除資料集檔案）</li>
          <li><strong>新增實例</strong> - 新增實例</li>
        </ul>

        <h4>標籤編輯器資料集選擇</h4>
        <p>點擊標籤編輯器相關按鈕後，會顯示可用的實例與資料集資訊：</p>
        <img src="/doc-images/03_label_editor_dialog.png" alt="標籤編輯器資料集選擇" className={styles.image} />

        <h4>實例卡片按鈕</h4>
        <ul>
          <li><strong>重新啟動</strong> - 重新啟動實例</li>
          <li><strong>停止</strong> - 停止實例</li>
          <li><strong>開啟</strong> - 在新分頁開啟 FiftyOne</li>
          <li><strong>開啟編輯器</strong> - 開啟標籤編輯器</li>
          <li><strong>日誌</strong> - 查看運行狀態和錯誤訊息</li>
        </ul>

        <h4>實例狀態</h4>
        <table className={styles.table}>
          <thead>
            <tr><th>狀態</th><th>說明</th></tr>
          </thead>
          <tbody>
            <tr><td>🟢 執行中</td><td>可以開啟使用</td></tr>
            <tr><td>⚫ 已停止</td><td>需要先啟動</td></tr>
            <tr><td>🔴 錯誤</td><td>啟動失敗，檢查日誌</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3 id="manager-fiftyone">FiftyOne 操作</h3>
        <img src="/doc-images/03_fiftyone.png" alt="FiftyOne 介面" className={styles.image} />

        <h4>網格檢視</h4>
        <img src="/doc-images/04_grid_view.png" alt="網格檢視" className={styles.image} />
        <ul>
          <li>點擊圖片查看詳細資訊</li>
          <li>調整縮圖大小</li>
        </ul>

        <h4>詳細檢視</h4>
        <ul>
          <li><code>← →</code> 切換上/下一張</li>
          <li><code>ESC</code> 返回網格檢視</li>
          <li>滾輪縮放圖片</li>
        </ul>

        <h4>刪除圖片</h4>
        <ol>
          <li>在網格檢視中，點擊圖片左上角的方框選取圖片</li>
          <li>按 <code>`</code> 鍵開啟操作選單</li>
          <li>搜尋 <code>delete</code>，選擇 <strong>Delete Samples (Permanent)</strong></li>
          <li>勾選確認後點擊 <strong>Execute</strong></li>
        </ol>
        <img src="/doc-images/04_delete_samples.png" alt="選取圖片" className={styles.image} />
        <img src="/doc-images/04_delete_samples_menu.png" alt="開啟操作選單" className={styles.image} />
        <img src="/doc-images/04_delete_samples_search.png" alt="搜尋刪除功能" className={styles.image} />
        <img src="/doc-images/04_delete_samples_confirm.png" alt="確認刪除對話框" className={styles.image} />

        <div className={styles.warning}>
          <strong>注意：</strong> 此操作會永久刪除圖片和對應的標籤檔案，無法復原。
        </div>

        <h4>篩選功能</h4>
        <p>使用側邊欄篩選：</p>
        <ul>
          <li><strong>依類別</strong> - 只顯示特定類別的圖片</li>
          <li><strong>依標籤數量</strong> - 顯示特定數量標註的圖片</li>
          <li><strong>依檔名</strong> - 搜尋檔名關鍵字</li>
        </ul>
      </section>

      <section>
        <h3 id="manager-obb">啟用 OBB 格式（旋轉標註）</h3>
        <ol>
          <li>若實例正在運行，先點擊 <strong>停止</strong> 按鈕</li>
          <li>編輯實例設定，勾選 <strong>OBB 格式</strong></li>
          <li>儲存後重新啟動實例</li>
        </ol>
        <img src="/doc-images/10_stop_instance.png" alt="停止實例" className={styles.image} />
        <img src="/doc-images/10_obb_enable.png" alt="啟用 OBB 格式" className={styles.image} />
      </section>

      <section>
        <h3 id="manager-editor">開啟標籤編輯器</h3>
        <ol>
          <li>在 FiftyOne 中點擊圖片進入詳細檢視</li>
          <li>按 <code>`</code> 鍵開啟選單，搜尋 <strong>Edit Label in Tool</strong></li>
          <li>點擊 <strong>Execute</strong> 確認</li>
          <li>複製顯示的 URL，在新分頁開啟</li>
        </ol>
        <img src="/doc-images/05_select_image.png" alt="選擇圖片" className={styles.image} />
        <img src="/doc-images/06_select_edit_tool.png" alt="選擇 Edit Label in Tool" className={styles.image} />
        <img src="/doc-images/06_menu_icon.png" alt="操作選單圖示" className={styles.image} />
        <img src="/doc-images/07_confirm_execute.png" alt="確認執行對話框" className={styles.image} />
        <img src="/doc-images/08_editor_url_box.png" alt="編輯器 URL 訊息框" className={styles.image} />
        <img src="/doc-images/09_editor.png" alt="編輯器介面" className={styles.image} />
      </section>

      <section>
        <h3 id="manager-shortcuts">FiftyOne 快速鍵</h3>
        <table className={styles.table}>
          <thead>
            <tr><th>按鍵</th><th>功能</th></tr>
          </thead>
          <tbody>
            <tr><td><code>← →</code></td><td>切換圖片</td></tr>
            <tr><td><code>ESC</code></td><td>返回網格</td></tr>
            <tr><td><code>F5</code></td><td>重新整理</td></tr>
            <tr><td><code>`</code></td><td>開啟操作選單</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3 id="manager-faq">常見問題</h3>

        <h4>實例無法啟動</h4>
        <ol>
          <li>點擊<strong>日誌</strong>按鈕查看錯誤訊息</li>
          <li>檢查資料集路徑是否正確</li>
          <li>確認包含 images/ 和 labels/ 資料夾</li>
          <li>確認連接埠未被使用</li>
        </ol>

        <h4>儲存後沒有更新</h4>
        <ul>
          <li>FiftyOne 不會自動更新標籤檔</li>
          <li>回到 Manager 點擊<strong>重新啟動</strong>重新啟動實例</li>
        </ul>

        <h4>復原重複圖片</h4>
        <ol>
          <li>找到 <code>duplicate/images/</code> 和 <code>duplicate/labels/</code></li>
          <li>將檔案移回 <code>images/</code> 和 <code>labels/</code></li>
          <li>重新啟動實例</li>
        </ol>
      </section>
        </div>
      </div>
    </div>
  );
}

function EnglishContent() {
  return (
    <div className={styles.content}>
      <div className={styles.layout}>
        <nav className={styles.sidebar} aria-label="Table of contents">
          <div className={styles.sidebarTitle}>Contents</div>
          <ul className={styles.toc}>
            <li><a href="#manager-intro">System Overview</a></li>
            <li><a href="#manager-add">Add Instance</a></li>
            <li><a href="#manager-ops">Instance Operations</a></li>
            <li><a href="#manager-fiftyone">FiftyOne Operations</a></li>
            <li><a href="#manager-obb">Enable OBB Format</a></li>
            <li><a href="#manager-editor">Open Label Editor</a></li>
            <li><a href="#manager-shortcuts">Keyboard Shortcuts</a></li>
            <li><a href="#manager-faq">FAQ</a></li>
          </ul>
        </nav>
        <div className={styles.main}>
      <section>
        <h3 id="manager-intro">System Overview</h3>
        <p>FiftyOne Manager provides the following features:</p>
        <ul>
          <li><strong>Manage multiple FiftyOne instances</strong> - Open multiple datasets simultaneously</li>
          <li><strong>Browse and view datasets</strong> - Visualize images and annotations</li>
          <li><strong>Edit YOLO labels</strong> - Directly correct annotation errors</li>
          <li><strong>Smart deduplication</strong> - Automatically detect duplicate images</li>
        </ul>
        <img src="/doc-images/01_overview.png" alt="System Overview" className={styles.image} />
      </section>

      <section>
        <h3 id="manager-add">Add Instance</h3>
        <p>Click the <strong>"Add Instance"</strong> button to create a new instance:</p>
        <img src="/doc-images/02_add_instance.png" alt="Add Instance" className={styles.image} />
        <img src="/doc-images/02_add_instance-2.png" alt="Add Instance - Advanced Settings" className={styles.image} />

        <table className={styles.table}>
          <thead>
            <tr><th>Field</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Instance Name</strong></td><td>Instance name, only letters, numbers, underscores, and hyphens allowed</td></tr>
            <tr><td><strong>Port</strong></td><td>FiftyOne service port (usually 5151-5160)</td></tr>
            <tr><td><strong>Dataset Path</strong></td><td>Dataset path, must contain images/ and labels/ subdirectories</td></tr>
            <tr><td><strong>Class File</strong></td><td>Class names file (optional)</td></tr>
            <tr><td><strong>Duplicate Threshold</strong></td><td>Deduplication similarity threshold (0.0-1.0)</td></tr>
            <tr><td><strong>Auto Sync Labels</strong></td><td>Auto sync labels to FiftyOne on save</td></tr>
            <tr><td><strong>OBB Format</strong></td><td>Enable oriented bounding box format</td></tr>
          </tbody>
        </table>

        <h4>Dataset Structure Requirements</h4>
        <pre className={styles.codeBlock}>{`your_dataset/
├── images/       # Image files
│   ├── img001.jpg
│   └── ...
└── labels/       # YOLO label files
    ├── img001.txt
    └── ...`}</pre>
      </section>

      <section>
        <h3 id="manager-ops">Instance Operations</h3>

        <h4>Top Toolbar (Bulk Actions)</h4>
        <ul>
          <li><strong>Start Selected</strong> - Start selected instances</li>
          <li><strong>Stop Selected</strong> - Stop selected instances</li>
          <li><strong>Remove Selected</strong> - Remove selected instances (does not delete dataset files)</li>
          <li><strong>Add Instance</strong> - Add a new instance</li>
        </ul>

        <h4>Label Editor Dataset Selection</h4>
        <p>After opening the label editor entry, a dataset list dialog appears:</p>
        <img src="/doc-images/03_label_editor_dialog.png" alt="Label Editor Dataset Selection" className={styles.image} />

        <h4>Instance Card Buttons</h4>
        <ul>
          <li><strong>Restart</strong> - Restart the instance</li>
          <li><strong>Stop</strong> - Stop the instance</li>
          <li><strong>Open</strong> - Open FiftyOne in a new tab</li>
          <li><strong>Open Editor</strong> - Open the label editor</li>
          <li><strong>Logs</strong> - View status and error messages</li>
        </ul>

        <h4>Instance Status</h4>
        <table className={styles.table}>
          <thead>
            <tr><th>Status</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td>🟢 Running</td><td>Ready to use</td></tr>
            <tr><td>⚫ Stopped</td><td>Needs to be started</td></tr>
            <tr><td>🔴 Error</td><td>Failed to start, check logs</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3 id="manager-fiftyone">FiftyOne Operations</h3>
        <img src="/doc-images/03_fiftyone.png" alt="FiftyOne Interface" className={styles.image} />

        <h4>Grid View</h4>
        <img src="/doc-images/04_grid_view.png" alt="Grid View" className={styles.image} />
        <ul>
          <li>Click an image to view details</li>
          <li>Adjust thumbnail size</li>
        </ul>

        <h4>Detail View</h4>
        <ul>
          <li><code>← →</code> Navigate images</li>
          <li><code>ESC</code> Return to grid view</li>
          <li>Scroll wheel to zoom</li>
        </ul>

        <h4>Delete Images</h4>
        <ol>
          <li>In grid view, click the checkbox in the top-left corner of images</li>
          <li>Press <code>`</code> to open the action menu</li>
          <li>Search for <code>delete</code>, select <strong>Delete Samples (Permanent)</strong></li>
          <li>Confirm and click <strong>Execute</strong></li>
        </ol>
        <img src="/doc-images/04_delete_samples.png" alt="Select Images" className={styles.image} />
        <img src="/doc-images/04_delete_samples_menu.png" alt="Open Action Menu" className={styles.image} />
        <img src="/doc-images/04_delete_samples_search.png" alt="Search Delete" className={styles.image} />
        <img src="/doc-images/04_delete_samples_confirm.png" alt="Confirm Delete" className={styles.image} />

        <div className={styles.warning}>
          <strong>Warning:</strong> This action permanently deletes images and corresponding label files. This cannot be undone.
        </div>

        <h4>Filtering</h4>
        <p>Use the sidebar to filter:</p>
        <ul>
          <li><strong>By class</strong> - Show only images with specific classes</li>
          <li><strong>By label count</strong> - Show images with specific annotation counts</li>
          <li><strong>By filename</strong> - Search by filename keyword</li>
        </ul>
      </section>

      <section>
        <h3 id="manager-obb">Enable OBB Format (Rotated Labels)</h3>
        <ol>
          <li>Stop the instance if it is running</li>
          <li>Edit the instance and enable <strong>OBB Format</strong></li>
          <li>Save and restart the instance</li>
        </ol>
        <img src="/doc-images/10_stop_instance.png" alt="Stop Instance" className={styles.image} />
        <img src="/doc-images/10_obb_enable.png" alt="Enable OBB Format" className={styles.image} />
      </section>

      <section>
        <h3 id="manager-editor">Open Label Editor</h3>
        <ol>
          <li>Click an image in FiftyOne to enter detail view</li>
          <li>Press <code>`</code> to open menu, search for <strong>Edit Label in Tool</strong></li>
          <li>Click <strong>Execute</strong> to confirm</li>
          <li>Copy the displayed URL and open in a new tab</li>
        </ol>
        <img src="/doc-images/05_select_image.png" alt="Select Image" className={styles.image} />
        <img src="/doc-images/06_select_edit_tool.png" alt="Select Edit Label in Tool" className={styles.image} />
        <img src="/doc-images/06_menu_icon.png" alt="Action Menu Icon" className={styles.image} />
        <img src="/doc-images/07_confirm_execute.png" alt="Confirm Execute" className={styles.image} />
        <img src="/doc-images/08_editor_url_box.png" alt="Editor URL Dialog" className={styles.image} />
        <img src="/doc-images/09_editor.png" alt="Editor Interface" className={styles.image} />
      </section>

      <section>
        <h3 id="manager-shortcuts">FiftyOne Keyboard Shortcuts</h3>
        <table className={styles.table}>
          <thead>
            <tr><th>Key</th><th>Function</th></tr>
          </thead>
          <tbody>
            <tr><td><code>← →</code></td><td>Navigate images</td></tr>
            <tr><td><code>ESC</code></td><td>Return to grid</td></tr>
            <tr><td><code>F5</code></td><td>Refresh</td></tr>
            <tr><td><code>`</code></td><td>Open action menu</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3 id="manager-faq">FAQ</h3>

        <h4>Instance won't start</h4>
        <ol>
          <li>Click the <strong>Logs</strong> button to view error messages</li>
          <li>Check if the dataset path is correct</li>
          <li>Verify images/ and labels/ directories exist</li>
          <li>Confirm the port is not in use</li>
        </ol>

        <h4>Changes not reflected after save</h4>
        <ul>
          <li>FiftyOne does not auto-refresh label files</li>
          <li>Return to Manager and click <strong>Restart</strong> to reload</li>
        </ul>

        <h4>Recover duplicate images</h4>
        <ol>
          <li>Find <code>duplicate/images/</code> and <code>duplicate/labels/</code></li>
          <li>Move files back to <code>images/</code> and <code>labels/</code></li>
          <li>Restart the instance</li>
        </ol>
      </section>
        </div>
      </div>
    </div>
  );
}

export default function ManagerHelpModal({ isOpen, onClose }) {
  const { lang, t } = useTranslation();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isZhTW = lang === 'zh-TW';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{t('help.managerTitle')}</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        {isZhTW ? <ChineseContent /> : <EnglishContent />}
      </div>
    </div>
  );
}
