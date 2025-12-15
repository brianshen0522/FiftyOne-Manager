# Bug Fix: Empty Port List in Instance Modal

## Problem Description

When opening the "Add Instance" or "Edit Instance" modal, the "Selected Port" dropdown list was empty, preventing users from selecting a port for the instance.

### Symptoms:
- Click "Add Instance" button
- Modal opens but port list shows "Loading ports..."
- No ports appear in the dropdown
- Cannot create or edit instances

## Root Cause

The `populatePortOptions()` function depends on the `latestInstances` array to determine which ports are already in use. However, when the modal was opened, this function was called BEFORE the instances were loaded from the API.

### Original Flow (BROKEN):
```javascript
async function showAddModal() {
    await loadConfig();  // Loads config
    // ... setup modal ...
    populatePortOptions();  // ❌ Uses latestInstances which may be empty!
}
```

The problem was:
1. Page loads and starts background refresh of instances
2. User clicks "Add Instance" quickly before instances are loaded
3. `latestInstances` is still `[]` (empty array)
4. `populatePortOptions()` runs but has no data
5. Port list remains empty

## Solution

Modified both `showAddModal()` and `editInstance()` to explicitly load instances before populating the port list.

### New Flow (FIXED):
```javascript
async function showAddModal() {
    await loadConfig();      // Loads config
    await loadInstances();   // ✓ Ensures instances are loaded first
    // ... setup modal ...
    populatePortOptions();   // ✓ Now has data to work with
}
```

This ensures:
1. Latest instance data is always fetched when opening modal
2. Port availability is calculated with current data
3. Port list is properly populated
4. Used ports are marked as unavailable

## Changes Made

**File**: `public/index.html`

### Change 1: Updated `showAddModal()` function
Added:
```javascript
// Ensure instances are loaded for port availability check
// Always refresh to get latest state
await loadInstances();
```

### Change 2: Updated `editInstance()` function
Added:
```javascript
// Ensure instances are loaded
await loadInstances();
```

Both changes ensure that the `latestInstances` array is populated before `populatePortOptions()` is called.

## Testing

### Test Case 1: Add New Instance
1. Open browser, navigate to FiftyOne Manager
2. Click "Add Instance" button immediately
3. **Expected**: Port list shows all available ports (5151-5159)
4. **Before fix**: Port list was empty
5. **After fix**: Port list populated correctly ✓

### Test Case 2: Edit Existing Instance
1. Create an instance on port 5151
2. Click "Edit" on that instance
3. **Expected**: Port list shows 5151 as selected, others available
4. **Before fix**: Port list was empty
5. **After fix**: Port list populated correctly ✓

### Test Case 3: Port Availability
1. Create instance on port 5151
2. Click "Add Instance" to create another
3. **Expected**: Port 5151 marked as used/disabled, others available
4. **After fix**: Correctly shows 5151 as unavailable ✓

## Verification Commands

Check available ports via API:
```bash
curl -s http://localhost:5000/api/config | python3 -m json.tool | grep -A 3 portRange
```

Expected output:
```json
"portRange": {
    "start": 5151,
    "end": 5159
}
```

Check current instances:
```bash
curl -s http://localhost:5000/api/instances | python3 -m json.tool
```

## Impact

This fix ensures:
- ✓ Port list always displays correctly
- ✓ Users can create and edit instances without issues
- ✓ Port availability is accurate and up-to-date
- ✓ No race conditions between data loading and UI rendering

## Files Modified

- `public/index.html` - Added `await loadInstances()` calls

## Deployment

This fix is included in the Docker image. To apply:

```bash
docker compose -f docker-compose.dev.yml up -d --build
# or for production
docker compose up -d --build
```

No backend changes required.
