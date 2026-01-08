"""
FiftyOne Plugin: Edit Label
Opens selected sample in custom YOLO label editor
"""

import os
import fiftyone.operators as foo
import fiftyone.operators.types as types


class OpenLabelEditor(foo.Operator):
    """Opens the selected sample in the custom label editor"""

    @property
    def config(self):
        return foo.OperatorConfig(
            name="open_label_editor",
            label="Edit Label in Tool",
            dynamic=True,
            execute_as_generator=False,
        )

    def resolve_input(self, ctx):
        inputs = types.Object()

        # Check if samples are selected
        selected = ctx.selected
        if selected and len(selected) > 0:
            num_selected = len(selected)
            if num_selected > 1:
                inputs.message(
                    "info",
                    f"Multiple samples selected ({num_selected}). All will be opened for editing."
                )
        else:
            total_samples = len(ctx.view)
            inputs.message(
                "info",
                f"No samples selected. All {total_samples} images will be opened for editing."
            )

            # Add subfolder input when no samples are selected
            inputs.str(
                "subfolder",
                label="Dataset Subfolder",
                description="Subfolder within images/ (e.g., 'train', 'val'). Leave empty for root.",
                default="",
                required=False
            )

        return types.Property(inputs, view=types.View(label="Edit Label"))

    def execute(self, ctx):
        """Open label editor for the selected sample(s) or all samples if none selected"""

        # Get the selected sample(s) or all samples
        selected = ctx.selected
        subfolder = ctx.params.get("subfolder", "").strip()

        # Get all samples (either selected or all in view)
        samples = []
        base_path = None
        relative_images = []
        use_folder_mode = False

        if selected and len(selected) > 0:
            # Process selected samples
            for sample_id in selected:
                view = ctx.view.select(sample_id)
                sample = view.first()

                if sample is None:
                    continue

                image_path = sample.filepath

                # Extract base path from first image
                if base_path is None and "/images/" in image_path:
                    base_path = image_path.split("/images/")[0]

                # Get relative path
                if "/images/" in image_path and base_path:
                    relative_image = "images/" + image_path.split("/images/")[1]
                    relative_images.append(relative_image)
                    samples.append({
                        "filepath": image_path,
                        "filename": os.path.basename(image_path),
                        "relative": relative_image
                    })
        else:
            # No samples selected - use folder mode with subfolder
            use_folder_mode = True

            # Get base path from first sample
            first_sample = ctx.view.first()
            if first_sample:
                image_path = first_sample.filepath
                if "/images/" in image_path:
                    base_path = image_path.split("/images/")[0]

                    # Count samples for reporting
                    for sample in ctx.view:
                        samples.append({"filepath": sample.filepath})

        if len(samples) == 0:
            ctx.ops.notify("Could not load samples", variant="error")
            return {}

        # Get configuration from environment
        manager_port = os.environ.get("MANAGER_PORT", "3000")
        public_address = os.environ.get("PUBLIC_ADDRESS", "localhost")

        # Construct the label editor URL
        from urllib.parse import quote

        if use_folder_mode:
            # Folder mode: pass base path and subfolder instead of individual images
            folder_path = f"images/{subfolder}" if subfolder else "images"
            editor_url = f"http://{public_address}:{manager_port}/label-editor.html?base={quote(base_path)}&folder={quote(folder_path)}"

            ctx.ops.notify(
                f"Copy the URL below to open label editor for {len(samples)} images in folder '{folder_path}'",
                variant="success"
            )
        else:
            # Individual mode: pass comma-separated image list
            images_param = ",".join(relative_images)
            editor_url = f"http://{public_address}:{manager_port}/label-editor.html?base={quote(base_path)}&images={quote(images_param)}"

            # Notify user
            if len(samples) > 1:
                ctx.ops.notify(
                    f"Copy the URL below to open label editor for {len(samples)} images",
                    variant="success"
                )
            else:
                ctx.ops.notify(
                    f"Copy the URL below to open label editor for {samples[0]['filename']}",
                    variant="success"
                )

        # Return data
        first_filepath = samples[0]["filepath"]
        return {
            "editor_url": editor_url,
            "filename": f"{len(samples)} image(s)" if len(samples) > 1 else (samples[0].get("filename", os.path.basename(first_filepath))),
            "image_path": first_filepath,
            "label_path": first_filepath.replace("/images/", "/labels/").replace(".jpg", ".txt").replace(".jpeg", ".txt").replace(".png", ".txt"),
            "image_count": len(samples),
        }

    def resolve_output(self, ctx):
        outputs = types.Object()
        outputs.str("filename", label="File(s)", view=types.View(readonly=True))
        outputs.str(
            "editor_url",
            label="URL",
            description="Copy and paste in browser",
            view=types.View(readonly=True)
        )
        outputs.int("image_count", label="Image Count", view=types.View(readonly=True))
        outputs.str("image_path", label="First Image Path", view=types.View(readonly=True))
        outputs.str("label_path", label="First Label Path", view=types.View(readonly=True))
        return types.Property(outputs)


def register(p):
    """Register the plugin with FiftyOne"""
    p.register(OpenLabelEditor)
