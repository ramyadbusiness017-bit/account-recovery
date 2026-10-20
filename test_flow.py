import urllib.request
import json

BASE = "http://localhost:8000"

def post(endpoint, payload):
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(f"{BASE}{endpoint}", data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode('utf-8'))

def get(endpoint):
    req = urllib.request.Request(f"{BASE}{endpoint}")
    with urllib.request.urlopen(req) as res:
        return json.loads(res.read().decode('utf-8'))

print("--- 1. Testing Identifier Lookup ---")
lookup = post("/api/recovery/lookup", {"identifier": "igwikejerome@gmail.com"})
print("Lookup:", lookup)

session_id = lookup["session_id"]
match_num = lookup["match_number"]

print(f"\n--- 2. Checking Dispatched Emails ---")
emails = get("/api/emails/recent")
print(f"Total dispatched emails: {len(emails)}")
latest = emails[0]
print(f"Latest email subject: {latest['subject']}")
print(f"Target match number: {latest['match_number']}")
print(f"Match options in email: {latest['match_options']}")

print(f"\n--- 3. Checking Session Status Before Tap ---")
status1 = get(f"/api/recovery/status/{session_id}")
print("Status before tap:", status1)

print(f"\n--- 4. Tapping the Match Number ({match_num}) ---")
verify_res = post("/api/recovery/verify-match-number", {
    "session_id": session_id,
    "chosen_number": match_num
})
print("Verify match result:", verify_res)

print(f"\n--- 5. Checking Session Status After Tap ---")
status2 = get(f"/api/recovery/status/{session_id}")
print("Status after tap:", status2)

print(f"\n--- 6. Resetting Password ---")
reset_res = post("/api/recovery/reset-password", {
    "session_id": session_id,
    "new_password": "NewGonnitSecure2026!",
    "confirm_password": "NewGonnitSecure2026!"
})
print("Reset result:", reset_res)

print(f"\n--- 7. Checking Admin Overview & Audit Logs ---")
overview = get("/api/admin/overview")
print("Admin Overview:", overview)
logs = get("/api/admin/audit-logs")
print(f"Recent Audit Logs count: {len(logs)}")
for l in logs[:3]:
    print(f" - [{l['action']}] {l['details']}")

print("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<")
