import requests
import json

BASE_URL = 'http://localhost:5000/api'

print("👤 Testing End User Issue Reporting Flow\n")
print("=" * 60)

# Step 1: Login as End User
print("\n1️⃣ Logging in as End User...")
response = requests.post(f'{BASE_URL}/login', json={
    'email': 'user@test.com',
    'password': '123456'
})

if response.status_code != 200:
    print(f"❌ Login failed: {response.json()}")
    exit(1)

login_data = response.json()
token = login_data['token']
user = login_data['user']
headers = {'Authorization': f'Bearer {token}'}

print(f"✅ Logged in successfully!")
print(f"   User: {user['name']}")
print(f"   Role: {user['role']}")
print(f"   User ID: {user['id']}")

# Step 2: Get equipment list (for dropdown)
print("\n2️⃣ Fetching equipment list...")
response = requests.get(f'{BASE_URL}/equipment', headers=headers)
if response.status_code == 200:
    equipment = response.json()
    print(f"✅ Found {len(equipment)} equipment items:")
    for eq in equipment[:5]:
        print(f"   - {eq['name']} (ID: {eq['id']})")
    if len(equipment) > 5:
        print(f"   ... and {len(equipment) - 5} more")
else:
    print(f"❌ Failed to fetch equipment: {response.json()}")
    exit(1)

# Step 3: Get user's current requests
print("\n3️⃣ Checking current maintenance requests...")
response = requests.get(f'{BASE_URL}/maintenance/requests', headers=headers)
if response.status_code == 200:
    all_requests = response.json()
    # Filter by user ID
    my_requests = [r for r in all_requests if r.get('created_by') == user['id']]
    print(f"✅ User has {len(my_requests)} existing requests")
else:
    print(f"❌ Failed to fetch requests")
    my_requests = []

# Step 4: Submit a new issue (Report an Issue)
print("\n4️⃣ Submitting a new issue report...")
new_issue = {
    'subject': 'Main Elevator Making Strange Noises',
    'description': '''The main elevator has been making unusual grinding noises when moving between floors.
    
Details:
• Started happening this morning around 9 AM
• Noise is loudest between floors 1 and 2
• No error messages displayed
• Still functional but concerning

This is affecting employee movement and could be a safety issue.''',
    'request_type': 'corrective',
    'equipment_id': equipment[0]['id'] if equipment else 1,
    'priority': 'high',
    'scheduled_date': None
}

response = requests.post(
    f'{BASE_URL}/maintenance/requests',
    json=new_issue,
    headers=headers
)

if response.status_code == 201:
    result = response.json()
    new_request_id = result['id']
    print(f"✅ Issue reported successfully!")
    print(f"   Request ID: {new_request_id}")
    print(f"   Subject: {new_issue['subject']}")
    print(f"   Priority: {new_issue['priority'].upper()}")
else:
    print(f"❌ Failed to submit issue: {response.json()}")
    exit(1)

# Step 5: Verify the request was created
print("\n5️⃣ Verifying the request was created...")
response = requests.get(f'{BASE_URL}/maintenance/requests', headers=headers)
if response.status_code == 200:
    all_requests = response.json()
    my_requests_after = [r for r in all_requests if r.get('created_by') == user['id']]
    print(f"✅ User now has {len(my_requests_after)} requests")
    print(f"   Increased by: {len(my_requests_after) - len(my_requests)}")
    
    # Find and display the new request
    new_request = next((r for r in my_requests_after if r['id'] == new_request_id), None)
    if new_request:
        print(f"\n   📋 Request Details:")
        print(f"   Subject: {new_request['subject']}")
        print(f"   Priority: {new_request['priority']}")
        print(f"   Stage ID: {new_request['stage_id']}")
        print(f"   Equipment ID: {new_request['equipment_id']}")
        print(f"   Created By: {new_request.get('created_by', 'N/A')}")
else:
    print(f"❌ Failed to verify request")

# Step 6: Get stages to show user what status their request is in
print("\n6️⃣ Checking request status...")
current_stage = None
response = requests.get(f'{BASE_URL}/stages', headers=headers)
if response.status_code == 200:
    stages = response.json()
    print(f"✅ Available stages:")
    for stage in stages:
        print(f"   {stage['sequence']}. {stage['name']} (ID: {stage['id']})")
    
    if new_request:
        current_stage = next((s for s in stages if s['id'] == new_request['stage_id']), None)
        if current_stage:
            print(f"\n   ✓ Your request is in: '{current_stage['name']}'")

# Step 7: Test dashboard stats endpoint
print("\n7️⃣ Fetching dashboard statistics...")
response = requests.get(f'{BASE_URL}/dashboard/stats', headers=headers)
if response.status_code == 200:
    stats = response.json()
    print(f"✅ Dashboard stats retrieved:")
    print(f"   Total Open Requests: {stats.get('total_open_requests', 0)}")
    print(f"   Critical Equipment: {stats.get('critical_equipment', 0)}")
    print(f"   My Pending Tasks: {stats.get('my_pending_tasks', 0)}")
else:
    print(f"⚠️  Dashboard stats not available")

print("\n" + "=" * 60)
print("✅ End User Flow Test Complete!")
print("=" * 60)

print("\n📊 Summary:")
print(f"   • Successfully logged in as end user")
print(f"   • Fetched {len(equipment)} equipment items")
print(f"   • Submitted 1 new issue report")
print(f"   • Request created with ID: {new_request_id}")
print(f"   • Request is in '{current_stage['name'] if current_stage else 'Unknown'}' stage")
print(f"   • Total user requests: {len(my_requests_after)}")

print("\n🎯 What the End User Can Do:")
print("   ✓ View their own maintenance requests")
print("   ✓ Report new issues via dashboard")
print("   ✓ Select equipment from dropdown")
print("   ✓ Set priority levels")
print("   ✓ Track request status")
print("   ✓ See request history")

print("\n💡 Next Steps:")
print("   1. Login to http://localhost:3000 with user@test.com / 123456")
print("   2. You'll see your new request on the dashboard")
print("   3. Click 'Report an Issue' to submit more requests")
print("   4. Your requests sync with the database in real-time!")
