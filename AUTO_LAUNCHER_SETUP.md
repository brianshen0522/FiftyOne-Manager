# Automatic Label Editor Launcher - Setup Guide

This guide shows you how to set up fully automatic label editor opening from FiftyOne.

## How It Works

1. Keep the **Auto Launcher** page open in a browser tab
2. In FiftyOne, select an image and run the operator
3. **A browser bookmarklet** reads the operator result and sends it to the Auto Launcher
4. The Auto Launcher **automatically opens** the label editor with the correct IP address!

## Setup (One-Time)

### Step 1: Open the Auto Launcher

Open this page in a new browser tab and **keep it open**:

```
http://<your-ip>:3000/auto-launcher.html
```

Replace `<your-ip>` with the IP address you use to access FiftyOne (e.g., `192.168.1.100` or `localhost`).

**Bookmark this page** for easy access!

### Step 2: Install the Bookmarklet

Create a new bookmark in your browser with this JavaScript code as the URL:

#### Chrome / Edge / Brave:
1. Right-click the bookmarks bar
2. Click "Add page..." or "Add bookmark"
3. Name it: `Send to Label Editor`
4. Paste this code in the URL field:

```javascript
javascript:(function(){const result=window.foyCurrentOperatorResult||{};if(result.image_path){localStorage.setItem('fiftyone_edit_label_request',JSON.stringify({image_path:result.image_path,label_path:result.label_path,manager_port:result.manager_port||'3000',filename:result.filename,timestamp:Date.now()}));alert('✓ Sent to Auto Launcher!');}else{const imagePath=prompt('Enter image path:');if(imagePath){const labelPath=imagePath.replace('/images/','/labels/').replace(/\.(jpg|jpeg|png)$/,'.txt');localStorage.setItem('fiftyone_edit_label_request',JSON.stringify({image_path:imagePath,label_path:labelPath,manager_port:'3000',filename:imagePath.split('/').pop(),timestamp:Date.now()}));alert('✓ Sent to Auto Launcher!');}}})();
```

#### Firefox:
1. Right-click the bookmarks toolbar
2. Click "New Bookmark..."
3. Name it: `Send to Label Editor`
4. Paste the code above in the "Location" field

## Usage

### Option A: Using the Bookmarklet (Recommended)

1. **Open Auto Launcher** tab (keep it open)
2. In **FiftyOne**, select an image
3. Run **Edit Label in Tool** operator (press backtick `)
4. **Click the bookmarklet** you created ("Send to Label Editor")
5. The **label editor opens automatically**!

### Option B: Manual Entry (Fallback)

If the bookmarklet doesn't work:

1. Run the operator in FiftyOne
2. Copy the **image_path** from the operator result
3. Click the **Test Open Editor** button in the Auto Launcher tab
4. Or manually paste into the `edit-launcher.html` page

## Workflow

### Quick 3-Click Workflow:

```
1. Select image in FiftyOne
2. Press backtick (`) → Run "Edit Label in Tool"
3. Click bookmarklet → Label editor opens automatically!
```

## Troubleshooting

### Bookmarklet doesn't work
- Make sure you copied the entire JavaScript code (it starts with `javascript:`)
- Some browsers don't allow `javascript:` URLs - use the manual method instead
- Check browser console (F12) for error messages

### Label editor doesn't open automatically
- Make sure the **Auto Launcher tab is open**
- Check if popups are blocked (allow popups for your FiftyOne domain)
- Look at the Auto Launcher log for error messages

### Wrong IP address
- The Auto Launcher uses the IP you accessed it with
- Make sure you opened both FiftyOne AND Auto Launcher with the same IP/hostname

## Advanced: Browser Extension

For the most seamless experience, you can create a simple browser extension that automatically intercepts FiftyOne operator results. See `BROWSER_EXTENSION_GUIDE.md` (coming soon).

## How It All Works

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│  FiftyOne   │  ─────> │  Bookmarklet │  ─────> │ Auto Launcher│
│   Operator  │  Result │   (Bridge)   │ Storage │   (Monitor)  │
└─────────────┘         └──────────────┘         └──────────────┘
                                                         │
                                                         ▼
                                                  ┌──────────────┐
                                                  │ Label Editor │
                                                  │ (Auto-Opens) │
                                                  └──────────────┘
```

1. **FiftyOne Operator** returns image/label paths
2. **Bookmarklet** (clicked by you) reads the result and stores it in localStorage
3. **Auto Launcher** (monitoring localStorage) detects the change
4. **Label Editor** opens automatically in a new tab with the correct IP!

## Why This Approach?

- ✅ **Works with any IP** - Uses your current browser hostname
- ✅ **No copy/paste** - Just click the bookmarklet
- ✅ **Cross-tab communication** - Uses localStorage
- ✅ **No server changes** - All client-side
- ✅ **No permissions needed** - No browser extension installation required

## Alternative Methods

If you don't want to use the bookmarklet:

1. **Quick Edit Helper**: `http://<your-ip>:3000/quick-edit.html` - Copy/paste image paths
2. **Edit Launcher**: `http://<your-ip>:3000/edit-launcher.html` - Paste operator URLs
3. **Manual URL**: Construct URL manually from operator results

Choose the method that works best for you!
