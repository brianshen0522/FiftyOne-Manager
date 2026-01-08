#!/bin/bash
# Test CVAT configuration for a running FiftyOne instance

if [ -z "$1" ]; then
    echo "Usage: $0 <instance-name>"
    echo ""
    echo "Example: $0 test"
    echo ""
    echo "This script tests if CVAT credentials are properly configured"
    echo "for a running FiftyOne instance managed by PM2."
    exit 1
fi

INSTANCE_NAME="$1"

echo "============================================================"
echo "CVAT Configuration Test for Instance: $INSTANCE_NAME"
echo "============================================================"

# Check if PM2 process exists
if ! pm2 describe "$INSTANCE_NAME" &>/dev/null; then
    echo "Error: Instance '$INSTANCE_NAME' not found in PM2"
    echo ""
    echo "Available instances:"
    pm2 list
    exit 1
fi

# Get environment variables from PM2 process
echo ""
echo "Checking CVAT environment variables for instance '$INSTANCE_NAME'..."
echo ""

pm2 env 0 2>/dev/null | grep -E "FIFTYONE_CVAT|CVAT_" | while read line; do
    # Hide password
    if echo "$line" | grep -q "PASSWORD"; then
        key=$(echo "$line" | cut -d: -f1)
        echo "   ✓ $key: ********"
    else
        echo "   ✓ $line"
    fi
done

echo ""
echo "============================================================"
echo "Configuration Status"
echo "============================================================"

if pm2 env 0 2>/dev/null | grep -q "FIFTYONE_CVAT_URL"; then
    echo "✓ CVAT credentials are configured for this instance"
    echo ""
    echo "You can now use FiftyOne's annotation API in Python:"
    echo ""
    echo "  import fiftyone as fo"
    echo "  dataset = fo.load_dataset('your-dataset')"
    echo "  view = dataset.take(10)"
    echo "  view.annotate('anno_key', backend='cvat', ...)"
    echo ""
    echo "See CVAT_INTEGRATION.md for detailed examples."
else
    echo "✗ CVAT credentials NOT configured for this instance"
    echo ""
    echo "To enable CVAT sync:"
    echo "1. Edit the instance in FiftyOne Manager UI"
    echo "2. Check the 'CVAT Sync' checkbox"
    echo "3. Save and restart the instance"
fi

echo ""
