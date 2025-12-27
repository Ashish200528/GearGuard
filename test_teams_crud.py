import requests
import json

BASE_URL = 'http://localhost:5000/api'

# Test credentials
email = 'admin@test.com'
password = '123456'

print("👥 Testing Teams CRUD Operations\n")

# Step 1: Login
print("1️⃣ Logging in...")
response = requests.post(f'{BASE_URL}/login', json={
    'email': email,
    'password': password
})

if response.status_code != 200:
    print(f"❌ Login failed: {response.json()}")
    exit(1)

token = response.json()['token']
headers = {'Authorization': f'Bearer {token}'}
print(f"✅ Logged in successfully\n")

# Step 2: Get current teams
print("2️⃣ Getting current teams...")
response = requests.get(f'{BASE_URL}/teams', headers=headers)
if response.status_code == 200:
    teams_before = response.json()
    print(f"✅ Current teams count: {len(teams_before)}")
    for team in teams_before:
        print(f"   - {team['name']} (ID: {team['id']})")
    print()
else:
    print(f"❌ Failed to get teams: {response.json()}")
    exit(1)

# Step 3: Create new team
print("3️⃣ Creating new team...")
new_team_data = {
    'name': 'External Support Team',
    'company_id': 1
}

response = requests.post(f'{BASE_URL}/teams', 
                        json=new_team_data,
                        headers=headers)

if response.status_code == 201:
    result = response.json()
    new_team_id = result['id']
    print(f"✅ Team created successfully! ID: {new_team_id}\n")
else:
    print(f"❌ Failed to create team: {response.json()}")
    exit(1)

# Step 4: Verify team was added
print("4️⃣ Verifying team was added...")
response = requests.get(f'{BASE_URL}/teams', headers=headers)
if response.status_code == 200:
    teams_after = response.json()
    print(f"✅ Teams count after creation: {len(teams_after)}")
    print(f"   Increased by: {len(teams_after) - len(teams_before)}\n")
else:
    print(f"❌ Failed to verify: {response.json()}")

# Step 5: Update the team
print("5️⃣ Updating team...")
update_data = {
    'name': 'Updated External Support Team'
}

response = requests.put(f'{BASE_URL}/teams/{new_team_id}',
                       json=update_data,
                       headers=headers)

if response.status_code == 200:
    print(f"✅ Team updated successfully!\n")
else:
    print(f"❌ Failed to update team: {response.json()}")

# Step 6: Get updated team details
print("6️⃣ Getting updated team details...")
response = requests.get(f'{BASE_URL}/teams', headers=headers)
if response.status_code == 200:
    teams = response.json()
    updated_team = next((t for t in teams if t['id'] == new_team_id), None)
    if updated_team:
        print(f"✅ Team details:")
        print(f"   Name: {updated_team['name']}")
        print(f"   Company ID: {updated_team['company_id']}\n")
    else:
        print(f"❌ Could not find updated team")
else:
    print(f"❌ Failed to get details: {response.json()}")

# Step 7: Delete the team
print("7️⃣ Deleting test team...")
response = requests.delete(f'{BASE_URL}/teams/{new_team_id}',
                          headers=headers)

if response.status_code == 200:
    print(f"✅ Team deleted successfully!\n")
else:
    print(f"❌ Failed to delete team: {response.json()}")

# Step 8: Verify deletion
print("8️⃣ Verifying deletion...")
response = requests.get(f'{BASE_URL}/teams', headers=headers)
if response.status_code == 200:
    teams_final = response.json()
    print(f"✅ Final teams count: {len(teams_final)}")
    print(f"   Back to original count: {len(teams_final) == len(teams_before)}\n")
else:
    print(f"❌ Failed to verify deletion: {response.json()}")

print("=" * 50)
print("✅ All Teams CRUD operations completed!")
print("=" * 50)
