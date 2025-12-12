## MediChain – Prescription Drug Traceability (Sepolia + Firebase)

### Setup

1. **Install dependencies**

```bash
npm install
```

2. **Configure environment**

Create a `.env` file in the project root with:

```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_MEDICHAIN_ADDRESS=0xYourDeployedMediChainAddressOnSepolia

SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
PRIVATE_KEY=your_sepolia_deployer_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### Smart Contract

Compile and deploy MediChain to Sepolia:

```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

Copy the deployed address into `VITE_MEDICHAIN_ADDRESS` in `.env`.

### Frontend

Run the Vite React app:

```bash
npm run dev
```

### First Admin Setup

**⚠️ IMPORTANT:** Since all new registrations create users with `pending` role, you must create the first admin manually via Firebase Console.

**Quick Steps:**
1. Go to Firebase Console → Authentication → Users → Add user
2. Create user with email/password
3. Copy the User UID
4. Go to Firestore → `users` collection → Add document
5. Set Document ID = User UID
6. Add fields: `uid`, `name`, `email`, `role: "admin"`, `status: "active"`, `createdAt`

**📖 For detailed instructions, see `ADMIN_SETUP.md`**

### User Management

- **Admin**: Login and go to Admin Panel to assign roles to pending users or create new users
- **Pending Users**: Users who register will have `pending` role until admin assigns them a role
- **Role Assignment**: Admin can assign roles (Manufacturer, Distributor, Pharmacy, Consumer) to pending users

Then:

- Manufacturer: create batches and generate QR codes.
- Distributor: scan QR, receive batches, and update shipment.
- Pharmacy: scan, receive, upload prescriptions, and link on-chain.
- Consumer / Verify: scan QR to see full on-chain history.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
