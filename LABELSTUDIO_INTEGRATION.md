# Label Studio Integration Guide

This guide explains how to use Label Studio annotation backend with FiftyOne Manager.

## Overview

FiftyOne Manager now supports Label Studio integration, allowing you to send your datasets to Label Studio for annotation and import the results back into FiftyOne. This integration follows FiftyOne's official Label Studio backend implementation.

## Configuration

### 1. Configure Label Studio Credentials

Edit your `.env` file (or `.env.dev` for development) and set the following variables:

```bash
# Label Studio server URL (self-hosted or cloud)
LABELSTUDIO_URL=http://localhost:8080/

# Label Studio API key
# Get this from: Settings > Account & Settings > Access Token
LABELSTUDIO_API_KEY=your_api_key_here

# Optional: Local file storage (for self-hosted Label Studio)
LABELSTUDIO_LOCAL_FILES_SERVING_ENABLED=false
LABELSTUDIO_LOCAL_FILES_DOCUMENT_ROOT=/data/datasets
```

### 2. Get Your Label Studio API Key

1. Log in to Label Studio
2. Go to **Settings** → **Account & Settings**
3. Find the **Access Token** section
4. Copy your API key

### 3. Enable Label Studio Sync for Instance

When creating or editing a FiftyOne instance in the Manager UI:

1. Check the **"Label Studio Sync"** checkbox
2. Save the instance

This ensures Label Studio credentials are available to the FiftyOne instance when it starts.

## Important: How Label Studio Integration Works

**The "Label Studio Sync" checkbox does NOT automatically create Label Studio projects or tasks.**

Instead, it:
- ✓ Configures Label Studio credentials for the FiftyOne instance
- ✓ Makes the Label Studio backend available to FiftyOne's annotation API
- ✓ Automatically creates a Label Studio project when the instance starts
- ✓ Allows you to use FiftyOne's Python API to create annotation tasks

**You must explicitly use FiftyOne's annotation API to create Label Studio tasks.**

## Usage Workflow

### Step 1: Access Your Dataset

Connect to your FiftyOne instance (running via the Manager) and load your dataset:

```python
import fiftyone as fo

# Load the dataset managed by FiftyOne Manager
dataset = fo.load_dataset("your-dataset-name")
```

### Step 2: Create Label Studio Annotation Task

Use FiftyOne's `annotate()` method to send samples to Label Studio:

```python
# Select samples to annotate (optional)
view = dataset.take(10)  # Annotate first 10 samples

# Create Label Studio annotation task
anno_key = "my_annotation_run"

view.annotate(
    anno_key,
    backend="labelstudio",  # Use Label Studio backend
    label_field="ground_truth",  # Field to annotate
    label_type="detections",  # Type: detections, classifications, etc.
    classes=["class1", "class2", "class3"],  # Your class labels
    project_name="my_project",  # Optional: Label Studio project name
    launch_editor=True,  # Open Label Studio in browser
)
```

### Step 3: Annotate in Label Studio

- The Label Studio editor will open in your browser automatically
- Perform your annotations in Label Studio
- Submit your annotations in Label Studio

### Step 4: Load Annotations Back to FiftyOne

Import the completed annotations:

```python
# Load annotations from Label Studio
dataset.load_annotations(anno_key)

# Optional: View in FiftyOne App
session = fo.launch_app(dataset)
```

### Step 5: Cleanup (Optional)

Delete the Label Studio tasks and annotation run record:

```python
# Get annotation results
results = dataset.load_annotation_results(anno_key)

# Delete tasks from Label Studio server
results.cleanup()

# Remove annotation run record from FiftyOne (keeps the labels)
dataset.delete_annotation_run(anno_key)
```

## Example Script

A complete example script is available at `examples/labelstudio_annotation_example.py`:

```bash
# Create Label Studio annotation task
python examples/labelstudio_annotation_example.py create

# Load annotations from Label Studio
python examples/labelstudio_annotation_example.py load

# Cleanup Label Studio tasks
python examples/labelstudio_annotation_example.py cleanup
```

**Remember to edit the script** with your dataset name, classes, and annotation settings.

## Advanced Features

### Local File Storage

For self-hosted Label Studio instances, you can enable local file serving to improve performance:

1. In `.env`, set:
```bash
LABELSTUDIO_LOCAL_FILES_SERVING_ENABLED=true
LABELSTUDIO_LOCAL_FILES_DOCUMENT_ROOT=/data/datasets
```

2. In Label Studio settings, enable local storage and set the same path

### Label Types Supported

Label Studio integration supports all FiftyOne label types:

- `classifications` - Single or multi-label classification
- `detections` - Bounding box object detection
- `instances` - Instance segmentation with masks
- `polylines` - Polylines
- `polygons` - Polygons
- `keypoints` - Keypoint detection
- `segmentation` - Semantic segmentation
- `scalar` - Scalar values

### Video Annotation

Label Studio supports video annotation:

```python
view.annotate(
    anno_key,
    label_field="frames.detections",  # Frame-level field
    label_type="detections",
    classes=["vehicle"],
)
```

## Troubleshooting

### Label Studio tasks are not created

- Ensure Label Studio API key is correctly configured in `.env`
- Verify "Label Studio Sync" is enabled for the instance
- Restart the instance after enabling Label Studio sync
- Check that you're using `view.annotate()` in Python (not just enabling the checkbox)

### Connection errors

- Verify Label Studio server URL is accessible from the Docker container
- Check Label Studio API key is valid (not expired)
- Ensure Label Studio server is running

### Environment variables not available

Run inside the container to check:
```bash
docker compose exec fiftyone-manager pm2 env 0 | grep LABELSTUDIO
```

You should see:
- `FIFTYONE_LABELSTUDIO_URL`
- `FIFTYONE_LABELSTUDIO_API_KEY`

## CVAT vs Label Studio: Which to Use?

Both annotation backends are supported. Choose based on your needs:

**Label Studio:**
- Modern, user-friendly interface
- Better for single-user or small teams
- Cloud hosting available
- Better for ML workflows with pre-annotations
- API key authentication (simpler)

**CVAT:**
- More mature, enterprise-ready
- Better for large annotation teams
- Advanced video annotation features
- Better task management for large projects
- Username/password authentication

You can enable both and use whichever fits your workflow!

## Reference

For complete Label Studio annotation documentation, see:
- [FiftyOne Label Studio Integration Docs](https://docs.voxel51.com/integrations/labelstudio.html)
- [FiftyOne Annotation API](https://docs.voxel51.com/user_guide/annotation.html)
- [Label Studio Documentation](https://labelstud.io/guide/)
