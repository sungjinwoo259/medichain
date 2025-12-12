// Firebase initialization and helper functions for MediChain
// Fill the config with your project values or environment variables.
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import {
  getFirestore,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// --- Auth & roles ---

// Register new user (creates account with pending role, except consumer which is auto-approved)
export async function registerUser({ email, password, name, wallet, role = 'consumer' }) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  const uid = cred.user.uid
  
  // Auto-approve consumer accounts, others require admin approval
  const isConsumer = role === 'consumer'
  const userRole = isConsumer ? 'consumer' : 'pending'
  const userStatus = isConsumer ? 'active' : 'pending'
  
  await setDoc(doc(db, 'users', uid), {
    uid,
    name,
    email,
    wallet: wallet || '',
    role: userRole,
    status: userStatus,
    createdAt: serverTimestamp(),
  })
  return uid
}

// Admin creates user with role (for admin panel)
export async function createUserRole({ email, password, name, role, wallet }) {
  // This assumes the current user has rights to create Firebase Auth users
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  const uid = cred.user.uid
  await setDoc(doc(db, 'users', uid), {
    uid,
    name,
    email,
    wallet: wallet || '',
    role,
    status: 'active',
    createdAt: serverTimestamp(),
  })
  return uid
}

// Admin assigns role to pending user
export async function assignUserRole(userId, role, wallet) {
  await updateDoc(doc(db, 'users', userId), {
    role,
    wallet: wallet || '',
    status: 'active',
    updatedAt: serverTimestamp(),
  })
}

// --- Batches ---

export async function addBatch(data) {
  const refDoc = await addDoc(collection(db, 'batches'), {
    ...data,
    createdAt: serverTimestamp(),
    status: 'Created',
  })
  return refDoc
}

export async function updateBatchStatus(batchDocId, partial) {
  await updateDoc(doc(db, 'batches', batchDocId), {
    ...partial,
    updatedAt: serverTimestamp(),
  })
}

export async function saveTransactionDetails(batchDocId, tx) {
  await updateBatchStatus(batchDocId, {
    onChainTxHash: tx.hash,
  })
}

// --- Prescriptions ---

export async function uploadPrescriptionFile(file, { batchId, pharmacyId, consumerId }) {
  const fileRef = ref(storage, `prescriptions/${batchId}/${Date.now()}-${file.name}`)
  await uploadBytes(fileRef, file)
  const url = await getDownloadURL(fileRef)

  const docRef = await addDoc(collection(db, 'prescriptions'), {
    batchId,
    pharmacyId,
    consumerId,
    storageURL: url,
    timestamp: serverTimestamp(),
  })

  return { url, prescriptionId: docRef.id }
}


