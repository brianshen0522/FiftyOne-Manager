# Quick Start: Label Editor

## Setup (One-Time)

1. **Edit `.env` file** and set your public IP address:
   ```bash
   PUBLIC_ADDRESS=192.168.20.178  # Your actual IP/hostname
   MANAGER_PORT=5050              # Your manager port
   ```

2. **Restart your FiftyOne instance** to load the updated configuration

That's it! ✅

## Usage

1. In FiftyOne, **select an image**
2. Press **backtick (`)** → Run **"Edit Label in Tool"**
3. **Copy the "Label Editor URL"** from the operator result
4. **Paste it in your browser**
5. **Edit labels** → **Save**
6. **Refresh FiftyOne** to see changes

## What Changed

- ✅ Uses **MANAGER_PORT** from `.env` (not hardcoded 3000)
- ✅ Uses **PUBLIC_ADDRESS** from `.env` (your actual IP)
- ✅ Auto-opens the label editor (no manual URL construction needed)

## Example Workflow

```
1. Select image in FiftyOne
2. Press ` → "Edit Label in Tool"
3. Copy: http://192.168.20.178:5050/label-editor.html?image=...&label=...
4. Paste in browser
5. Edit labels → Save
6. Refresh FiftyOne to see changes
```

## Troubleshooting

**Wrong IP in URL?**
- Update `PUBLIC_ADDRESS` in `.env`
- Restart FiftyOne instance

**Port mismatch?**
- Update `MANAGER_PORT` in `.env`
- Restart FiftyOne instance

**Popup blocked?**
- The auto-open page will show a manual link
- Click the link to open the editor

## Alternative: Quick Edit Helper

For easier access, you can also use:
```
http://192.168.20.178:5050/quick-edit.html
```

Paste the image path from FiftyOne and it auto-generates the label path.

## Files

- `/public/label-editor.html` - The label editing interface
- `/public/quick-edit.html` - Helper page for easier URL generation
- `/fiftyone_plugins/edit_label/__init__.py` - FiftyOne operator plugin

## Environment Variables Used

| Variable | Example | Description |
|----------|---------|-------------|
| `PUBLIC_ADDRESS` | `192.168.20.178` | IP/hostname for accessing the system |
| `MANAGER_PORT` | `5050` | Port where the manager runs |

Both are set in `.env` and automatically used by the plugin!
