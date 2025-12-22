import os
import sys
from label_studio_sdk import Client

# Try to load .env if python-dotenv is available
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

def test_connection():
    print("=" * 60)
    print("Label Studio Connection Test (Label Studio 連接測試)")
    print("=" * 60)

    url = os.getenv("LABELSTUDIO_URL")
    api_key = os.getenv("LABELSTUDIO_API_KEY")

    if not url:
        # Fallback to hardcoded if not in env (matching user's potential previous setup, or just prompt)
        print("✗ LABELSTUDIO_URL not found in environment variables (未在環境變數中找到)")
        print("  Please check your .env file (請檢查您的 .env 文件)")
        return False
        
    if not api_key:
        print("✗ LABELSTUDIO_API_KEY not found in environment variables (未在環境變數中找到)")
        return False

    print(f"URL: {url}")
    print(f"API Key: {'*' * 4}...") # Hide key

    try:
        client = Client(url=url, api_key=api_key)
        projects = client.get_projects()
        print(f"✓ Connection successful! Found {len(projects)} projects (連接成功！找到 {len(projects)} 個項目)")
        for project in projects:
            # Handle different SDK versions or response structures
            if hasattr(project, 'get_params'):
                title = project.get_params().get('title')
            else:
                title = getattr(project, 'title', 'Unknown')
            print(f"  - {title}")
        return True
    except Exception as e:
        print(f"✗ Connection failed (連接失敗): {e}")
        return False

if __name__ == "__main__":
    if test_connection():
        sys.exit(0)
    else:
        sys.exit(1)