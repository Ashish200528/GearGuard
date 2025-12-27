import requests
import json

# Configuration
BASE_URL = 'http://localhost:5000/api'
# Credentials from your data.sql
EMAIL = 'admin@odoo.com'
PASSWORD = 'hash123'

def log(message, type="INFO"):
    print(f"[{type}] {message}")

def run_tests():
    session = requests.Session()
    token = None

    # ---------------------------------------------------------
    # 1. TEST LOGIN (POST /api/login)
    # ---------------------------------------------------------
    log("Testing Login...")
    login_payload = {
        "email": EMAIL,
        "password": PASSWORD
    }
    
    try:
        response = session.post(f"{BASE_URL}/login", json=login_payload)
        if response.status_code == 200:
            data = response.json()
            token = data.get('token')
            log(f"Login Successful! Token received: {token[:15]}...", "PASS")
        else:
            log(f"Login Failed: {response.text}", "FAIL")
            return
    except Exception as e:
        log(f"Connection Error: {e}", "FAIL")
        return

    # Add token to headers for subsequent requests
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }

    # ---------------------------------------------------------
    # 2. TEST DASHBOARD STATS (GET /api/dashboard/stats)
    # ---------------------------------------------------------
    log("Testing Dashboard Stats...")
    response = session.get(f"{BASE_URL}/dashboard/stats", headers=headers)
    if response.status_code == 200:
        log(f"Dashboard Data: {response.json()}", "PASS")
    else:
        log(f"Dashboard Failed: {response.status_code}", "FAIL")

    # ---------------------------------------------------------
    # 3. TEST GET STAGES (GET /api/stages)
    # ---------------------------------------------------------
    log("Testing Stages...")
    response = session.get(f"{BASE_URL}/stages", headers=headers)
    if response.status_code == 200:
        stages = response.json()
        log(f"Found {len(stages)} stages.", "PASS")
    else:
        log(f"Stages Failed: {response.status_code}", "FAIL")

    # ---------------------------------------------------------
    # 4. TEST CREATE REQUEST (POST /api/maintenance/requests)
    # ---------------------------------------------------------
    log("Testing Create Request...")
    new_request_payload = {
        "subject": "API Test Machine Breakdown",
        "description": "Created via Python Test Script",
        "request_type": "corrective",
        "priority": "high",
        "equipment_id": 1  # Assumes equipment ID 1 exists
    }
    
    request_id = None
    response = session.post(f"{BASE_URL}/maintenance/requests", json=new_request_payload, headers=headers)
    if response.status_code == 201:
        data = response.json()
        request_id = data.get('id')
        log(f"Request Created! ID: {request_id}", "PASS")
    else:
        log(f"Create Request Failed: {response.text}", "FAIL")

    # ---------------------------------------------------------
    # 5. TEST GET REQUESTS (GET /api/maintenance/requests)
    # ---------------------------------------------------------
    log("Testing Get All Requests...")
    response = session.get(f"{BASE_URL}/maintenance/requests", headers=headers)
    if response.status_code == 200:
        reqs = response.json()
        log(f"Retrieved {len(reqs)} requests.", "PASS")
    else:
        log(f"Get Requests Failed: {response.status_code}", "FAIL")

    # ---------------------------------------------------------
    # 6. TEST UPDATE REQUEST (PUT /api/maintenance/requests/<id>)
    # ---------------------------------------------------------
    if request_id:
        log(f"Testing Update Request {request_id}...")
        update_payload = {
            "priority": "critical",
            "kanban_state": "blocked"
        }
        response = session.put(f"{BASE_URL}/maintenance/requests/{request_id}", json=update_payload, headers=headers)
        if response.status_code == 200:
            log("Update Request Successful", "PASS")
        else:
            log(f"Update Request Failed: {response.status_code}", "FAIL")

    # ---------------------------------------------------------
    # 7. TEST EQUIPMENT (GET /api/equipment)
    # ---------------------------------------------------------
    log("Testing Equipment List...")
    response = session.get(f"{BASE_URL}/equipment", headers=headers)
    if response.status_code == 200:
        eqs = response.json()
        log(f"Found {len(eqs)} equipment items.", "PASS")
    else:
        log(f"Equipment List Failed: {response.status_code}", "FAIL")

if __name__ == "__main__":
    print("Starting API Tests on http://localhost:5000...")
    run_tests()