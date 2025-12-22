#!/usr/bin/env python3
"""
Example script showing how to use Label Studio annotation with FiftyOne Manager instances.

This script demonstrates how to:
1. Connect to an existing FiftyOne dataset (managed by FiftyOne Manager)
2. Send samples to Label Studio for annotation
3. Load annotations back from Label Studio

Prerequisites:
- FiftyOne Manager instance running with Label Studio sync enabled
- Label Studio server accessible and API key configured
"""

import fiftyone as fo

# Configuration
DATASET_NAME = "your-dataset-name"  # The dataset name used by FiftyOne
ANNO_KEY = "labelstudio_annotation_run_1"  # Unique identifier for this annotation run
LABEL_FIELD = "ground_truth"  # Field to annotate
PROJECT_NAME = "my_labelstudio_project"  # Optional: Label Studio project name

def create_labelstudio_annotation_task():
    """Create a Label Studio annotation task for a FiftyOne dataset."""

    # Load the dataset
    print(f"Loading dataset: {DATASET_NAME}")
    dataset = fo.load_dataset(DATASET_NAME)

    # Optional: Create a view with specific samples to annotate
    # For example, take first 10 samples
    view = dataset.take(10)

    print(f"Selected {len(view)} samples for annotation")

    # Create annotation task in Label Studio
    print(f"Creating Label Studio annotation task with key: {ANNO_KEY}")
    view.annotate(
        ANNO_KEY,
        backend="labelstudio",  # Explicitly specify Label Studio backend
        label_field=LABEL_FIELD,
        label_type="detections",  # Change to your label type: detections, classifications, etc.
        classes=["class1", "class2", "class3"],  # Your class labels
        project_name=PROJECT_NAME,  # Optional: organize tasks in a Label Studio project
        launch_editor=True,  # Open Label Studio in browser
    )

    print(f"✓ Label Studio task created successfully!")
    print(f"✓ Annotation info:")
    print(dataset.get_annotation_info(ANNO_KEY))

    return dataset

def load_labelstudio_annotations():
    """Load completed annotations from Label Studio back into FiftyOne."""

    # Load the dataset
    print(f"Loading dataset: {DATASET_NAME}")
    dataset = fo.load_dataset(DATASET_NAME)

    # Load annotations from Label Studio
    print(f"Loading annotations from Label Studio for key: {ANNO_KEY}")
    dataset.load_annotations(ANNO_KEY)

    print(f"✓ Annotations loaded successfully!")

    # Optional: Launch FiftyOne App to view the annotations
    session = fo.launch_app(dataset)

    return dataset, session

def cleanup_labelstudio_task():
    """Delete Label Studio task and remove annotation run record."""

    # Load the dataset
    dataset = fo.load_dataset(DATASET_NAME)

    # Load annotation results
    results = dataset.load_annotation_results(ANNO_KEY)

    # Delete tasks from Label Studio server
    print("Deleting tasks from Label Studio...")
    results.cleanup()

    # Delete annotation run record from FiftyOne (keeps the labels)
    print("Removing annotation run record from FiftyOne...")
    dataset.delete_annotation_run(ANNO_KEY)

    print("✓ Cleanup completed!")

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python labelstudio_annotation_example.py create   - Create Label Studio annotation task")
        print("  python labelstudio_annotation_example.py load     - Load annotations from Label Studio")
        print("  python labelstudio_annotation_example.py cleanup  - Delete Label Studio task and run record")
        sys.exit(1)

    command = sys.argv[1]

    if command == "create":
        create_labelstudio_annotation_task()
    elif command == "load":
        load_labelstudio_annotations()
    elif command == "cleanup":
        cleanup_labelstudio_task()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
