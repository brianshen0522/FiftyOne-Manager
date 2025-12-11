# Label Editor Integration Guide

This guide explains how to use the integrated label editor to fix mistakes found in FiftyOne.

## Overview

When you find label mistakes in FiftyOne, you can now click a button to open that image in a web-based label editor where you can:
- Create new labels
- Delete labels
- Change label classes (reclass)
- Edit bounding boxes (resize, reposition)

## How It Works

### Architecture

```
FiftyOne UI → Plugin Button → Opens Label Editor → Edits YOLO .txt files
```

1. You view images in FiftyOne and identify mistakes
2. Select the image with the mistake
3. Click the "Edit Label in Tool" button from the operator menu
4. The label editor opens in a new tab with that specific image
5. Make your edits and save
6. Refresh FiftyOne to see the changes

### Components

1. **Label Editor** (`public/label-editor.html`)
   - Web-based YOLO annotation tool
   - Displays images with bounding boxes
   - Interactive editing interface

2. **API Endpoints** (`server.js`)
   - `/api/label-editor/load` - Loads image and label data
   - `/api/label-editor/save` - Saves edited labels

3. **FiftyOne Plugin** (`fiftyone_plugins/edit_label/`)
   - Adds "Edit Label in Tool" operator
   - Passes image and label paths to the editor

## Using the Label Editor

### Step 1: Find Mistakes in FiftyOne

1. Start a FiftyOne instance through the manager
2. Browse your dataset and identify images with label mistakes
3. Select the image you want to edit

### Step 2: Open the Label Editor

1. In FiftyOne, press the backtick key `` ` `` or click the operator icon
2. Search for "Edit Label in Tool"
3. Click the operator
4. The label editor opens in a new browser tab

### Step 3: Edit Labels

#### Interface Overview

- **Canvas (center)**: Displays the image with bounding boxes
- **Class Selector**: Choose which class to use for new boxes
- **Annotations List**: See all current annotations
- **Instructions**: Quick reference guide

#### Creating Labels

1. Select a class from the class selector
2. Click and drag on the image to draw a bounding box
3. Release to create the annotation

#### Deleting Labels

Method 1: Click the annotation in the list, then press Delete/Backspace key
Method 2: Click the annotation, then click the "Delete" button in the list

#### Editing Labels (Reclassing)

To change a label's class:
1. Delete the old annotation
2. Create a new one with the correct class

#### Resizing/Repositioning Boxes

1. Click on a bounding box to select it
2. Drag the corner handles to resize
3. The coordinates update automatically

### Step 4: Save Changes

1. Click the "Save Labels" button in the header
2. Wait for the success message
3. Close the editor tab
4. In FiftyOne, refresh the view to see updated labels

## Keyboard Shortcuts

- **Delete** or **Backspace**: Delete selected annotation
- **Click + Drag**: Create new bounding box
- **Click**: Select annotation

## File Format

The editor reads and writes YOLO format label files:

```
<class_id> <x_center> <y_center> <width> <height>
```

All coordinates are normalized (0.0 to 1.0).

Example:
```
0 0.5 0.5 0.3 0.4
2 0.8 0.3 0.15 0.2
```

## Supported Classes

Default classes (can be customized):
- 0: one
- 1: two
- 2: three
- 3: four
- 4: five
- 5: six
- 6: invalid

## Troubleshooting

### Button Not Appearing

1. Ensure FiftyOne instance was started after plugin installation
2. Check that `FIFTYONE_PLUGINS_DIR` is set correctly
3. Restart the FiftyOne instance

### Editor Won't Load

1. Verify the manager server is running
2. Check that the image path is accessible
3. Look for errors in browser console (F12)

### Changes Not Saving

1. Check file permissions on the labels directory
2. Verify the label path exists
3. Check server logs for errors

### Changes Not Visible in FiftyOne

After editing labels:
1. In FiftyOne, you may need to restart the instance to reload the dataset
2. Or use FiftyOne's dataset reload functionality

## Tips

1. **Workflow Efficiency**: Keep FiftyOne and the label editor in separate browser windows side-by-side
2. **Batch Editing**: Fix multiple images, then restart FiftyOne once to see all changes
3. **Backup**: Consider backing up your labels directory before making extensive edits
4. **Class Names**: The editor uses the same class names as your FiftyOne configuration

## Advanced: Direct Access

You can also access the label editor directly with URL parameters:

```
http://localhost:3000/label-editor.html?image=/path/to/image.jpg&label=/path/to/label.txt
```

This is useful for:
- Testing the editor
- Accessing it from other tools
- Bookmarking frequently edited images

## Architecture Details

### Plugin Integration

The FiftyOne plugin (`fiftyone_plugins/edit_label/__init__.py`) provides:

- **Operator**: `open_label_editor`
- **Context**: Works with selected samples
- **Action**: Opens label editor URL in new tab

### Data Flow

1. User selects sample in FiftyOne
2. Plugin reads sample filepath
3. Plugin constructs label path (converts `images/` to `labels/`, `.jpg` to `.txt`)
4. Plugin opens editor URL with paths as query parameters
5. Editor fetches image/label via API
6. User edits
7. Editor saves via API
8. Changes written to YOLO .txt file

## Security Considerations

- The editor has access to all files in the dataset directory
- No authentication is implemented (assumes local/trusted environment)
- For production use, consider adding authentication
- Validate file paths to prevent directory traversal

## Future Enhancements

Potential improvements:
- Undo/redo functionality
- Keyboard shortcuts for class selection
- Bulk reclass operations
- Image zoom and pan
- Copy/paste annotations
- Polygon annotations (beyond bounding boxes)
- Integration with FiftyOne's evaluation/tagging system

## Support

For issues or questions:
1. Check this guide
2. Review server logs: `docker logs fiftyone-manager_v3`
3. Check browser console for JavaScript errors
4. Verify file permissions and paths
