import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/shared/Navbar';
import ProtectedRoute from './components/shared/ProtectedRoute';

import Home from './pages/Home';
import Marketplace from './pages/Marketplace';
import MitraProfile from './pages/MitraProfile';
import TransaksiBaru from './pages/TransaksiBaru';
import Chat from './pages/Chat';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterUser from './pages/RegisterUser';
import RegisterMitra from './pages/RegisterMitra';
import DashboardUser from './pages/DashboardUser';
import DashboardMitra from './pages/DashboardMitra';
import PengaturanMitra from './pages/PengaturanMitra';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
          <Navbar />
          
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/mitra/:id" element={<MitraProfile />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register/user" element={<RegisterUser />} />
              <Route path="/register/mitra" element={<RegisterMitra />} />
              
              {/* Protected Routes (Semua user login) */}
              <Route element={<ProtectedRoute />}>
                {/* Dashboard Khusus User */}
                <Route element={<ProtectedRoute allowedRoles={['user']} />}>
                  <Route path="/dashboard/user" element={<DashboardUser />} />
                  <Route path="/transaksi/baru" element={<TransaksiBaru />} />
                </Route>

                {/* Dashboard Khusus Mitra */}
                <Route element={<ProtectedRoute allowedRoles={['mitra']} />}>
                  <Route path="/dashboard/mitra" element={<DashboardMitra />} />
                  <Route path="/pengaturan/mitra" element={<PengaturanMitra />} />
                </Route>

                {/* Khusus Admin */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />
                </Route>

                {/* Shared User & Mitra */}
                <Route element={<ProtectedRoute allowedRoles={['user', 'mitra', 'admin']} />}>
                  <Route path="/chat/:chatId" element={<Chat />} />
                </Route>
              </Route>
            </Routes>
          </main>

          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#333',
                color: '#fff',
              },
              success: {
                style: { background: '#16a34a' },
              },
              error: {
                style: { background: '#dc2626' },
              },
            }} 
          />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
