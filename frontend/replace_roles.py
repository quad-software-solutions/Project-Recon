import re

with open('src/domains/user/shared/ui/AdminDashboard.tsx', 'r') as f:
    content = f.read()

# Read new RolesPermissions
with open('scratch_roles.tsx', 'r') as f:
    new_roles = f.read()

# Replace the old RolesPermissions
# Find start of function RolesPermissions()
start_idx = content.find('function RolesPermissions() {')

# Find the next function, which is function ContentModeration()
end_idx = content.find('function ContentModeration() {')

if start_idx != -1 and end_idx != -1:
    new_content = content[:start_idx] + new_roles + '\n' + content[end_idx:]
    with open('src/domains/user/shared/ui/AdminDashboard.tsx', 'w') as f:
        f.write(new_content)
    print("Successfully replaced RolesPermissions")
else:
    print("Could not find start or end index")
