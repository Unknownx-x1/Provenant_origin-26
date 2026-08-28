import urllib.request

def reset():
    req = urllib.request.Request("http://localhost:8000/api/reset", method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Reset: {resp.read().decode('utf-8')}")
    except Exception as e:
        print(f"Reset error: {e}")

if __name__ == "__main__":
    reset()
