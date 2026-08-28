import urllib.request
import json
import time

BASE_URL = "http://localhost:8000"

def run_demo_scenario():
    print("--- Starting PROVENANT Demo Seed Script ---")
    
    # 1. Reset state
    req = urllib.request.Request(f"{BASE_URL}/api/reset", method="POST")
    with urllib.request.urlopen(req) as resp:
        print(f"Reset Response: {resp.read().decode('utf-8')}")
        
    time.sleep(1)
    
    # 2. Inject 3 failures to trigger Outer Loop research
    for i in range(3):
        print(f"\n[Step {i+1}] Injecting failure event #{i+1}...")
        req = urllib.request.Request(f"{BASE_URL}/api/demo/inject-failure", method="POST")
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f"Result: {data.get('status')}")
            if data.get("experiment"):
                exp_id = data["experiment"]["experiment_id"]
                print(f"[!] RESEARCH TRIGGER FIRED! Created Experiment: {exp_id}")
                
                # 3. Commit to Vault
                time.sleep(1)
                print(f"\n[Step 4] Committing Experiment {exp_id} to Hardware Vault...")
                commit_data = json.dumps({"experiment_id": exp_id, "lock_duration_sec": 0}).encode('utf-8')
                commit_req = urllib.request.Request(
                    f"{BASE_URL}/vault/commit",
                    data=commit_data,
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )
                with urllib.request.urlopen(commit_req) as c_resp:
                    print(f"Vault Commit Response: {c_resp.read().decode('utf-8')}")
                    
                # 4. Reveal & Validate
                time.sleep(1)
                print(f"\n[Step 5] Revealing & Validating Experiment {exp_id}...")
                reveal_req = urllib.request.Request(f"{BASE_URL}/vault/reveal/{exp_id}", method="POST")
                with urllib.request.urlopen(reveal_req) as r_resp:
                    print(f"Reveal & Promotion Response: {r_resp.read().decode('utf-8')}")
                    
        time.sleep(0.5)

if __name__ == "__main__":
    run_demo_scenario()
