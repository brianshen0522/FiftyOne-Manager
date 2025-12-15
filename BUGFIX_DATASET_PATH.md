# Bug Fix: Dataset Path Truncation on Instance Edit

## Problem Description

When editing an existing instance in the FiftyOne Manager UI without changing the dataset directory, the dataset path would be truncated on save.

### Example of the Bug:
1. Instance has path: `/home/studio/remote_label_data/dataset/dice/1106`
2. User clicks "Edit" on the instance
3. User doesn't change anything, just clicks "Save"
4. Path becomes: `/home/studio/remote_label_data/dataset/dice/`
5. Clicking save again: `/home/studio/remote_label_data/dataset/`
6. Path keeps getting truncated with each save

## Root Cause

The issue was in the `navigateToPath()` function in `index.html`:

### Original Problematic Code Flow:

1. When editing an instance, the code calls `editInstance(name)`
2. This function navigates to the parent folder to show the dataset browser:
   ```javascript
   const parentPath = parts.slice(0, -1).join('/');
   navigateToPath(parentPath);  // <-- Problem here!
   ```

3. The `navigateToPath()` function ALWAYS updated the dataset path input field:
   ```javascript
   function navigateToPath(path) {
       // ...
       document.getElementById('datasetPath').value = fullPath;  // <-- Overwrites!
       // ...
   }
   ```

4. So even though the instance had the full path initially, the navigation to the parent folder would overwrite it with the truncated path

## Solution

Modified `navigateToPath()` to accept an optional parameter that controls whether to update the path field:

```javascript
function navigateToPath(path, updatePathField = true) {
    currentPath = path;
    renderBreadcrumb(path);
    renderFolderList(path);

    // Auto-update dataset path only if requested (skip when editing existing instance)
    if (updatePathField) {
        const basePath = config.datasetBasePath || '/data/datasets';
        const fullPath = path ? `${basePath}/${path}` : basePath;
        document.getElementById('datasetPath').value = fullPath;
    }

    // Load class files for this path
    loadClassFiles(fullPath || config.datasetBasePath);
}
```

And updated the edit instance code to pass `false`:

```javascript
// Navigate to parent folder for browsing, but don't update the path field
navigateToPath(parentPath, false);
```

## Changes Made

**File**: `public/index.html`

### Change 1: Updated `navigateToPath()` function (line ~934)
- Added `updatePathField = true` parameter
- Wrapped path field update in conditional: `if (updatePathField)`
- Fixed class file loading to handle cases where fullPath is undefined

### Change 2: Updated edit instance navigation (line ~1529)
- Changed from `navigateToPath(parentPath)` to `navigateToPath(parentPath, false)`
- Added handling for root-level datasets
- Added handling for datasets not found in tree

## Testing

### Before Fix:
1. Edit instance with path `/home/studio/remote_label_data/dataset/dice/1106`
2. Don't change anything
3. Click Save
4. Path becomes `/home/studio/remote_label_data/dataset/dice/` ❌

### After Fix:
1. Edit instance with path `/home/studio/remote_label_data/dataset/dice/1106`
2. Don't change anything
3. Click Save
4. Path remains `/home/studio/remote_label_data/dataset/dice/1106` ✓

## Behavior Preserved

- ✓ When creating a NEW instance, clicking folders updates the path field (normal behavior)
- ✓ When editing an EXISTING instance, the path field is NOT updated by folder navigation
- ✓ Users can still manually edit the path field text input
- ✓ Users can still click folders to browse and select a different path
- ✓ When clicking a folder, the path field WILL update (expected behavior when making a change)

## Impact

This fix ensures that:
1. Instance configurations are preserved when editing
2. Users don't accidentally change the dataset path
3. The dataset browser still works correctly for selecting new paths
4. No data is lost due to inadvertent path truncation

## Files Modified

- `public/index.html` - Frontend UI logic

## Deployment

This fix is included in the Docker image. To apply:

```bash
docker compose -f docker-compose.dev.yml up -d --build
# or for production
docker compose up -d --build
```

No database migrations or backend changes required.
