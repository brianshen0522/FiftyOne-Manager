"use client";

import { useEffect, useRef } from 'react';
import './manager.css';

export default function Page() {
  const apiRef = useRef(null);

  useEffect(() => {
    let active = true;
    import('@/lib/manager-ui').then((mod) => {
      if (!active) return;
      apiRef.current = mod;
      if (mod.initManager) {
        mod.initManager();
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const callApi = (method, ...args) => {
    const api = apiRef.current;
    if (!api || typeof api[method] !== 'function') {
      return;
    }
    api[method](...args);
  };

  return (
    <>
      <div className="page">
        <header className="top-bar">
          <div className="title-wrap">
            <div className="title">
              <span>FiftyOne</span> Manager
            </div>
            <div className="subtitle">Status refresh every 5s</div>
          </div>
          <div className="top-actions">
            <button
              id="startSelectedBtn"
              className="btn success"
              onClick={() => callApi('startSelectedInstances')}
              disabled
            >
              Start Selected
            </button>
            <button
              id="stopSelectedBtn"
              className="btn danger"
              onClick={() => callApi('stopSelectedInstances')}
              disabled
            >
              Stop Selected
            </button>
            <button
              id="removeSelectedBtn"
              className="btn danger"
              onClick={() => callApi('removeSelectedInstances')}
              disabled
            >
              Remove Selected
            </button>
            <button className="btn secondary" onClick={() => callApi('openLabelEditorMain')}>
              Label Editor
            </button>
            <button className="btn ghost" onClick={() => callApi('showAddModal')}>
              Add Instance
            </button>
          </div>
        </header>

        <section className="section">
          <div className="section-title">
            <input
              type="checkbox"
              id="selectAllCheckbox"
              className="instance-select-checkbox"
              onChange={() => callApi('toggleSelectAll')}
              style={{ marginRight: '8px' }}
            />
            Instances
            <small>
              Base path: <span id="basePath">-</span> · Ports:{' '}
              <span id="portRange">-</span>
            </small>
          </div>
          <div id="instancesContainer" className="instances">
            <div className="empty-state">
              <h2>No instances yet</h2>
              <p>Click &quot;Add Instance&quot; to create your first FiftyOne instance</p>
            </div>
          </div>
        </section>
      </div>

      <div id="instanceModal" className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2 id="modalTitle">Add New Instance</h2>
            <button className="close-btn" onClick={() => callApi('closeModal')} type="button">
              &times;
            </button>
          </div>
          <div id="modalError" className="error-message" style={{ display: 'none' }} />
          <form id="instanceForm" onSubmit={(event) => callApi('saveInstance', event)}>
            <div className="form-group">
              <label htmlFor="instanceName">Instance Name *</label>
              <input type="text" id="instanceName" required />
              <small>Unique identifier for this instance</small>
              <div
                id="instanceNameError"
                className="error-message"
                style={{ display: 'none', marginTop: '8px' }}
              >
                Instance name already exists.
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="selectedPortDisplay">Selected Port *</label>
              <input
                type="text"
                id="selectedPortDisplay"
                readOnly
                placeholder="Select a port below..."
                style={{ marginBottom: '8px' }}
              />
              <label htmlFor="instancePort" style={{ fontSize: '13px', color: 'var(--subtle)' }}>
                Available Ports
              </label>
              <select id="instancePort" size={5} required onChange={() => callApi('updateSelectedPortDisplay')}>
                <option value="">Loading ports...</option>
              </select>
              <small className="port-hint" id="portHint">
                Select an available port from the list.
              </small>
            </div>
            <div className="form-group">
              <label htmlFor="datasetPath">Dataset Path *</label>
              <div className="dataset-browser">
                <div className="breadcrumb" id="breadcrumb" />
                <div className="folder-list" id="folderList">
                  <div className="folder-item">Loading...</div>
                </div>
              </div>
              <input type="text" id="datasetPath" required placeholder="Selected path will appear here" />
              <small>Browse folders above or enter path manually</small>
            </div>
            <div className="form-group">
              <label htmlFor="classFile">Class Names File (Optional)</label>
              <div className="dataset-browser">
                <div className="breadcrumb" id="classBreadcrumb" />
                <div className="folder-list" id="classFolderList">
                  <div className="folder-item">Loading...</div>
                </div>
              </div>
              <input type="text" id="classFile" placeholder="Or enter path manually" />
              <small>Browse for .txt file containing &quot;class&quot; in filename (one class name per line)</small>
              <div id="classPreview" className="class-preview">
                <div className="class-preview-header">
                  <span>Preview</span>
                  <span id="classPreviewMeta" className="class-preview-badge">
                    0 lines
                  </span>
                </div>
                <div id="classPreviewBody" className="class-preview-body">
                  Select a class file to preview
                </div>
                <div id="classPreviewNote" className="class-preview-note" style={{ display: 'none' }} />
                <div id="classPreviewError" className="class-preview-error" style={{ display: 'none' }} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="threshold">Duplicate Threshold</label>
              <input type="number" id="threshold" step="0.01" min="0" max="1" />
              <small>Similarity threshold (0.0 - 1.0) for duplicate detection</small>
            </div>
            <div className="form-group">
              <div className="checkbox-group">
                <input type="checkbox" id="debugMode" />
                <label htmlFor="debugMode">Debug Mode</label>
              </div>
              <small>Group duplicates into separate folders</small>
            </div>
            <div className="form-group" id="cvatSyncGroup">
              <div className="checkbox-group">
                <input type="checkbox" id="cvatSync" />
                <label htmlFor="cvatSync">CVAT Sync</label>
              </div>
              <small>Enable synchronization with CVAT annotation backend</small>
            </div>
            <div className="form-group">
              <div className="checkbox-group">
                <input type="checkbox" id="autoSync" />
                <label htmlFor="autoSync">Auto Sync Labels</label>
              </div>
              <small>Sync labels into FiftyOne on every save from the label editor</small>
            </div>
            <div className="form-group">
              <div className="checkbox-group">
                <input type="checkbox" id="pentagonFormat" />
                <label htmlFor="pentagonFormat">OBB Format (Polygon)</label>
              </div>
              <small>
                Convert YOLO bounding boxes to OBB format (4 points, clockwise from top-left)
              </small>
            </div>
            <div className="form-group" id="obbModeGroup" style={{ display: 'none' }}>
              <label htmlFor="obbMode">OBB Creation Mode</label>
              <select id="obbMode">
                <option value="rectangle">Rectangle (Drag)</option>
                <option value="4point">4-Point Polygon</option>
              </select>
              <small>
                How users create OBB annotations: drag for rectangle or click 4 points for polygon
              </small>
            </div>
            <div className="form-group">
              <button type="submit" id="saveInstanceBtn" className="btn success" style={{ width: '100%' }}>
                Save Instance
              </button>
            </div>
          </form>
        </div>
      </div>

      <div id="logsModal" className="modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2 id="logsTitle">Instance Logs</h2>
            <button className="close-btn" onClick={() => callApi('closeLogsModal')} type="button">
              &times;
            </button>
          </div>
          <div className="logs-wrapper">
            <div className="logs-container" id="logsContent">
              Loading logs...
            </div>
            <button
              id="scrollLatestBtn"
              className="scroll-latest-btn"
              onClick={() => callApi('scrollToLatest')}
              type="button"
            >
              Scroll to latest
            </button>
          </div>
        </div>
      </div>

      <div id="processingOverlay" className="processing-overlay" role="alert" aria-live="assertive">
        <div className="processing-card">
          <div className="spinner" aria-hidden="true" />
          <div id="processingText" className="processing-text">
            Processing...
          </div>
        </div>
      </div>
    </>
  );
}
