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
            inputs.message(
                "info",
                "Please select a sample to edit its labels."
            )

        return types.Property(inputs, view=types.View(label="Edit Label"))

    def execute(self, ctx):
        """Open label editor for the selected sample(s)"""

        # Get the selected sample(s)
        selected = ctx.selected
        if not selected or len(selected) == 0:
            ctx.ops.notify("Please select a sample first", variant="error")
            return {}

        # Get all selected samples
        samples = []
        base_path = None
        relative_images = []

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

        if len(samples) == 0:
            ctx.ops.notify("Could not load samples", variant="error")
            return {}

        # Get configuration from environment
        manager_port = os.environ.get("MANAGER_PORT", "3000")
        public_address = os.environ.get("PUBLIC_ADDRESS", "localhost")

        # Construct the label editor URL with multiple images
        from urllib.parse import quote

        # For multiple images, pass them as comma-separated list
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
        return {
            "editor_url": editor_url,
            "filename": f"{len(samples)} image(s)" if len(samples) > 1 else samples[0]["filename"],
            "image_path": samples[0]["filepath"],
            "label_path": samples[0]["filepath"].replace("/images/", "/labels/").replace(".jpg", ".txt").replace(".jpeg", ".txt").replace(".png", ".txt"),
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
