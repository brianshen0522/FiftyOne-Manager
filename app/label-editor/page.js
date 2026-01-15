"use client";

import { useEffect, useRef } from 'react';
import './label-editor.css';

export default function LabelEditorPage() {
  const apiRef = useRef(null);

  useEffect(() => {
    let active = true;
    import('@/lib/label-editor-ui').then((mod) => {
      if (!active) return;
      apiRef.current = mod;
      if (mod.initLabelEditor) {
        mod.initLabelEditor();
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
      <div className="header">
        <h1>YOLO Label Editor</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" id="prevBtn" onClick={() => callApi('previousImage')}>
            ← Previous
          </button>
          <span id="imageCounter" style={{ margin: '0 15px', color: '#aaa' }} />
          <button className="btn btn-secondary" id="nextBtn" onClick={() => callApi('nextImage')}>
            Next →
          </button>
          <button className="btn btn-secondary" onClick={() => callApi('loadImage')}>
            Reload
          </button>
          <button className="btn btn-primary" onClick={() => callApi('saveLabels')}>
            Save Labels
          </button>
        </div>
      </div>

      <div className="main-container">
        <div className="canvas-container" id="canvasContainer">
          <div className="loading" id="loading">
            Loading...
          </div>
          <div
            className="error-message"
            id="errorMessage"
            style={{ display: 'none', color: '#dc3545', padding: '20px', textAlign: 'center' }}
          />
          <canvas id="canvas" />
        </div>

        <div className="sidebar">
          <div className="sidebar-section filter-section">
            <div className="filter-toggle" onClick={() => callApi('toggleFilterSection')}>
              <h2>Filter Images</h2>
              <span id="filterToggleIcon">▶</span>
            </div>
            <div className="filter-content collapsed" id="filterContent">
              <div className="filter-group">
                <label className="filter-label">Image Name</label>
                <input
                  type="text"
                  className="filter-input"
                  id="filterName"
                  placeholder="Search by filename..."
                  autoComplete="off"
                  inputMode="text"
                  onInput={() => callApi('applyFiltersDebounced')}
                />
              </div>

              <div className="filter-group">
                <label className="filter-label">Has Classes</label>
                <div className="filter-range">
                  <select id="filterClassMode" onChange={() => callApi('applyFilters')}>
                    <option value="any">Any</option>
                    <option value="none">None (no labels)</option>
                    <option value="only">Only Selected</option>
                  </select>
                  <select id="filterClassLogic" onChange={() => callApi('applyFilters')}>
                    <option value="any">Match Any</option>
                    <option value="all">Match All</option>
                  </select>
                </div>
                <div className="filter-class-search">
                  <input
                    type="text"
                    id="filterClassSearch"
                    placeholder="Search classes..."
                    autoComplete="off"
                    inputMode="text"
                  />
                </div>
                <div className="filter-class-chips" id="filterClassChips" />
                <div className="filter-checkboxes" id="filterClasses" />
              </div>

              <div className="filter-group">
                <label className="filter-label">Label Count</label>
                <div className="filter-range">
                  <input
                    type="number"
                    id="filterMinLabels"
                    placeholder="Min"
                    min="0"
                    defaultValue="0"
                    onChange={() => callApi('applyFilters')}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    id="filterMaxLabels"
                    placeholder="Max"
                    min="0"
                    defaultValue=""
                    onChange={() => callApi('applyFilters')}
                  />
                </div>
              </div>

              <button className="btn-clear-filter" onClick={() => callApi('clearFilters')}>
                Clear All Filters
              </button>

              <div className="filter-stats" id="filterStats">
                Showing all images
              </div>
              <div className="filter-warning" id="filterWarning" style={{ display: 'none' }}>
                Label count min cannot be greater than max
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h2>Image Info</h2>
            <div className="info-field">
              <div className="info-label">Filename</div>
              <div className="info-value" id="filename">
                -
              </div>
            </div>
            <div className="info-field">
              <div className="info-label">Image Size</div>
              <div className="info-value" id="imageSize">
                -
              </div>
            </div>
          </div>

          <div className="sidebar-section" id="obbModeSection" style={{ display: 'none' }}>
            <h2>OBB Creation Mode</h2>
            <div className="info-field">
              <div className="info-value" id="obbModeDisplay" style={{ color: '#4ECDC4', fontWeight: 500 }}>
                -
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h2>Display</h2>
            <div className="line-width-control">
              <label className="filter-label" htmlFor="lineWidthScale">
                Line Width <span id="lineWidthScaleValue">66%</span>
              </label>
              <input
                type="range"
                id="lineWidthScale"
                min="0.3"
                max="1.5"
                step="0.05"
                defaultValue="0.66"
                onInput={(event) => callApi('setLineWidthScale', event.target.value)}
              />
            </div>
          </div>

          <div className="sidebar-section">
            <h2>
              Select Class <span style={{ fontSize: '12px', color: '#aaa' }}>(Click to change selected)</span>
            </h2>
            <div className="class-selector" id="classSelector" />
          </div>

          <div className="sidebar-section">
            <h2>
              Annotations (<span id="annotationCount">0</span>)
            </h2>
            <div className="annotations-list" id="annotationsList" />
          </div>

          <div className="sidebar-section">
            <h2>Instructions</h2>
            <div className="instructions">
              <ul />
            </div>
          </div>
        </div>
      </div>

      <div className="preview-bar" id="previewBar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
          <div style={{ color: '#aaa', fontSize: '12px' }} id="imagePreviewCount">
            Images
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select id="previewSort" className="preview-sort-select" onChange={() => callApi('handlePreviewSortChange')}>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="created-desc">Created (newest)</option>
              <option value="created-asc">Created (oldest)</option>
            </select>
            <input
              type="text"
              id="previewSearch"
              className="preview-search-input"
              placeholder="Search filename..."
              onInput={() => callApi('handlePreviewSearch')}
            />
          </div>
        </div>
        <div className="preview-progress">
          <div className="preview-progress-fill" id="previewProgressFill" />
        </div>
        <div className="image-preview" id="imagePreview" />
      </div>

      <div className="status-bar" id="statusBar">
        Ready
      </div>
    </>
  );
}
