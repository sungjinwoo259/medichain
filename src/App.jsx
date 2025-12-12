import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { BlockchainProvider } from './context/BlockchainContext.jsx'
import { AppLayout } from './layout/AppLayout.jsx'
import { Login } from './pages/Login.jsx'
import { Register } from './pages/Register.jsx'
import { Dashboard } from './pages/Dashboard.jsx'
import { AdminPanel } from './pages/AdminPanel.jsx'
import { ManufacturerPanel } from './pages/ManufacturerPanel.jsx'
import { DistributorPanel } from './pages/DistributorPanel.jsx'
import { PharmacyPanel } from './pages/PharmacyPanel.jsx'
import { ConsumerView } from './pages/ConsumerView.jsx'
import { VerifyDrug } from './pages/VerifyDrug.jsx'

function App() {
  return (
    <AuthProvider>
      <BlockchainProvider>
        <AppLayout>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/manufacturer" element={<ManufacturerPanel />} />
            <Route path="/distributor" element={<DistributorPanel />} />
            <Route path="/pharmacy" element={<PharmacyPanel />} />
            <Route path="/consumer" element={<ConsumerView />} />
            <Route path="/verify" element={<VerifyDrug />} />
          </Routes>
        </AppLayout>
      </BlockchainProvider>
    </AuthProvider>
  )
}

export default App
