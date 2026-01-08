"""
FiftyOne Plugin: Delete Samples
Permanently deletes selected samples from disk and dataset with logging
"""

import os
import json
import csv
from datetime import datetime
from pathlib import Path
import fiftyone.operators as foo
import fiftyone.operators.types as types


class DeleteSamplesOperator(foo.Operator):
    """Permanently delete selected samples from disk and dataset"""

    @property
    def config(self):
        return foo.OperatorConfig(
            name="delete_samples",
            label="Delete Samples (Permanent)",
            dynamic=True,
            execute_as_generator=False,
        )

    def resolve_input(self, ctx):
        """Show confirmation dialog with sample count"""
        inputs = types.Object()

        # Get selected samples
        selected = ctx.selected

        if not selected or len(selected) == 0:
            inputs.message(
                "warning",
                "No samples selected. Please select samples to delete."
            )
            return types.Property(inputs, view=types.View(label="Delete Samples"))

        num_selected = len(selected)

        # Show warning message with count
        inputs.message(
            "error",
            f"WARNING: PERMANENT DELETION\n\n"
            f"You are about to permanently delete {num_selected} sample(s) from:\n"
            f"- Dataset: {ctx.dataset.name}\n"
            f"- Disk: Image files and label files\n\n"
            f"This action CANNOT be undone!"
        )

        # Add confirmation checkbox
        inputs.bool(
            "confirm_deletion",
            default=False,
            label="I understand this will permanently delete files from disk",
            description="Check this box to confirm deletion",
            required=True,
        )

        # Add option to delete labels only
        inputs.bool(
            "delete_labels_only",
            default=False,
            label="Delete label files only (keep images)",
            description="If checked, only .txt label files will be deleted",
        )

        # Add sample count display
        inputs.str(
            "sample_count_display",
            default=f"{num_selected} samples selected",
            label="Samples to Delete",
            view=types.View(readonly=True),
        )

        return types.Property(inputs, view=types.View(label="Delete Samples"))

    def execute(self, ctx):
        """Execute the deletion with logging"""

        # Validate confirmation
        confirm = ctx.params.get("confirm_deletion", False)
        if not confirm:
            ctx.ops.notify(
                "Deletion cancelled: Confirmation checkbox not checked",
                variant="error"
            )
            return {
                "success": False,
                "message": "Deletion cancelled by user",
                "deleted_count": 0,
            }

        # Get options
        delete_labels_only = ctx.params.get("delete_labels_only", False)

        # Get selected samples
        selected = ctx.selected
        if not selected or len(selected) == 0:
            ctx.ops.notify("No samples selected", variant="error")
            return {
                "success": False,
                "message": "No samples selected",
                "deleted_count": 0,
            }

        # Prepare logging
        log_entries = []
        deleted_images = 0
        deleted_labels = 0
        failed_deletions = []
        sample_ids_to_remove = []

        # Process each selected sample
        for sample_id in selected:
            try:
                # Get sample object
                view = ctx.view.select(sample_id)
                sample = view.first()

                if sample is None:
                    failed_deletions.append({
                        "sample_id": sample_id,
                        "reason": "Sample not found in dataset"
                    })
                    continue

                # Get file paths
                image_path = sample.filepath

                # Derive label path (supporting multiple extensions)
                label_path = self._get_label_path(image_path)

                # Track what was deleted
                deletion_record = {
                    "timestamp": datetime.now().isoformat(),
                    "sample_id": sample_id,
                    "image_path": image_path,
                    "label_path": label_path,
                    "image_deleted": False,
                    "label_deleted": False,
                    "errors": []
                }

                # Delete label file
                if label_path and os.path.exists(label_path):
                    try:
                        os.remove(label_path)
                        deletion_record["label_deleted"] = True
                        deleted_labels += 1
                    except Exception as e:
                        deletion_record["errors"].append(f"Label deletion failed: {str(e)}")
                        failed_deletions.append({
                            "sample_id": sample_id,
                            "file": label_path,
                            "reason": str(e)
                        })

                # Delete image file (unless labels-only mode)
                if not delete_labels_only:
                    if os.path.exists(image_path):
                        try:
                            os.remove(image_path)
                            deletion_record["image_deleted"] = True
                            deleted_images += 1
                        except Exception as e:
                            deletion_record["errors"].append(f"Image deletion failed: {str(e)}")
                            failed_deletions.append({
                                "sample_id": sample_id,
                                "file": image_path,
                                "reason": str(e)
                            })

                # Add to log
                log_entries.append(deletion_record)

                # Mark sample for removal from dataset (only if image was deleted or labels-only mode)
                if deletion_record["image_deleted"] or delete_labels_only:
                    sample_ids_to_remove.append(sample_id)

            except Exception as e:
                failed_deletions.append({
                    "sample_id": sample_id,
                    "reason": f"Unexpected error: {str(e)}"
                })

        # Remove samples from dataset
        if sample_ids_to_remove:
            try:
                ctx.dataset.delete_samples(sample_ids_to_remove)
                ctx.dataset.save()
            except Exception as e:
                failed_deletions.append({
                    "sample_id": "ALL",
                    "reason": f"Dataset deletion failed: {str(e)}"
                })

        # Write deletion log
        log_path = self._write_deletion_log(
            ctx.dataset.name,
            log_entries,
            delete_labels_only
        )

        # Prepare result
        success = len(failed_deletions) == 0
        total_deleted = len(sample_ids_to_remove)

        # Notify user
        if success:
            message = f"Successfully deleted {total_deleted} samples"
            if delete_labels_only:
                message += " (labels only)"
            ctx.ops.notify(message, variant="success")
        else:
            ctx.ops.notify(
                f"Completed with {len(failed_deletions)} errors. Check deletion log.",
                variant="warning"
            )

        return {
            "success": success,
            "deleted_count": total_deleted,
            "deleted_images": deleted_images,
            "deleted_labels": deleted_labels,
            "failed_count": len(failed_deletions),
            "failed_deletions": failed_deletions,
            "log_path": log_path,
            "delete_mode": "labels_only" if delete_labels_only else "full",
        }

    def resolve_output(self, ctx):
        """Display deletion summary"""
        outputs = types.Object()

        outputs.bool("success", label="Success", view=types.View(readonly=True))
        outputs.int("deleted_count", label="Samples Deleted", view=types.View(readonly=True))
        outputs.int("deleted_images", label="Images Deleted", view=types.View(readonly=True))
        outputs.int("deleted_labels", label="Labels Deleted", view=types.View(readonly=True))
        outputs.int("failed_count", label="Failed Deletions", view=types.View(readonly=True))
        outputs.str("log_path", label="Deletion Log Path", view=types.View(readonly=True))
        outputs.str("delete_mode", label="Deletion Mode", view=types.View(readonly=True))

        return types.Property(outputs)

    def _get_label_path(self, image_path):
        """
        Derive label path from image path.
        Supports multiple image extensions: .jpg, .jpeg, .png, .bmp
        """
        if "/images/" not in image_path:
            return None

        # Replace /images/ with /labels/
        label_path = image_path.replace("/images/", "/labels/")

        # Replace image extension with .txt
        for ext in [".jpg", ".jpeg", ".png", ".bmp", ".JPG", ".JPEG", ".PNG", ".BMP"]:
            if label_path.endswith(ext):
                label_path = label_path[:-len(ext)] + ".txt"
                break

        return label_path

    def _write_deletion_log(self, dataset_name, log_entries, labels_only=False):
        """
        Write deletion log to CSV file.
        Format: CSV with timestamp, sample_id, image_path, label_path, status, errors
        Location: /app/deletion_logs/<dataset_name>_<timestamp>.csv (inside container)
        """
        # Create logs directory at /app/deletion_logs inside the container
        log_dir = Path("/app/deletion_logs")
        log_dir.mkdir(exist_ok=True)

        # Generate log filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        mode_suffix = "_labels_only" if labels_only else "_full"
        log_filename = f"{dataset_name}_{timestamp}{mode_suffix}.csv"
        log_path = log_dir / log_filename

        # Write CSV log
        with open(log_path, 'w', newline='') as csvfile:
            fieldnames = [
                'timestamp',
                'sample_id',
                'image_path',
                'label_path',
                'image_deleted',
                'label_deleted',
                'errors'
            ]
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

            writer.writeheader()
            for entry in log_entries:
                writer.writerow({
                    'timestamp': entry['timestamp'],
                    'sample_id': entry['sample_id'],
                    'image_path': entry['image_path'],
                    'label_path': entry.get('label_path', 'N/A'),
                    'image_deleted': entry['image_deleted'],
                    'label_deleted': entry['label_deleted'],
                    'errors': '; '.join(entry['errors']) if entry['errors'] else ''
                })

        # Also write JSON version for easier parsing
        json_path = log_path.with_suffix('.json')
        with open(json_path, 'w') as jsonfile:
            json.dump({
                'dataset': dataset_name,
                'timestamp': timestamp,
                'deletion_mode': 'labels_only' if labels_only else 'full',
                'total_entries': len(log_entries),
                'entries': log_entries
            }, jsonfile, indent=2)

        return str(log_path)


def register(p):
    """Register the plugin with FiftyOne"""
    p.register(DeleteSamplesOperator)
