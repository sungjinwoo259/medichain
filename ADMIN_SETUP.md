# Creating the First Admin User

Since all new registrations create users with `pending` role, you need to create the first admin user manually. Here are the methods:

## Method 1: Firebase Console (Recommended for First Admin)

This is the easiest way to create your first admin user.

### Step 1: Create Authentication User

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **medichain-8f369**
3. Navigate to **Authentication** → **Users**
4. Click **"Add user"** button
5. Enter:
   - **Email**: `admin@medichain.com` (or your preferred admin email)
   - **Password**: Create a strong password (min. 6 characters)
6. Click **"Add user"**
7. **Copy the User UID** that appears (you'll need this in the next step)

### Step 2: Create Firestore User Document

1. In Firebase Console, go to **Firestore Database**
2. Click on the **`users`** collection (create it if it doesn't exist)
3. Click **"Add document"**
4. Set the **Document ID** to the **User UID** you copied in Step 1
5. Add the following fields:

| Field | Type | Value |
|-------|------|-------|
| `uid` | string | (The User UID from Step 1) |
| `name` | string | Admin User |
| `email` | string | admin@medichain.com |
| `wallet` | string | 0xYourMetaMaskAddress (optional, can add later) |
| `role` | string | **admin** |
| `status` | string | **active** |
| `createdAt` | timestamp | (Click the timestamp icon to set current time) |

6. Click **"Save"**

### Step 3: Login to MediChain

1. Start your app: `npm run dev`
2. Go to `http://localhost:5173/login`
3. Login with:
   - **Email**: `admin@medichain.com`
   - **Password**: (the password you set)
4. You should now have full admin access!

---

## Method 2: Using Admin Panel (After First Admin Exists)

Once you have your first admin, you can create additional admins or users through the Admin Panel:

1. Login as admin
2. Go to **Admin Panel**
3. Use the **"Create New User"** form
4. Select **"Admin"** from the role dropdown
5. Fill in all required fields
6. Click **"Create User"**

---

## Method 3: Direct Firestore Update (For Existing Users)

If you already have a registered user and want to make them an admin:

1. Go to Firebase Console → **Firestore Database** → **`users`** collection
2. Find the user document (by their email or UID)
3. Click on the document
4. Edit the `role` field: Change from `pending` to `admin`
5. Edit the `status` field: Change from `pending` to `active`
6. Click **"Update"**

The user can now login and will have admin access.

---

## Method 4: Using Firebase Admin SDK (Advanced)

If you have Firebase Admin SDK set up, you can create an admin programmatically:

```javascript
// This would be a server-side script
const admin = require('firebase-admin')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore } = require('firebase-admin/firestore')

// Initialize admin SDK
admin.initializeApp({
  // Your Firebase config
})

const auth = getAuth()
const db = getFirestore()

async function createAdmin() {
  // Create auth user
  const user = await auth.createUser({
    email: 'admin@medichain.com',
    password: 'YourSecurePassword123!',
    displayName: 'Admin User'
  })

  // Create Firestore document
  await db.collection('users').doc(user.uid).set({
    uid: user.uid,
    name: 'Admin User',
    email: 'admin@medichain.com',
    wallet: '',
    role: 'admin',
    status: 'active',
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  })

  console.log('Admin created:', user.uid)
}
```

---

## Quick Reference: Admin User Document Structure

```json
{
  "uid": "firebase-auth-uid-here",
  "name": "Admin User",
  "email": "admin@medichain.com",
  "wallet": "0xYourMetaMaskAddress",
  "role": "admin",
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

---

## Troubleshooting

### "Access denied. Admin role required"
- Make sure the user document in Firestore has `role: "admin"` and `status: "active"`
- Refresh the page after updating Firestore
- Logout and login again

### "User not found"
- Verify the User UID matches the Firestore document ID
- Check that the document exists in the `users` collection

### Can't see Admin Panel in sidebar
- Verify `role` field is exactly `"admin"` (case-sensitive)
- Check that `status` is `"active"` (not `"pending"`)

---

## Security Notes

⚠️ **Important:**
- Keep admin credentials secure
- Use strong passwords (min. 12 characters recommended)
- Don't share admin accounts
- Consider using 2FA for admin accounts (if available)
- Regularly audit admin users in Firestore

---

## Next Steps After Creating Admin

1. **Login** as admin
2. **Go to Admin Panel** → You'll see any pending user registrations
3. **Assign roles** to pending users (Manufacturer, Distributor, Pharmacy, Consumer)
4. **Create additional users** if needed via Admin Panel
5. **Start using the system** with your assigned users

