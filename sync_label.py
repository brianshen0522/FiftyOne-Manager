import argparse
import math
import os

import fiftyone as fo
from fiftyone import ViewField as F


def order_points_clockwise_from_top_left(points):
    cx = sum(p[0] for p in points) / len(points)
    cy = sum(p[1] for p in points) / len(points)

    with_angle = []
    for x, y in points:
        with_angle.append((x, y, math.atan2(y - cy, x - cx)))

    with_angle.sort(key=lambda p: p[2], reverse=True)

    start_index = 0
    for i in range(1, len(with_angle)):
        if (with_angle[i][1] < with_angle[start_index][1]) or (
            with_angle[i][1] == with_angle[start_index][1]
            and with_angle[i][0] < with_angle[start_index][0]
        ):
            start_index = i

    ordered = []
    for i in range(len(with_angle)):
        idx = (start_index + i) % len(with_angle)
        ordered.append((with_angle[idx][0], with_angle[idx][1]))

    return ordered


def load_class_names(class_file):
    if class_file and os.path.exists(class_file):
        with open(class_file, "r", encoding="utf-8") as f:
            names = [line.strip() for line in f if line.strip()]
        if names:
            return names
    return ["one", "two", "three", "four", "five", "six", "invalid"]


def parse_label_file(label_path, class_names):
    polylines = []
    if not label_path or not os.path.exists(label_path):
        return polylines

    with open(label_path, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) < 5:
                continue

            cls_idx = int(float(parts[0]))
            label = class_names[cls_idx] if cls_idx < len(class_names) else f"class_{cls_idx}"

            if len(parts) >= 9:
                coords = list(map(float, parts[1:9]))
                points = [(coords[i], coords[i + 1]) for i in range(0, 8, 2)]
                points = order_points_clockwise_from_top_left(points)
            else:
                x, y, w, h = map(float, parts[1:5])
                points = [
                    (x - w / 2, y - h / 2),
                    (x + w / 2, y - h / 2),
                    (x + w / 2, y + h / 2),
                    (x - w / 2, y + h / 2),
                ]

            polylines.append(
                fo.Polyline(label=label, points=[points], closed=True, filled=False)
            )

    return polylines


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset-name", required=True)
    parser.add_argument("--image-path", required=True)
    parser.add_argument("--label-path", required=True)
    parser.add_argument("--class-file", default="")
    args = parser.parse_args()

    class_names = load_class_names(args.class_file)
    polylines = parse_label_file(args.label_path, class_names)

    dataset = fo.load_dataset(args.dataset_name)
    sample = dataset.match(F("filepath") == args.image_path).first()
    if sample is None:
        raise RuntimeError(f"Sample not found for filepath: {args.image_path}")

    sample["ground_truth"] = fo.Polylines(polylines=polylines)
    sample.save()


if __name__ == "__main__":
    main()
