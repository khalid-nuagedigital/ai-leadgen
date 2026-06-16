import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Header from './common/Header';
import Sidebar from './common/Sidebar';
import Dashboard from './components/Dashboard';
import PipelineView from './components/PipelineView';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import LeadFinder from './agents/LeadFinder';
import WebsiteAnalyzer from './agents/WebsiteAnalyzer';
import OfferGenerator from './agents/OfferGenerator';
import OutreachAgent from './agents/OutreachAgent';
import FollowUpAgent from './agents/FollowUpAgent';
import QualificationAgent from './agents/QualificationAgent';
import AppointmentSetter from './agents/AppointmentSetter';
import Login from './pages/Login';
import Register from './pages/Register';
import Pricing from './pages/Pricing';

// Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

// Main App Layout with Sidebar & Header
function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// Public Layout (no sidebar)
function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - No Sidebar */}
        <Route path="/login" element={
          <PublicLayout><Login /></PublicLayout>
        } />
        <Route path="/register" element={
          <PublicLayout><Register /></PublicLayout>
        } />
        <Route path="/pricing" element={
          <PublicLayout><Pricing /></PublicLayout>
        } />

        {/* Protected Routes - With Sidebar & Header */}
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/pipeline" element={
          <ProtectedRoute>
            <AppLayout><PipelineView /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <AppLayout><Analytics /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <AppLayout><Settings /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/agents/find" element={
          <ProtectedRoute>
            <AppLayout><LeadFinder /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/agents/analyze" element={
          <ProtectedRoute>
            <AppLayout><WebsiteAnalyzer /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/agents/offer" element={
          <ProtectedRoute>
            <AppLayout><OfferGenerator /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/agents/outreach" element={
          <ProtectedRoute>
            <AppLayout><OutreachAgent /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/agents/followup" element={
          <ProtectedRoute>
            <AppLayout><FollowUpAgent /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/agents/qualify" element={
          <ProtectedRoute>
            <AppLayout><QualificationAgent /></AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/agents/book" element={
          <ProtectedRoute>
            <AppLayout><AppointmentSetter /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}