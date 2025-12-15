# CVAT Integration Guide

This guide explains how to use CVAT annotation backend with FiftyOne Manager.

## Overview

FiftyOne Manager now supports CVAT integration, allowing you to send your datasets to CVAT for annotation and import the results back into FiftyOne. This integration follows FiftyOne's official CVAT backend implementation.

## Configuration

### 1. Configure CVAT Credentials

Edit your `.env` file (or `.env.dev` for development) and set the following variables:

```bash
# CVAT server URL (self-hosted or app.cvat.ai)
CVAT_URL=http://192.168.20.3:5100/

# CVAT authentication credentials
CVAT_USERNAME=alei
CVAT_PASSWORD=studio0000

# CVAT email (optional, required for some CVAT servers)
CVAT_EMAIL=
```

### 2. Enable CVAT Sync for Instance

When creating or editing a FiftyOne instance in the Manager UI:

1. Check the **"CVAT Sync"** checkbox
2. Save the instance

This ensures CVAT credentials are available to the FiftyOne instance when it starts.

## Important: How CVAT Integration Works

**The "CVAT Sync" checkbox does NOT automatically create CVAT projects or tasks.**

Instead, it:
- ✓ Configures CVAT credentials for the FiftyOne instance
- ✓ Makes the CVAT backend available to FiftyOne's annotation API
- ✓ Allows you to use FiftyOne's Python API to create annotation tasks

**You must explicitly use FiftyOne's annotation API to create CVAT tasks.**

## Usage Workflow

### Step 1: Access Your Dataset

Connect to your FiftyOne instance (running via the Manager) and load your dataset:

```python
import fiftyone as fo

# Load the dataset managed by FiftyOne Manager
dataset = fo.load_dataset("your-dataset-name")
```

### Step 2: Create CVAT Annotation Task

Use FiftyOne's `annotate()` method to send samples to CVAT:

```python
# Select samples to annotate (optional)
view = dataset.take(10)  # Annotate first 10 samples

# Create CVAT annotation task
anno_key = "my_annotation_run"

view.annotate(
    anno_key,
    backend="cvat",  # Use CVAT backend
    label_field="ground_truth",  # Field to annotate
    label_type="detections",  # Type: detections, classifications, etc.
    classes=["class1", "class2", "class3"],  # Your class labels
    project_name="my_project",  # Optional: CVAT project name
    launch_editor=True,  # Open CVAT in browser
)
```

### Step 3: Annotate in CVAT

- The CVAT editor will open in your browser automatically
- Perform your annotations in CVAT
- Save your work in CVAT

### Step 4: Load Annotations Back to FiftyOne

Import the completed annotations:

```python
# Load annotations from CVAT
dataset.load_annotations(anno_key)

# Optional: View in FiftyOne App
session = fo.launch_app(dataset)
```

### Step 5: Cleanup (Optional)

Delete the CVAT tasks and annotation run record:

```python
# Get annotation results
results = dataset.load_annotation_results(anno_key)

# Delete tasks from CVAT server
results.cleanup()

# Remove annotation run record from FiftyOne (keeps the labels)
dataset.delete_annotation_run(anno_key)
```

## Example Script

A complete example script is available at `examples/cvat_annotation_example.py`:

```bash
# Create CVAT annotation task
python examples/cvat_annotation_example.py create

# Load annotations from CVAT
python examples/cvat_annotation_example.py load

# Cleanup CVAT tasks
python examples/cvat_annotation_example.py cleanup
```

**Remember to edit the script** with your dataset name, classes, and annotation settings.

## Using FiftyOne App Plugin

You can also use the FiftyOne App's annotation plugin (`@voxel51/annotation`) to manage CVAT annotations directly from the FiftyOne web interface:

1. Open your FiftyOne instance in the browser
2. Install the annotation plugin if not already installed
3. Use the plugin UI to create and manage CVAT annotation tasks

## Advanced Usage

### Label Types Supported

CVAT integration supports all FiftyOne label types:

- `classifications` - Single or multi-label classification
- `detections` - Bounding box object detection
- `instances` - Instance segmentation with masks
- `polylines` - Polylines with `filled=False`
- `polygons` - Polygons with `filled=True`
- `keypoints` - Keypoint detection
- `segmentation` - Semantic segmentation
- `scalar` - Scalar values

### Custom Attributes

You can define custom attributes for labels:

```python
attributes = {
    "is_truncated": {
        "type": "radio",
        "values": [True, False],
        "default": False,
    },
    "gender": {
        "type": "select",
        "values": ["male", "female"],
    }
}

view.annotate(
    anno_key,
    label_field="ground_truth",
    attributes=attributes,
)
```

### Working with Existing Labels

Edit existing annotations:

```python
# Upload existing labels for editing
view.annotate(
    anno_key,
    label_field="ground_truth",  # Existing field with labels
    allow_additions=True,  # Allow new labels
    allow_deletions=True,  # Allow deleting labels
    allow_label_edits=True,  # Allow editing label classes
    allow_spatial_edits=True,  # Allow moving/resizing boxes
)
```

### Video Annotation

CVAT supports video annotation with tracks:

```python
view.annotate(
    anno_key,
    label_field="frames.detections",  # Frame-level field
    label_type="detections",
    classes=["vehicle"],
    attributes={
        "type": {
            "type": "select",
            "values": ["sedan", "suv", "truck"],
            "mutable": False,  # Same value across all frames
        }
    }
)
```

## Troubleshooting

### CVAT tasks are not created

- Ensure CVAT credentials are correctly configured in `.env`
- Verify "CVAT Sync" is enabled for the instance
- Restart the instance after enabling CVAT sync
- Check that you're using `view.annotate()` in Python (not just enabling the checkbox)

### Connection errors

- Verify CVAT server URL is accessible from the Docker container
- Check CVAT username and password are correct
- Ensure CVAT server is running

### Environment variables not available

Run inside the container to check:
```bash
docker compose -f docker-compose.dev.yml exec fiftyone-manager-dev pm2 env 0 | grep CVAT
```

You should see:
- `FIFTYONE_CVAT_URL`
- `FIFTYONE_CVAT_USERNAME`
- `FIFTYONE_CVAT_PASSWORD`

## Reference

For complete CVAT annotation documentation, see:
- [FiftyOne CVAT Integration Docs](https://docs.voxel51.com/integrations/cvat.html)
- [FiftyOne Annotation API](https://docs.voxel51.com/user_guide/annotation.html)
