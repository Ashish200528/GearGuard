import requests
import json

BASE_URL = 'http://localhost:5000/api'

# Test credentials
email = 'admin@test.com'
password = '123456'

print("🔧 Testing Equipment CRUD Operations\n")

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

# Step 2: Get current equipment count
print("2️⃣ Getting current equipment...")
response = requests.get(f'{BASE_URL}/equipment', headers=headers)
if response.status_code == 200:
    equipment_before = response.json()
    print(f"✅ Current equipment count: {len(equipment_before)}\n")
else:
    print(f"❌ Failed to get equipment: {response.json()}")
    exit(1)

# Step 3: Create new equipment
print("3️⃣ Creating new equipment...")
new_equipment_data = {
    'name': 'Test Equipment',
    'serial_number': 'TEST-12345',
    'category_id': 1,
    'maintenance_team_id': 1,
    'technician_user_id': 2,
    'company_id': 1,
    'location': 'Test Lab',
    'health_percentage': 95
}

response = requests.post(f'{BASE_URL}/equipment', 
                        json=new_equipment_data,
                        headers=headers)

if response.status_code == 201:
    result = response.json()
    new_equipment_id = result['id']
    print(f"✅ Equipment created successfully! ID: {new_equipment_id}\n")
else:
    print(f"❌ Failed to create equipment: {response.json()}")
    exit(1)

# Step 4: Verify equipment was added
print("4️⃣ Verifying equipment was added...")
response = requests.get(f'{BASE_URL}/equipment', headers=headers)
if response.status_code == 200:
    equipment_after = response.json()
    print(f"✅ Equipment count after creation: {len(equipment_after)}")
    print(f"   Increased by: {len(equipment_after) - len(equipment_before)}\n")
else:
    print(f"❌ Failed to verify: {response.json()}")

# Step 5: Update the equipment
print("5️⃣ Updating equipment...")
update_data = {
    'name': 'Updated Test Equipment',
    'health_percentage': 85,
    'location': 'Main Workshop'
}

response = requests.put(f'{BASE_URL}/equipment/{new_equipment_id}',
                       json=update_data,
                       headers=headers)

if response.status_code == 200:
    print(f"✅ Equipment updated successfully!\n")
else:
    print(f"❌ Failed to update equipment: {response.json()}")

# Step 6: Get updated equipment details
print("6️⃣ Getting updated equipment details...")
response = requests.get(f'{BASE_URL}/equipment/{new_equipment_id}', headers=headers)
if response.status_code == 200:
    equipment_details = response.json()
    print(f"✅ Equipment details:")
    print(f"   Name: {equipment_details['name']}")
    print(f"   Location: {equipment_details['location']}")
    print(f"   Health: {equipment_details['health']}%\n")
else:
    print(f"❌ Failed to get details: {response.json()}")

# Step 7: Delete the equipment
print("7️⃣ Deleting test equipment...")
response = requests.delete(f'{BASE_URL}/equipment/{new_equipment_id}',
                          headers=headers)

if response.status_code == 200:
    print(f"✅ Equipment deleted successfully!\n")
else:
    print(f"❌ Failed to delete equipment: {response.json()}")

# Step 8: Verify deletion
print("8️⃣ Verifying deletion...")
response = requests.get(f'{BASE_URL}/equipment', headers=headers)
if response.status_code == 200:
    equipment_final = response.json()
    print(f"✅ Final equipment count: {len(equipment_final)}")
    print(f"   Back to original count: {len(equipment_final) == len(equipment_before)}\n")
else:
    print(f"❌ Failed to verify deletion: {response.json()}")

print("=" * 50)
print("✅ All Equipment CRUD operations completed!")
print("=" * 50)
