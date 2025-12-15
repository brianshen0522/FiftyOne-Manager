# Debugging Empty Port List Issue

## How to Debug

1. **Open the FiftyOne Manager** in your browser:
   ```
   http://localhost:5000
   ```

2. **Open Browser Developer Console**:
   - Chrome/Edge: Press `F12` or `Ctrl+Shift+I`
   - Firefox: Press `F12` or `Ctrl+Shift+K`
   - Safari: `Cmd+Option+I`

3. **Click "Add Instance" button**

4. **Check Console Output**

You should see logs like this:

### Expected Console Output (if working):
```
showAddModal: Starting...
showAddModal: Config loaded {datasetBasePath: "...", portRange: {start: 5151, end: 5159}, ...}
showAddModal: Loading instances...
showAddModal: Instances loaded []
showAddModal: Populating port options...
Populating port options: {portRange: {start: 5151, end: 5159}, usedPorts: [], latestInstances: 0}
Generated ports: [{value: 5151, label: "5151 (available)", ...}, ...]
showAddModal: Default port selected: 5151
showAddModal: Complete
```

### Problem Scenarios:

#### Scenario 1: Config Not Loaded
```
showAddModal: Starting...
Config port range not loaded {datasetBasePath: undefined, ...}
```
**Solution**: Check if `/api/config` endpoint is working
```bash
curl http://localhost:5000/api/config
```

#### Scenario 2: Port Select Element Not Found
```
Port select element not found
```
**Solution**: Modal HTML might not be loaded correctly, check page source

#### Scenario 3: Ports Generated But Not Rendered
```
Generated ports: [{value: 5151, ...}, ...]
# But dropdown is still empty
```
**Solution**: Check `renderPortOptions()` function

## Manual API Tests

### Test 1: Check Config API
```bash
curl -s http://localhost:5000/api/config | python3 -m json.tool | grep -A 3 portRange
```

Expected:
```json
"portRange": {
    "start": 5151,
    "end": 5159
}
```

### Test 2: Check Instances API
```bash
curl -s http://localhost:5000/api/instances
```

Expected:
```json
[]
```
(or array of instances if you have any)

## Common Issues

### Issue: Port dropdown shows "Loading ports..."
This means `renderPortOptions()` was never called or the ports array was empty.

**Check**:
1. Is config loaded? Look for "Config loaded" in console
2. Are ports generated? Look for "Generated ports:" in console
3. Check browser console for any JavaScript errors

### Issue: Console shows errors
Common errors:
- `Cannot read property 'start' of undefined` - config.portRange not loaded
- `Cannot read property 'map' of undefined` - latestInstances is undefined
- `getElementById('instancePort') is null` - Modal HTML not loaded

## Quick Fix Test

If you want to test without the browser, you can run this in the browser console after opening the page:

```javascript
// Test if config is loaded
console.log('Config:', config);
console.log('Port Range:', config.portRange);

// Test if instances are loaded
console.log('Latest Instances:', latestInstances);

// Test port population manually
populatePortOptions();

// Check what's in the dropdown
const portSelect = document.getElementById('instancePort');
console.log('Port options:', portSelect ? portSelect.innerHTML : 'Element not found');
```

## Files to Check

If the console logs don't appear, the new code might not be deployed:

1. **Clear browser cache**: `Ctrl+F5` or `Cmd+Shift+R`
2. **Check container is using new code**:
   ```bash
   docker compose -f docker-compose.dev.yml exec fiftyone-manager-dev \
     grep -n "console.log('showAddModal:" /app/public/index.html | head -5
   ```
   Should show line numbers with the new console.log statements

3. **Verify container rebuild**:
   ```bash
   docker compose -f docker-compose.dev.yml ps
   ```
   Check "Created" timestamp is recent

## Report Back

Please share:
1. Full console output when clicking "Add Instance"
2. Any red error messages in console
3. Output of the manual API tests above
4. Screenshot of the empty dropdown if possible

This will help identify exactly where the issue is.
