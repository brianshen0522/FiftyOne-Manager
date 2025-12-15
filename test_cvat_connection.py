#!/usr/bin/env python3
"""
Test CVAT connection and credentials.

This script verifies that:
1. CVAT credentials are properly configured
2. FiftyOne can connect to the CVAT server
3. Authentication is successful
"""

import os
import sys

def test_cvat_connection():
    """Test CVAT connection and credentials."""

    print("=" * 60)
    print("CVAT Connection Test")
    print("=" * 60)

    # Check environment variables
    print("\n1. Checking environment variables...")

    cvat_url = os.getenv('FIFTYONE_CVAT_URL')
    cvat_username = os.getenv('FIFTYONE_CVAT_USERNAME')
    cvat_password = os.getenv('FIFTYONE_CVAT_PASSWORD')
    cvat_email = os.getenv('FIFTYONE_CVAT_EMAIL', '')

    if not cvat_url:
        print("   ✗ FIFTYONE_CVAT_URL not set")
        return False
    print(f"   ✓ CVAT URL: {cvat_url}")

    if not cvat_username:
        print("   ✗ FIFTYONE_CVAT_USERNAME not set")
        return False
    print(f"   ✓ CVAT Username: {cvat_username}")

    if not cvat_password:
        print("   ✗ FIFTYONE_CVAT_PASSWORD not set")
        return False
    print(f"   ✓ CVAT Password: {'*' * len(cvat_password)}")

    if cvat_email:
        print(f"   ✓ CVAT Email: {cvat_email}")

    # Test connection to CVAT
    print("\n2. Testing connection to CVAT server...")

    try:
        import fiftyone.utils.annotations as foua

        print(f"   Connecting to {cvat_url}...")
        api = foua.connect_to_api(
            backend="cvat",
            url=cvat_url,
            username=cvat_username,
            password=cvat_password
        )

        print("   ✓ Successfully connected to CVAT!")

        # Try to get server info
        print("\n3. Getting CVAT server information...")
        try:
            # Get tasks to verify we can make API calls
            response = api.get(api.tasks_url)
            if response.status_code == 200:
                tasks = response.json()
                task_count = tasks.get('count', 0) if isinstance(tasks, dict) else len(tasks)
                print(f"   ✓ API call successful")
                print(f"   ✓ Found {task_count} existing tasks on CVAT server")
            else:
                print(f"   ✗ API call failed with status code: {response.status_code}")
                return False
        except Exception as e:
            print(f"   ✗ Error getting server info: {e}")
            return False

        print("\n" + "=" * 60)
        print("✓ CVAT connection test PASSED!")
        print("=" * 60)
        print("\nYou can now use FiftyOne's annotation API to create CVAT tasks:")
        print("  view.annotate(anno_key, backend='cvat', ...)")
        print("\nSee CVAT_INTEGRATION.md for detailed usage examples.")

        return True

    except ImportError:
        print("   ✗ FiftyOne is not installed or not available")
        return False
    except Exception as e:
        print(f"   ✗ Connection failed: {e}")
        print("\nPossible issues:")
        print("  - CVAT server is not running or not accessible")
        print("  - Incorrect credentials")
        print("  - Network connectivity issues")
        return False

if __name__ == "__main__":
    success = test_cvat_connection()
    sys.exit(0 if success else 1)
