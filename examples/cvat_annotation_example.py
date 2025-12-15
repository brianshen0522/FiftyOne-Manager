#!/usr/bin/env python3
"""
Example script showing how to use CVAT annotation with FiftyOne Manager instances.

This script demonstrates how to:
1. Connect to an existing FiftyOne dataset (managed by FiftyOne Manager)
2. Send samples to CVAT for annotation
3. Load annotations back from CVAT

Prerequisites:
- FiftyOne Manager instance running with CVAT sync enabled
- CVAT server accessible and credentials configured
"""

import fiftyone as fo

# Configuration
DATASET_NAME = "your-dataset-name"  # The dataset name used by FiftyOne
ANNO_KEY = "cvat_annotation_run_1"  # Unique identifier for this annotation run
LABEL_FIELD = "ground_truth"  # Field to annotate
PROJECT_NAME = "my_cvat_project"  # Optional: CVAT project name

def create_cvat_annotation_task():
    """Create a CVAT annotation task for a FiftyOne dataset."""

    # Load the dataset
    print(f"Loading dataset: {DATASET_NAME}")
    dataset = fo.load_dataset(DATASET_NAME)

    # Optional: Create a view with specific samples to annotate
    # For example, take first 10 samples
    view = dataset.take(10)

    print(f"Selected {len(view)} samples for annotation")

    # Create annotation task in CVAT
    print(f"Creating CVAT annotation task with key: {ANNO_KEY}")
    view.annotate(
        ANNO_KEY,
        backend="cvat",  # Explicitly specify CVAT backend
        label_field=LABEL_FIELD,
        label_type="detections",  # Change to your label type: detections, classifications, etc.
        classes=["class1", "class2", "class3"],  # Your class labels
        project_name=PROJECT_NAME,  # Optional: organize tasks in a CVAT project
        launch_editor=True,  # Open CVAT in browser
    )

    print(f"✓ CVAT task created successfully!")
    print(f"✓ Annotation info:")
    print(dataset.get_annotation_info(ANNO_KEY))

    return dataset

def load_cvat_annotations():
    """Load completed annotations from CVAT back into FiftyOne."""

    # Load the dataset
    print(f"Loading dataset: {DATASET_NAME}")
    dataset = fo.load_dataset(DATASET_NAME)

    # Load annotations from CVAT
    print(f"Loading annotations from CVAT for key: {ANNO_KEY}")
    dataset.load_annotations(ANNO_KEY)

    print(f"✓ Annotations loaded successfully!")

    # Optional: Launch FiftyOne App to view the annotations
    session = fo.launch_app(dataset)

    return dataset, session

def cleanup_cvat_task():
    """Delete CVAT task and remove annotation run record."""

    # Load the dataset
    dataset = fo.load_dataset(DATASET_NAME)

    # Load annotation results
    results = dataset.load_annotation_results(ANNO_KEY)

    # Delete tasks from CVAT server
    print("Deleting tasks from CVAT...")
    results.cleanup()

    # Delete annotation run record from FiftyOne (keeps the labels)
    print("Removing annotation run record from FiftyOne...")
    dataset.delete_annotation_run(ANNO_KEY)

    print("✓ Cleanup completed!")

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python cvat_annotation_example.py create   - Create CVAT annotation task")
        print("  python cvat_annotation_example.py load     - Load annotations from CVAT")
        print("  python cvat_annotation_example.py cleanup  - Delete CVAT task and run record")
        sys.exit(1)

    command = sys.argv[1]

    if command == "create":
        create_cvat_annotation_task()
    elif command == "load":
        load_cvat_annotations()
    elif command == "cleanup":
        cleanup_cvat_task()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
