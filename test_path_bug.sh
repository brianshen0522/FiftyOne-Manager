#!/bin/bash
# Test script to verify the dataset path truncation bug is fixed

API_URL="http://localhost:5000/api/instances/test"

echo "======================================================================"
echo "Testing Dataset Path Preservation Bug Fix"
echo "======================================================================"
echo ""

# Get initial state
echo "1. Getting initial instance state..."
INITIAL_PATH=$(curl -s "$API_URL" | python3 -c "import json,sys; print(json.load(sys.stdin)['datasetPath'])")
echo "   Initial path: $INITIAL_PATH"
echo ""

# Simulate editing the instance without changing the dataset path
# This is what happens when you open edit modal and save without changes
echo "2. Simulating edit without changing dataset path..."
echo "   (This would previously truncate the path)"

# Update with same path (simulating a save without changes to path)
RESULT=$(curl -s -X PUT "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"datasetPath\": \"$INITIAL_PATH\"}")

NEW_PATH=$(echo "$RESULT" | python3 -c "import json,sys; print(json.load(sys.stdin)['datasetPath'])")
echo "   Path after save: $NEW_PATH"
echo ""

# Check if path was preserved
echo "3. Verification:"
if [ "$INITIAL_PATH" = "$NEW_PATH" ]; then
    echo "   ✓ SUCCESS: Path preserved correctly!"
    echo "   ✓ Initial: $INITIAL_PATH"
    echo "   ✓ After:   $NEW_PATH"
    echo ""
    echo "======================================================================"
    echo "Bug Fix Verified: Dataset path is preserved when saving instance"
    echo "======================================================================"
    exit 0
else
    echo "   ✗ FAILURE: Path was changed!"
    echo "   ✗ Initial: $INITIAL_PATH"
    echo "   ✗ After:   $NEW_PATH"
    echo ""
    echo "======================================================================"
    echo "Bug Still Present: Path truncation detected"
    echo "======================================================================"
    exit 1
fi
