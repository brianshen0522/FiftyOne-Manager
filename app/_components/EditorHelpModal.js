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
            <li><a href="#editor-ui">編輯器介面</a></li>
            <li><a href="#editor-filter">篩選圖片</a></li>
            <li><a href="#editor-actions">編輯操作</a></li>
            <li><a href="#editor-save">儲存變更</a></li>
            <li><a href="#editor-shortcuts">快速鍵</a></li>
            <li><a href="#editor-select-delete">選取與刪除圖片</a></li>
          </ul>
        </nav>
        <div className={styles.main}>
      <section>
        <h3 id="editor-ui">編輯器介面</h3>
        <img src="/doc-images/09_editor.png" alt="編輯器介面" className={styles.image} />
        <p>編輯器包含以下區域：</p>

        <h4>頂部工具列</h4>
        <ul>
          <li><strong>← 上一張 / 下一張 →</strong> - 切換上一張/下一張圖片</li>
          <li><strong>圖片計數</strong> - 顯示當前圖片位置（例如：45 / 479）</li>
          <li><strong>重新載入</strong> - 重新載入當前圖片</li>
          <li><strong>儲存標籤</strong> - 儲存標籤變更</li>
        </ul>

        <h4>右側面板</h4>
        <table className={styles.table}>
          <thead>
            <tr><th>區域</th><th>功能</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>篩選圖片</strong></td><td>篩選圖片功能（點擊展開）</td></tr>
            <tr><td><strong>圖片資訊</strong></td><td>顯示檔名和圖片尺寸</td></tr>
            <tr><td><strong>OBB 建立模式</strong></td><td>顯示當前 OBB 建立模式</td></tr>
            <tr><td><strong>顯示</strong></td><td>調整標註線寬（線寬滑桿）</td></tr>
            <tr><td><strong>選擇類別</strong></td><td>類別選擇按鈕，點擊可變更選取標註的類別</td></tr>
            <tr><td><strong>標註</strong></td><td>標註列表，顯示每個標註的類別和刪除按鈕</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3 id="editor-filter">篩選圖片</h3>
        <p>展開<strong>篩選圖片</strong>面板可使用以下篩選條件：</p>
        <table className={styles.table}>
          <thead>
            <tr><th>篩選條件</th><th>說明</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>檔名</strong></td><td>依檔名關鍵字篩選</td></tr>
            <tr><td><strong>類別篩選</strong></td><td>依類別篩選（任意類別 / 僅選取的 / 排除選取的）</td></tr>
            <tr><td><strong>標籤數量</strong></td><td>依標籤數量篩選（最小 / 最大）</td></tr>
          </tbody>
        </table>
        <p>點擊<strong>清除所有篩選</strong>可清除所有篩選條件。</p>
      </section>

      <section>
        <h3 id="editor-actions">編輯操作</h3>

        <h4>新增標註</h4>
        <ol>
          <li>在右側面板選擇類別</li>
          <li>在圖片上拖曳繪製邊界框（矩形模式）或點擊 4 個點（4 點模式）</li>
          <li>系統會自動將點位排列為順時針順序</li>
        </ol>

        <h4>刪除標註</h4>
        <ul>
          <li>選取標註後按 <code>Delete</code> 鍵</li>
          <li>或點擊右側標註列表中的紅色<strong>刪除</strong>按鈕</li>
          <li>支援多選刪除（框選多個標註後按 <code>Delete</code>）</li>
        </ul>

        <h4>修改類別</h4>
        <ol>
          <li>先點擊標註選中它（邊界框會變粗）</li>
          <li>然後點擊右側<strong>選擇類別</strong>區域中的類別按鈕</li>
          <li>或使用 <code>W/S</code> 鍵快速切換類別</li>
        </ol>

        <h4>調整邊界框</h4>
        <p>選中標註後，拖曳邊界框的<strong>角落</strong>或<strong>邊緣</strong>來調整大小</p>

        <h4>旋轉標註（OBB 模式）</h4>
        <ul>
          <li>選取標註後，使用 <code>Q</code> 鍵逆時針旋轉、<code>E</code> 鍵順時針旋轉</li>
          <li>或拖曳標註上方的旋轉控制點</li>
          <li>支援多選旋轉（框選多個標註後旋轉）</li>
        </ul>

        <h4>移動標註</h4>
        <p>選中標註後，直接拖曳邊界框即可移動位置</p>

        <h4>多選操作</h4>
        <ul>
          <li>按住 <code>Shift</code> 並拖曳滑鼠可框選多個標註</li>
          <li>使用 <code>Ctrl+Click</code> 可逐一加入選取</li>
          <li>使用 <code>Ctrl+Click</code> 點擊已選取的標註可取消選取</li>
          <li>使用 <code>Ctrl+A</code> 全選所有標註</li>
          <li>框選後可同時移動、刪除、旋轉或變更類別</li>
        </ul>
        <img src="/doc-images/09_shiftselect.gif" alt="Shift 框選示範" className={styles.image} />
      </section>

      <section>
        <h3 id="editor-save">儲存變更</h3>
        <p>點擊頂部右側的藍色<strong>儲存標籤</strong>按鈕儲存變更。</p>
        <div className={styles.warning}>
          <strong>注意：</strong>
          <ul>
            <li><code>Ctrl+S</code> 可直接儲存標籤（已攔截瀏覽器預設的「儲存網頁」功能）</li>
            <li>FiftyOne 不會即時自動更新標籤檔，修改後沒有立即反映是正常的</li>
            <li>若啟用「自動同步標籤」，儲存後會自動同步到 FiftyOne</li>
          </ul>
        </div>
      </section>

      <section>
        <h3 id="editor-shortcuts">快速鍵</h3>

        <h4>導航與類別</h4>
        <table className={styles.table}>
          <thead>
            <tr><th>按鍵</th><th>功能</th></tr>
          </thead>
          <tbody>
            <tr><td><code>A</code> 或 <code>←</code></td><td>上一張圖片</td></tr>
            <tr><td><code>D</code> 或 <code>→</code></td><td>下一張圖片</td></tr>
            <tr><td><code>W</code></td><td>切換到上一個類別</td></tr>
            <tr><td><code>S</code></td><td>切換到下一個類別</td></tr>
          </tbody>
        </table>

        <h4>編輯操作</h4>
        <table className={styles.table}>
          <thead>
            <tr><th>按鍵</th><th>功能</th></tr>
          </thead>
          <tbody>
            <tr><td><code>Ctrl+A</code></td><td>全選所有標註</td></tr>
            <tr><td><code>Ctrl+C</code></td><td>複製選取的標註</td></tr>
            <tr><td><code>Ctrl+V</code></td><td>貼上標註</td></tr>
            <tr><td><code>Ctrl+Z</code></td><td>復原</td></tr>
            <tr><td><code>Ctrl+Shift+Z</code></td><td>重做</td></tr>
            <tr><td><code>Ctrl+S</code></td><td>儲存標籤</td></tr>
            <tr><td><code>Ctrl+Click</code></td><td>多選標註</td></tr>
            <tr><td><code>Q</code></td><td>逆時針旋轉選取的標註（5°）</td></tr>
            <tr><td><code>E</code></td><td>順時針旋轉選取的標註（5°）</td></tr>
            <tr><td><code>Delete</code> 或 <code>Backspace</code></td><td>刪除選取的標註</td></tr>
            <tr><td><code>X</code></td><td>選取/取消選取當前圖片</td></tr>
            <tr><td><code>Escape</code></td><td>取消目前操作（繪製、框選）</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3 id="editor-select-delete">選取與刪除圖片</h3>
        <p>標籤編輯器支援從預覽列批次選取並刪除多張圖片。</p>

        <h4>步驟一：進入選取模式</h4>
        <p>點擊預覽列中圖片縮圖上的<strong>勾選框</strong>，或按 <code>X</code> 鍵選取當前圖片。編輯器會自動進入選取模式，顯示操作按鈕（全選、取消全選、刪除所選）。</p>
        <img src="/doc-images/11_select_mode_checkbox.png" alt="勾選框出現在縮圖上" className={styles.image} />

        <h4>步驟二：選取圖片</h4>
        <p>點擊縮圖上的勾選框來選取圖片，選取的圖片會以藍色邊框和勾號標示。使用<strong>全選</strong>選取所有篩選結果中的圖片，或<strong>取消全選</strong>清除選取。<strong>刪除所選 (N)</strong> 按鈕會即時更新選取數量。</p>
        <img src="/doc-images/12_image_selected.png" alt="已選取的圖片" className={styles.image} />

        <h4>步驟三：刪除選取的圖片</h4>
        <p>點擊<strong>刪除所選</strong>按鈕，確認對話框會出現，點擊<strong>確定</strong>確認刪除。圖片檔案及對應的標籤檔案將被永久刪除。</p>
        <img src="/doc-images/13_delete_confirm.png" alt="刪除確認對話框" className={styles.image} />
        <div className={styles.warning}>
          <strong>注意：</strong>刪除圖片無法復原，圖片與標籤檔案將永久從磁碟中移除。
        </div>
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
            <li><a href="#editor-ui">Editor Interface</a></li>
            <li><a href="#editor-filter">Filter Images</a></li>
            <li><a href="#editor-actions">Editing Operations</a></li>
            <li><a href="#editor-save">Save Changes</a></li>
            <li><a href="#editor-shortcuts">Keyboard Shortcuts</a></li>
            <li><a href="#editor-select-delete">Select & Delete Images</a></li>
          </ul>
        </nav>
        <div className={styles.main}>
      <section>
        <h3 id="editor-ui">Editor Interface</h3>
        <img src="/doc-images/09_editor.png" alt="Editor Interface" className={styles.image} />
        <p>The editor consists of the following areas:</p>

        <h4>Top Toolbar</h4>
        <ul>
          <li><strong>← Previous / Next →</strong> - Navigate to previous/next image</li>
          <li><strong>Image Counter</strong> - Shows current image position (e.g., 45 / 479)</li>
          <li><strong>Reload</strong> - Reload current image</li>
          <li><strong>Save Labels</strong> - Save label changes</li>
        </ul>

        <h4>Right Panel</h4>
        <table className={styles.table}>
          <thead>
            <tr><th>Section</th><th>Function</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Filter Images</strong></td><td>Image filtering options (click to expand)</td></tr>
            <tr><td><strong>Image Info</strong></td><td>Shows filename and image dimensions</td></tr>
            <tr><td><strong>OBB Creation Mode</strong></td><td>Shows current OBB creation mode</td></tr>
            <tr><td><strong>Display</strong></td><td>Adjust annotation line width</td></tr>
            <tr><td><strong>Select Class</strong></td><td>Class selection buttons to change annotation class</td></tr>
            <tr><td><strong>Annotations</strong></td><td>Annotation list with class and delete button</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3 id="editor-filter">Filter Images</h3>
        <p>Expand the <strong>Filter Images</strong> panel to use these filters:</p>
        <table className={styles.table}>
          <thead>
            <tr><th>Filter</th><th>Description</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Filename</strong></td><td>Filter by filename keyword</td></tr>
            <tr><td><strong>Class Filter</strong></td><td>Filter by class (Any / Only Selected / Exclude Selected)</td></tr>
            <tr><td><strong>Label Count</strong></td><td>Filter by label count (Min / Max)</td></tr>
          </tbody>
        </table>
        <p>Click <strong>Clear All Filters</strong> to reset all filters.</p>
      </section>

      <section>
        <h3 id="editor-actions">Editing Operations</h3>

        <h4>Add Annotation</h4>
        <ol>
          <li>Select a class from the right panel</li>
          <li>Draw a bounding box by dragging (Rectangle mode) or clicking 4 points (4-Point mode)</li>
          <li>The system will automatically arrange points in clockwise order</li>
        </ol>

        <h4>Delete Annotation</h4>
        <ul>
          <li>Select annotation and press <code>Delete</code> key</li>
          <li>Or click the red <strong>Delete</strong> button in the Annotations list</li>
          <li>Supports multi-select deletion (select multiple then press <code>Delete</code>)</li>
        </ul>

        <h4>Change Class</h4>
        <ol>
          <li>Click an annotation to select it (border becomes thicker)</li>
          <li>Click a class button in the <strong>Select Class</strong> section</li>
          <li>Or use <code>W/S</code> keys to quickly change class</li>
        </ol>

        <h4>Resize Bounding Box</h4>
        <p>After selecting, drag the <strong>corners</strong> or <strong>edges</strong> to resize</p>

        <h4>Rotate Annotation (OBB Mode)</h4>
        <ul>
          <li>Use <code>Q</code> key to rotate counter-clockwise, <code>E</code> key for clockwise</li>
          <li>Or drag the rotation handle above the annotation</li>
          <li>Supports multi-select rotation</li>
        </ul>

        <h4>Move Annotation</h4>
        <p>After selecting, drag the bounding box to move it</p>

        <h4>Multi-Select Operations</h4>
        <ul>
          <li>Hold <code>Shift</code> and drag to box-select multiple annotations</li>
          <li>Use <code>Ctrl+Click</code> to add to selection</li>
          <li>Use <code>Ctrl+Click</code> on selected annotation to deselect</li>
          <li>Use <code>Ctrl+A</code> to select all annotations</li>
          <li>After selection, you can move, delete, rotate, or change class simultaneously</li>
        </ul>
        <img src="/doc-images/09_shiftselect.gif" alt="Shift box-select demo" className={styles.image} />
      </section>

      <section>
        <h3 id="editor-save">Save Changes</h3>
        <p>Click the blue <strong>Save Labels</strong> button in the top-right to save changes.</p>
        <div className={styles.warning}>
          <strong>Note:</strong>
          <ul>
            <li><code>Ctrl+S</code> can directly save labels (browser default save is blocked)</li>
            <li>FiftyOne does not auto-update label files; changes may not reflect immediately</li>
            <li>If "Auto Sync Labels" is enabled, labels sync to FiftyOne automatically after save</li>
          </ul>
        </div>
      </section>

      <section>
        <h3 id="editor-shortcuts">Keyboard Shortcuts</h3>

        <h4>Navigation & Class</h4>
        <table className={styles.table}>
          <thead>
            <tr><th>Key</th><th>Function</th></tr>
          </thead>
          <tbody>
            <tr><td><code>A</code> or <code>←</code></td><td>Previous image</td></tr>
            <tr><td><code>D</code> or <code>→</code></td><td>Next image</td></tr>
            <tr><td><code>W</code></td><td>Switch to previous class</td></tr>
            <tr><td><code>S</code></td><td>Switch to next class</td></tr>
          </tbody>
        </table>

        <h4>Editing</h4>
        <table className={styles.table}>
          <thead>
            <tr><th>Key</th><th>Function</th></tr>
          </thead>
          <tbody>
            <tr><td><code>Ctrl+A</code></td><td>Select all annotations</td></tr>
            <tr><td><code>Ctrl+C</code></td><td>Copy selected annotations</td></tr>
            <tr><td><code>Ctrl+V</code></td><td>Paste annotations</td></tr>
            <tr><td><code>Ctrl+Z</code></td><td>Undo</td></tr>
            <tr><td><code>Ctrl+Shift+Z</code></td><td>Redo</td></tr>
            <tr><td><code>Ctrl+S</code></td><td>Save labels</td></tr>
            <tr><td><code>Ctrl+Click</code></td><td>Multi-select annotations</td></tr>
            <tr><td><code>Q</code></td><td>Rotate selected counter-clockwise (5°)</td></tr>
            <tr><td><code>E</code></td><td>Rotate selected clockwise (5°)</td></tr>
            <tr><td><code>Delete</code> or <code>Backspace</code></td><td>Delete selected annotations</td></tr>
            <tr><td><code>X</code></td><td>Toggle select/deselect current image</td></tr>
            <tr><td><code>Escape</code></td><td>Cancel current operation (drawing, box-selecting)</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h3 id="editor-select-delete">Select & Delete Images</h3>
        <p>The label editor supports selecting multiple images for batch deletion from the preview bar.</p>

        <h4>Step 1: Enter Select Mode</h4>
        <p>Click the <strong>checkbox</strong> on any image thumbnail in the preview bar, or press <code>X</code> to toggle the current image. The editor enters select mode and shows action buttons (Select All, Deselect All, Delete Selected).</p>
        <img src="/doc-images/11_select_mode_checkbox.png" alt="Checkbox on thumbnail" className={styles.image} />

        <h4>Step 2: Select Images</h4>
        <p>Click checkboxes on thumbnails to select images. Selected images show a blue border and checkmark. Use <strong>Select All</strong> to select all images in the current filtered view, or <strong>Deselect All</strong> to clear. The <strong>Delete Selected (N)</strong> button updates with the count.</p>
        <img src="/doc-images/12_image_selected.png" alt="Selected images with checkmarks" className={styles.image} />

        <h4>Step 3: Delete Selected Images</h4>
        <p>Click <strong>Delete Selected</strong> to remove the selected images. A confirmation dialog appears — click <strong>OK</strong> to confirm. Both image files and their corresponding label files are permanently deleted.</p>
        <img src="/doc-images/13_delete_confirm.png" alt="Delete confirmation dialog" className={styles.image} />
        <div className={styles.warning}>
          <strong>Warning:</strong> Deleting images cannot be undone. Image and label files are permanently removed from disk.
        </div>
      </section>
        </div>
      </div>
    </div>
  );
}

export default function EditorHelpModal({ isOpen, onClose }) {
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
          <h2>{t('help.editorTitle')}</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        {isZhTW ? <ChineseContent /> : <EnglishContent />}
      </div>
    </div>
  );
}
