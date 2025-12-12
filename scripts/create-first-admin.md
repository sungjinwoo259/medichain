# Script to Create First Admin (Manual Instructions)

Since Firebase Admin SDK requires server-side setup, here's a manual process you can follow:

## Quick Setup Steps

1. **Open Firebase Console**: https://console.firebase.google.com/
2. **Select Project**: medichain-8f369
3. **Create Auth User**:
   - Go to Authentication → Users → Add user
   - Email: `admin@medichain.com`
   - Password: `Admin123!` (or your secure password)
   - Copy the User UID

4. **Create Firestore Document**:
   - Go to Firestore Database
   - Click `users` collection (create if needed)
   - Add document with Document ID = User UID
   - Add fields:
     ```
     uid: (the User UID)
     name: "Admin User"
     email: "admin@medichain.com"
     wallet: "" (can add later)
     role: "admin"
     status: "active"
     createdAt: (current timestamp)
     ```

5. **Login**: Use the email and password you created

That's it! You now have admin access.

