import argparse
import os
from collections import defaultdict
from typing import List, Tuple, Sequence
from datetime import datetime

import fiftyone as fo
from pymongo import MongoClient


fo.config.show_progress_bars = True


# ----------------------------------------------------------------------
# Duplicate detection helpers (label-based, no image hashing)
# ----------------------------------------------------------------------


def unique_target_path(img_dir: str, label_dir: str, filename: str) -> Tuple[str, str]:
    """Return paths for image and label with a collision-safe name."""
    name, ext = os.path.splitext(filename)
    candidate_name = filename
    idx = 1
    while True:
        img_target = os.path.join(img_dir, candidate_name)
        label_target = os.path.join(label_dir, os.path.splitext(candidate_name)[0] + ".txt")
        if not os.path.exists(img_target) and not os.path.exists(label_target):
            return img_target, label_target
        candidate_name = f"{name}_dup{idx}{ext}"
        idx += 1


def get_label_path(image_path: str) -> str:
    """Convert image path to corresponding label path."""
    label_path = image_path.replace("images", "labels")
    label_path = label_path.replace("jpg", "txt")
    label_path = label_path.replace("jpeg", "txt")
    label_path = label_path.replace("png", "txt")
    return label_path


def parse_yolo_labels(image_path: str) -> List[Tuple[int, float, float, float, float]]:
    """
    Parse YOLO format labels from file.
    Returns list of (class_id, x_center, y_center, width, height).
    All coordinates are normalized [0, 1].
    """
    label_path = get_label_path(image_path)

    if not os.path.exists(label_path):
        return []

    labels = []
    with open(label_path, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 5:
                continue

            try:
                class_id = int(float(parts[0]))
                x_center = float(parts[1])
                y_center = float(parts[2])
                width = float(parts[3])
                height = float(parts[4])
                labels.append((class_id, x_center, y_center, width, height))
            except (ValueError, IndexError):
                continue

    return labels


def calculate_iou(box1: Tuple[float, float, float, float],
                  box2: Tuple[float, float, float, float]) -> float:
    """
    Calculate IoU (Intersection over Union) between two bounding boxes.
    Boxes are in format (x_center, y_center, width, height) normalized [0, 1].
    """
    # Convert from center format to corner format
    x1_min = box1[0] - box1[2] / 2
    y1_min = box1[1] - box1[3] / 2
    x1_max = box1[0] + box1[2] / 2
    y1_max = box1[1] + box1[3] / 2

    x2_min = box2[0] - box2[2] / 2
    y2_min = box2[1] - box2[3] / 2
    x2_max = box2[0] + box2[2] / 2
    y2_max = box2[1] + box2[3] / 2

    # Calculate intersection
    inter_x_min = max(x1_min, x2_min)
    inter_y_min = max(y1_min, y2_min)
    inter_x_max = min(x1_max, x2_max)
    inter_y_max = min(y1_max, y2_max)

    inter_width = max(0.0, inter_x_max - inter_x_min)
    inter_height = max(0.0, inter_y_max - inter_y_min)
    inter_area = inter_width * inter_height

    # Calculate union
    box1_area = box1[2] * box1[3]
    box2_area = box2[2] * box2[3]
    union_area = box1_area + box2_area - inter_area

    # Avoid division by zero
    if union_area == 0:
        return 0.0

    return inter_area / union_area


def labels_are_similar(labels1: List[Tuple[int, float, float, float, float]],
                       labels2: List[Tuple[int, float, float, float, float]],
                       iou_threshold: float) -> bool:
    """
    Check if two label sets are similar based on class matching and IoU threshold.
    For multiple boxes of the same class, finds optimal matching using greedy algorithm.
    Returns True if both have same number of boxes, all classes match, and all IoUs exceed threshold.
    """
    if len(labels1) != len(labels2):
        return False

    if len(labels1) == 0:
        return False

    # Check all classes match (sorted)
    classes1 = sorted([label[0] for label in labels1])
    classes2 = sorted([label[0] for label in labels2])
    if classes1 != classes2:
        return False

    # Group boxes by class ID
    groups1 = defaultdict(list)
    groups2 = defaultdict(list)

    for label in labels1:
        class_id = label[0]
        box = label[1:]  # (x, y, w, h)
        groups1[class_id].append(box)

    for label in labels2:
        class_id = label[0]
        box = label[1:]  # (x, y, w, h)
        groups2[class_id].append(box)

    # For each class, find optimal matching using greedy algorithm
    for class_id in groups1.keys():
        boxes1 = groups1[class_id]
        boxes2 = groups2[class_id]

        # Use greedy matching: repeatedly find best IoU pair
        used2 = set()

        for box1 in boxes1:
            best_iou = -1
            best_idx = -1

            # Find best matching box2 for this box1
            for idx, box2 in enumerate(boxes2):
                if idx in used2:
                    continue
                iou = calculate_iou(box1, box2)
                if iou > best_iou:
                    best_iou = iou
                    best_idx = idx

            # Check if best match meets threshold
            if best_iou < iou_threshold:
                return False

            used2.add(best_idx)

    return True


def find_duplicate_groups(image_paths: Sequence[str], iou_threshold: float) -> List[List[int]]:
    """
    Find duplicate groups using sequential comparison based on filename order.
    Only uses label comparison (class + bounding box IoU).
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    n = len(image_paths)

    print(f"Finding duplicates in {n} images using IoU threshold {iou_threshold}")

    groups: List[List[int]] = []
    visited = [False] * n

    with open(f"similar_path_{timestamp}.txt", 'w', encoding="utf-8") as f:
        i = 0
        while i < n:
            if visited[i]:
                i += 1
                continue

            # Start a new group with current file
            current_group = [i]
            visited[i] = True
            base_labels = parse_yolo_labels(image_paths[i])

            # Skip if no labels
            if not base_labels:
                i += 1
                continue

            # Compare with subsequent files
            j = i + 1
            while j < n:
                if visited[j]:
                    j += 1
                    continue

                # Parse labels for comparison file
                compare_labels = parse_yolo_labels(image_paths[j])

                # Check if labels are similar (same classes + IoU >= threshold)
                if labels_are_similar(base_labels, compare_labels, iou_threshold):
                    current_group.append(j)
                    visited[j] = True
                    f.write(f"Similar labels (IoU >= {iou_threshold})\n")
                    f.write(f"  base: {image_paths[i]}\n")
                    f.write(f"  match: {image_paths[j]}\n")
                else:
                    # Found a different file, stop comparing with this base
                    break

                j += 1

            # Only add groups with more than 1 file
            if len(current_group) > 1:
                groups.append(current_group)

            i += 1

    return groups


def move_duplicates(
    dataset_base: str,
    groups: List[List[int]],
    image_paths: List[str],
    debug: bool,
) -> None:
    dup_root = os.path.join(dataset_base, "duplicate")
    dup_img_root = os.path.join(dup_root, "images")
    dup_label_root = os.path.join(dup_root, "labels")
    os.makedirs(dup_img_root, exist_ok=True)
    os.makedirs(dup_label_root, exist_ok=True)

    for group_idx, group in enumerate(groups, start=1):
        keep_idx = group[0]
        group_folder_img = dup_img_root
        group_folder_label = dup_label_root
        if debug:
            group_name = f"group_{group_idx:04d}"
            group_folder_img = os.path.join(dup_img_root, group_name)
            group_folder_label = os.path.join(dup_label_root, group_name)
            os.makedirs(group_folder_img, exist_ok=True)
            os.makedirs(group_folder_label, exist_ok=True)

        # In debug mode, move ALL duplicates (including the first one)
        # In normal mode, keep the first one and move the rest
        files_to_move = group if debug else group[1:]

        for idx in files_to_move:
            src_img = image_paths[idx]
            stem, ext = os.path.splitext(os.path.basename(src_img))
            target_img_dir = group_folder_img
            target_label_dir = group_folder_label

            if debug:
                target_img = os.path.join(target_img_dir, os.path.basename(src_img))
                target_label = os.path.join(target_label_dir, stem + ".txt")
            else:
                target_img, target_label = unique_target_path(target_img_dir, target_label_dir, os.path.basename(src_img))

            os.makedirs(os.path.dirname(target_img), exist_ok=True)
            os.makedirs(os.path.dirname(target_label), exist_ok=True)
            os.rename(src_img, target_img)

            src_label = os.path.join(dataset_base, "labels", stem + ".txt")
            if os.path.exists(src_label):
                os.rename(src_label, target_label)
            else:
                # Leave a marker file so the user knows the label was missing
                with open(target_label, "w") as f:
                    f.write("# Label file was missing for this duplicate\n")

        if debug:
            print(f"Moved all {len(group)} duplicates to {group_folder_img}")
        else:
            kept = image_paths[keep_idx]
            print(f"Kept original: {kept}; moved {len(group) - 1} duplicates to {dup_root}")


def handle_duplicates(dataset_base: str, iou_threshold: float, debug: bool) -> None:
    """
    Detect and move duplicate images based on label similarity (class + IoU).
    No image hash computation - only label file comparison.
    """
    img_dir = os.path.join(dataset_base, "images")
    label_dir = os.path.join(dataset_base, "labels")
    print(f"Image directory: {img_dir}")
    print(f"Label directory: {label_dir}")

    if not os.path.isdir(img_dir) or not os.path.isdir(label_dir):
        print("Images or labels directory not found; skipping duplicate detection")
        return

    # Sort image paths to ensure consistent ordering (filename order = time order)
    image_paths = [
        os.path.join(img_dir, fname)
        for fname in sorted(os.listdir(img_dir))
        if fname.lower().endswith((".jpg", ".jpeg", ".png"))
    ]

    if not image_paths:
        print("No images found; skipping duplicate detection")
        return

    print(f"Analyzing {len(image_paths)} images for duplicates using IoU threshold {iou_threshold}")

    # Find duplicate groups based on label similarity only
    groups = find_duplicate_groups(image_paths, iou_threshold)

    if not groups:
        print("No duplicates found.")
        return

    move_duplicates(dataset_base, groups, image_paths, debug)
    print(f"Detected {len(groups)} duplicate group(s).")


# ----------------------------------------------------------------------
# Parse command-line arguments
# ----------------------------------------------------------------------
def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Start FiftyOne with YOLO dataset and remove duplicates.")
    parser.add_argument("port", type=int, help="Port to run FiftyOne on")
    parser.add_argument("dataset_path", type=str, help="Path to dataset root containing images/ and labels/")
    parser.add_argument(
        "--iou-threshold",
        type=float,
        default=0.8,
        help="IoU threshold (0-1) for bounding box duplicate detection (default: 0.8).",
    )
    parser.add_argument(
        "--debug",
        action="store_true",
        help="Place each duplicate group into its own folder under duplicate/images and duplicate/labels.",
    )
    parser.add_argument(
        "--class-file",
        type=str,
        default=None,
        help="Path to class names file (one class per line). If not provided, uses default class names.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    fiftyone_port = args.port
    dataset_base = args.dataset_path
    iou_threshold = max(0.0, min(1.0, args.iou_threshold))

    # ------------------------------------------------------------------
    # 0. MongoDB configuration via environment variables
    # ------------------------------------------------------------------
    mongodb_uri = os.environ.get("FIFTYONE_DATABASE_URI", "mongodb://localhost:27017")
    db_name = os.environ.get("FIFTYONE_DATABASE_NAME")

    if not db_name:
        dataset_name = os.path.basename(dataset_base.rstrip("/"))
        if not dataset_name:
            dataset_name = "datasets"
        db_name = f"{dataset_name}_{fiftyone_port}"

    print(f"Using MongoDB: {mongodb_uri}")
    print(f"Database name: {db_name}")

    # Delete existing database to ensure clean start
    try:
        client = MongoClient(mongodb_uri)
        if db_name in client.list_database_names():
            print(f"Dropping existing database: {db_name}")
            client.drop_database(db_name)
        client.close()
    except Exception as e:
        print(f"Warning: Could not drop existing database: {e}")

    # Delete any existing FiftyOne dataset with the same name
    try:
        if db_name in fo.list_datasets():
            print(f"Deleting existing FiftyOne dataset: {db_name}")
            fo.delete_dataset(db_name)
    except Exception as e:
        print(f"Warning: Could not delete existing dataset: {e}")

    # Run duplicate detection using label comparison only (no image hashing)
    handle_duplicates(dataset_base, iou_threshold, args.debug)

    # ------------------------------------------------------------------
    # 1. Build your custom dataset from images + YOLO labels
    # ------------------------------------------------------------------
    # Load class names from file or use defaults
    if args.class_file and os.path.exists(args.class_file):
        print(f"Loading class names from: {args.class_file}")
        with open(args.class_file, 'r') as f:
            names = [line.strip() for line in f if line.strip()]
        print(f"Loaded {len(names)} class names")
    else:
        names = ["one", "two", "three", "four", "five", "six", "invalid"]
        if args.class_file:
            print(f"Warning: Class file not found: {args.class_file}, using default names")

    img_dir = os.path.join(dataset_base, "images")
    label_dir = os.path.join(dataset_base, "labels")

    samples = []
    for fname in os.listdir(img_dir):
        if not fname.lower().endswith((".jpg", ".jpeg", ".png")):
            continue

        img_path = os.path.join(img_dir, fname)
        txt_path = os.path.join(label_dir, os.path.splitext(fname)[0] + ".txt")

        if not os.path.exists(txt_path):
            continue

        detections = []
        with open(txt_path, "r") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) < 5:
                    continue

                cls_idx = int(float(parts[0]))
                # Handle class indices beyond the hardcoded names list
                if cls_idx < len(names):
                    label = names[cls_idx]
                else:
                    label = f"class_{cls_idx}"
                x, y, w, h = map(float, parts[1:5])
                detections.append(
                    fo.Detection(
                        label=label,
                        bounding_box=[x - w / 2, y - h / 2, w, h],
                    )
                )

        sample = fo.Sample(filepath=img_path)
        sample["filename"] = fname
        sample["ground_truth"] = fo.Detections(detections=detections)
        samples.append(sample)

    print(f"Collected {len(samples)} samples")

    # ------------------------------------------------------------------
    # 2. Add a numeric field that encodes filename order (for sorting)
    # ------------------------------------------------------------------
    sorted_by_name = sorted(samples, key=lambda s: s["filename"])
    for idx, sample in enumerate(sorted_by_name):
        sample["filename_order"] = idx

    # ------------------------------------------------------------------
    # 3. Create dataset (MongoDB already configured at start)
    # ------------------------------------------------------------------
    print(f"Creating new dataset: {db_name}")
    dataset = fo.Dataset(db_name)

    dataset.add_sample_field("filename", fo.StringField)
    dataset.add_sample_field("filename_order", fo.IntField)
    dataset.add_sample_field(
        "ground_truth", fo.EmbeddedDocumentField, embedded_doc_type=fo.Detections
    )

    dataset.add_samples(samples)

    dataset.app_config.sort_by = "filename_order"
    dataset.save()

    # ------------------------------------------------------------------
    # 4. Launch FiftyOne App
    # ------------------------------------------------------------------
    view = dataset.sort_by("filename_order")
    session = fo.launch_app(view, port=fiftyone_port, address="0.0.0.0", remote=True)
    session.wait(-1)


if __name__ == "__main__":
    main()