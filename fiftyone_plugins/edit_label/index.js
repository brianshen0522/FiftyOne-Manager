/**
 * FiftyOne Plugin: Edit Label - Client Side
 * Automatically opens the label editor in a new tab
 */

import { Operator, types } from "@fiftyone/operators";

class OpenLabelEditor extends Operator {
  get config() {
    return new types.OperatorConfig({
      name: "open_label_editor",
      label: "Edit Label in Tool",
      execute_as_generator: false,
    });
  }

  async execute({ hooks, params }) {
    // The Python operator will return the paths and port
    // We construct the URL client-side using the current browser location
    const result = await hooks.execute("edit_label/open_label_editor", params);

    if (result && result.image_path) {
      // Get current protocol and hostname from browser
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const managerPort = result.manager_port || "3000";

      // Construct the URL using current IP/hostname
      const editorUrl = `${protocol}//${hostname}:${managerPort}/label-editor?image=${encodeURIComponent(
        result.image_path
      )}&label=${encodeURIComponent(result.label_path)}`;

      // Open in new tab
      window.open(editorUrl, "_blank");

      // Show success notification
      hooks.notify({
        message: `Opening label editor for ${result.filename}`,
        variant: "success",
      });
    }
  }
}

export default OpenLabelEditor;
