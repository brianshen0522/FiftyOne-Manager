#!/usr/bin/env python3
"""
Example script showing how to upload multiple batches to the same Label Studio project.

This script demonstrates how to:
1. Upload batch 1 to a Label Studio project
2. Upload batch 2 to the SAME Label Studio project
3. Load annotations from all batches

Key Points:
- Use the SAME project_name for all batches
- Use DIFFERENT anno_key for each batch
- This ensures all batches are in the same Label Studio project
"""

import fiftyone as fo

# Configuration
DATASET_NAME = "your-dataset-name"  # The dataset name used by FiftyOne
PROJECT_NAME = "dice_annotation_project"  # SAME for all batches!
LABEL_FIELD = "ground_truth"  # Field to annotate
BATCH_SIZE = 10  # Number of samples per batch

def upload_batch_to_labelstudio(batch_number, view, classes):
    """
    Upload a specific batch to Label Studio.

    Args:
        batch_number: Batch identifier (e.g., 1, 2, 3)
        view: FiftyOne view containing the samples to annotate
        classes: List of class labels
    """
    # Create unique annotation key for this batch
    anno_key = f"batch_{batch_number}_annotation"

    print(f"\n{'='*60}")
    print(f"Uploading Batch {batch_number} to Label Studio")
    print(f"{'='*60}")
    print(f"Samples in batch: {len(view)}")
    print(f"Annotation key: {anno_key}")
    print(f"Project name: {PROJECT_NAME}")  # Same for all batches!

    # Create annotation task in Label Studio
    view.annotate(
        anno_key,
        backend="labelstudio",
        label_field=LABEL_FIELD,
        label_type="detections",  # Change to your label type
        classes=classes,
        project_name=PROJECT_NAME,  # IMPORTANT: Same project name for all batches!
        launch_editor=False,  # Set to True to open browser for first batch
    )

    print(f"✓ Batch {batch_number} uploaded successfully to project '{PROJECT_NAME}'")
    return anno_key

def upload_all_batches():
    """Upload all batches to the same Label Studio project."""

    # Load the dataset
    print(f"Loading dataset: {DATASET_NAME}")
    dataset = fo.load_dataset(DATASET_NAME)

    # Define your class labels
    classes = ["class1", "class2", "class3"]

    # Calculate total batches
    total_samples = len(dataset)
    num_batches = (total_samples + BATCH_SIZE - 1) // BATCH_SIZE

    print(f"\nTotal samples: {total_samples}")
    print(f"Batch size: {BATCH_SIZE}")
    print(f"Number of batches: {num_batches}")

    annotation_keys = []

    # Upload each batch
    for batch_num in range(1, num_batches + 1):
        # Create view for this batch
        skip = (batch_num - 1) * BATCH_SIZE
        view = dataset.skip(skip).limit(BATCH_SIZE)

        # Upload batch to Label Studio (same project!)
        anno_key = upload_batch_to_labelstudio(batch_num, view, classes)
        annotation_keys.append(anno_key)

    print(f"\n{'='*60}")
    print(f"All batches uploaded to project: {PROJECT_NAME}")
    print(f"{'='*60}")
    print(f"Annotation keys created:")
    for key in annotation_keys:
        print(f"  - {key}")

    return dataset, annotation_keys

def upload_specific_batches(batch_numbers):
    """
    Upload specific batches to Label Studio.

    Args:
        batch_numbers: List of batch numbers to upload (e.g., [1, 3, 5])
    """
    # Load the dataset
    print(f"Loading dataset: {DATASET_NAME}")
    dataset = fo.load_dataset(DATASET_NAME)

    # Define your class labels
    classes = ["class1", "class2", "class3"]

    annotation_keys = []

    for batch_num in batch_numbers:
        # Create view for this batch
        skip = (batch_num - 1) * BATCH_SIZE
        view = dataset.skip(skip).limit(BATCH_SIZE)

        if len(view) == 0:
            print(f"Warning: Batch {batch_num} is empty, skipping...")
            continue

        # Upload batch to Label Studio (same project!)
        anno_key = upload_batch_to_labelstudio(batch_num, view, classes)
        annotation_keys.append(anno_key)

    print(f"\n{'='*60}")
    print(f"Batches {batch_numbers} uploaded to project: {PROJECT_NAME}")
    print(f"{'='*60}")

    return dataset, annotation_keys

def load_annotations_from_batch(batch_number):
    """Load annotations from a specific batch."""

    # Load the dataset
    dataset = fo.load_dataset(DATASET_NAME)

    # Annotation key for this batch
    anno_key = f"batch_{batch_number}_annotation"

    print(f"Loading annotations for batch {batch_number} (key: {anno_key})")
    dataset.load_annotations(anno_key)

    print(f"✓ Batch {batch_number} annotations loaded!")
    return dataset

def load_all_batch_annotations():
    """Load annotations from all batches."""

    # Load the dataset
    dataset = fo.load_dataset(DATASET_NAME)

    # Get all annotation runs for this dataset
    anno_keys = dataset.list_annotation_runs()

    # Filter for batch annotation keys
    batch_keys = [key for key in anno_keys if key.startswith("batch_")]

    print(f"Found {len(batch_keys)} batch annotation runs:")
    for key in batch_keys:
        print(f"  - {key}")

    # Load annotations from each batch
    for anno_key in batch_keys:
        print(f"\nLoading annotations from: {anno_key}")
        dataset.load_annotations(anno_key)

    print(f"\n✓ All batch annotations loaded successfully!")

    # Optional: Launch FiftyOne App to view
    session = fo.launch_app(dataset)

    return dataset, session

def cleanup_batch(batch_number):
    """Clean up a specific batch annotation."""

    dataset = fo.load_dataset(DATASET_NAME)
    anno_key = f"batch_{batch_number}_annotation"

    # Load annotation results
    results = dataset.load_annotation_results(anno_key)

    # Delete tasks from Label Studio server
    print(f"Deleting batch {batch_number} tasks from Label Studio...")
    results.cleanup()

    # Delete annotation run record from FiftyOne
    print(f"Removing batch {batch_number} annotation run record...")
    dataset.delete_annotation_run(anno_key)

    print(f"✓ Batch {batch_number} cleanup completed!")

def cleanup_all_batches():
    """Clean up all batch annotations."""

    dataset = fo.load_dataset(DATASET_NAME)

    # Get all batch annotation keys
    anno_keys = dataset.list_annotation_runs()
    batch_keys = [key for key in anno_keys if key.startswith("batch_")]

    for anno_key in batch_keys:
        batch_num = anno_key.replace("batch_", "").replace("_annotation", "")
        print(f"\nCleaning up: {anno_key}")

        try:
            results = dataset.load_annotation_results(anno_key)
            results.cleanup()
            dataset.delete_annotation_run(anno_key)
            print(f"✓ {anno_key} cleaned up")
        except Exception as e:
            print(f"✗ Failed to cleanup {anno_key}: {e}")

    print(f"\n✓ All batch cleanup completed!")

if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python labelstudio_batch_annotation_example.py upload_all")
        print("  python labelstudio_batch_annotation_example.py upload_batches 1 2 3")
        print("  python labelstudio_batch_annotation_example.py load_batch <batch_number>")
        print("  python labelstudio_batch_annotation_example.py load_all")
        print("  python labelstudio_batch_annotation_example.py cleanup_batch <batch_number>")
        print("  python labelstudio_batch_annotation_example.py cleanup_all")
        print("\nExamples:")
        print("  # Upload all data in batches to the same Label Studio project")
        print("  python labelstudio_batch_annotation_example.py upload_all")
        print("")
        print("  # Upload only batches 1, 2, and 3")
        print("  python labelstudio_batch_annotation_example.py upload_batches 1 2 3")
        print("")
        print("  # Load annotations from batch 1")
        print("  python labelstudio_batch_annotation_example.py load_batch 1")
        print("")
        print("  # Load annotations from all batches")
        print("  python labelstudio_batch_annotation_example.py load_all")
        sys.exit(1)

    command = sys.argv[1]

    if command == "upload_all":
        upload_all_batches()
    elif command == "upload_batches":
        if len(sys.argv) < 3:
            print("Error: Please specify batch numbers")
            print("Example: python labelstudio_batch_annotation_example.py upload_batches 1 2 3")
            sys.exit(1)
        batch_nums = [int(x) for x in sys.argv[2:]]
        upload_specific_batches(batch_nums)
    elif command == "load_batch":
        if len(sys.argv) < 3:
            print("Error: Please specify batch number")
            sys.exit(1)
        batch_num = int(sys.argv[2])
        load_annotations_from_batch(batch_num)
    elif command == "load_all":
        load_all_batch_annotations()
    elif command == "cleanup_batch":
        if len(sys.argv) < 3:
            print("Error: Please specify batch number")
            sys.exit(1)
        batch_num = int(sys.argv[2])
        cleanup_batch(batch_num)
    elif command == "cleanup_all":
        cleanup_all_batches()
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
