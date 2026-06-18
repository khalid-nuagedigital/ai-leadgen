import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import Header from './common/Header';
import Sidebar from './common/Sidebar';
import VoiceAssistant from './components/VoiceAssistant';

// Main Components (6)
import Dashboard from './components/Dashboard';
import PipelineView from './components/PipelineView';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import LeadDetail from './components/LeadDetail';
import AdminDashboard from './components/AdminDashboard';
import EmailConfig from './components/EmailConfig';

// Core Agents (7)
import LeadFinder from './agents/LeadFinder';
import WebsiteAnalyzer from './agents/WebsiteAnalyzer';
import OfferGenerator from './agents/OfferGenerator';
import OutreachAgent from './agents/OutreachAgent';
import FollowUpAgent from './agents/FollowUpAgent';
import QualificationAgent from './agents/QualificationAgent';
import AppointmentSetter from './agents/AppointmentSetter';

// Extended Agents (13)
import ProposalBuilder from './agents/ProposalBuilder';
import ContentWriter from './agents/ContentWriter';
import CompetitorAnalyzer from './agents/CompetitorAnalyzer';
import ROICalculator from './agents/ROICalculator';
import SocialScheduler from './agents/SocialScheduler';
import ReviewManager from './agents/ReviewManager';
import ReferralGenerator from './agents/ReferralGenerator';
import InvoiceGenerator from './agents/InvoiceGenerator';
import EmailTemplateBuilder from './agents/EmailTemplateBuilder';
import OnboardingAgent from './agents/OnboardingAgent';
import ABTestAnalyzer from './agents/ABTestAnalyzer';
import MeetingNotes from './agents/MeetingNotes';
import ColdEmailAgent from './agents/ColdEmailAgent';
import LandingPageBuilder from './agents/LandingPageBuilder';
import ClientPortal from './agents/ClientPortal';

// Special Agents (1)
import VoiceCommandAgent from './agents/VoiceCommandAgent';

// Public Pages (3)
import Login from './pages/Login';
import Register from './pages/Register';
import Pricing from './pages/Pricing';

// ============ GUARDS ============
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}
function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.plan === 'free') return <Navigate to="/pricing" replace />;
  return children;
}

// ============ LAYOUTS ============
function AppLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
      <VoiceAssistant />
    </div>
  );
}
function PublicLayout({ children }) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}

// ============ ROUTES ============
const routes = [
  { path: '/login', element: <Login />, layout: 'public' },
  { path: '/register', element: <Register />, layout: 'public' },
  { path: '/pricing', element: <Pricing />, layout: 'public' },
  { path: '/', element: <Dashboard />, layout: 'app', guard: 'auth' },
  { path: '/admin', element: <AdminDashboard />, layout: 'app', guard: 'admin' },
  { path: '/admin/email-config', element: <EmailConfig />, layout: 'app', guard: 'admin' },
  { path: '/pipeline', element: <PipelineView />, layout: 'app', guard: 'auth' },
  { path: '/analytics', element: <Analytics />, layout: 'app', guard: 'auth' },
  { path: '/settings', element: <Settings />, layout: 'app', guard: 'auth' },
  { path: '/lead/:id', element: <LeadDetail />, layout: 'app', guard: 'auth' },
  { path: '/agents/find', element: <LeadFinder />, layout: 'app', guard: 'auth' },
  { path: '/agents/analyze', element: <WebsiteAnalyzer />, layout: 'app', guard: 'auth' },
  { path: '/agents/offer', element: <OfferGenerator />, layout: 'app', guard: 'auth' },
  { path: '/agents/outreach', element: <OutreachAgent />, layout: 'app', guard: 'auth' },
  { path: '/agents/followup', element: <FollowUpAgent />, layout: 'app', guard: 'auth' },
  { path: '/agents/qualify', element: <QualificationAgent />, layout: 'app', guard: 'auth' },
  { path: '/agents/book', element: <AppointmentSetter />, layout: 'app', guard: 'auth' },
  { path: '/agents/proposal', element: <ProposalBuilder />, layout: 'app', guard: 'auth' },
  { path: '/agents/content', element: <ContentWriter />, layout: 'app', guard: 'auth' },
  { path: '/agents/competitor', element: <CompetitorAnalyzer />, layout: 'app', guard: 'auth' },
  { path: '/agents/roi', element: <ROICalculator />, layout: 'app', guard: 'auth' },
  { path: '/agents/social', element: <SocialScheduler />, layout: 'app', guard: 'auth' },
  { path: '/agents/reviews', element: <ReviewManager />, layout: 'app', guard: 'auth' },
  { path: '/agents/referral', element: <ReferralGenerator />, layout: 'app', guard: 'auth' },
  { path: '/agents/invoice', element: <InvoiceGenerator />, layout: 'app', guard: 'auth' },
  { path: '/agents/templates', element: <EmailTemplateBuilder />, layout: 'app', guard: 'auth' },
  { path: '/agents/onboarding', element: <OnboardingAgent />, layout: 'app', guard: 'auth' },
  { path: '/agents/abtest', element: <ABTestAnalyzer />, layout: 'app', guard: 'auth' },
  { path: '/agents/meetings', element: <MeetingNotes />, layout: 'app', guard: 'auth' },
  { path: '/agents/coldemail', element: <ColdEmailAgent />, layout: 'app', guard: 'auth' },
  { path: '/agents/landing', element: <LandingPageBuilder />, layout: 'app', guard: 'auth' },
  { path: '/agents/portal', element: <ClientPortal />, layout: 'app', guard: 'auth' },
  { path: '/agents/voice', element: <VoiceCommandAgent />, layout: 'app', guard: 'auth' },
];

// ============ APP ============
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {routes.map(({ path, element, layout, guard }) => {
          let el = element;
          if (layout === 'app') el = <AppLayout>{el}</AppLayout>;
          if (layout === 'public') el = <PublicLayout>{el}</PublicLayout>;
          if (guard === 'auth') el = <ProtectedRoute>{el}</ProtectedRoute>;
          if (guard === 'admin') el = <AdminRoute>{el}</AdminRoute>;
          return <Route key={path} path={path} element={el} />;
        })}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </BrowserRouter>
  );
}