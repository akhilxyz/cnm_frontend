import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { Dashboard } from './pages/Dashboard';
import { WhatsApp } from './pages/WhatsApp';
import { Campaigns } from './pages/Campaigns';
import { Subscription } from './pages/Subscription';
import { Share } from './pages/Share';
import { Settings } from './pages/Settings';
import { Toaster } from 'react-hot-toast';
import NewLeads from './components/whatsapp/NewLeadsTable';
import { ConnectPlatformsModal } from './components/modals/ConnectPlatformsModal';
import  Vendors  from './pages/Vendors';
import { useConnectPlatformModal } from './store/useConnectPlatformModal';

type Page = 'dashboard' | 'vendors' |  'leads' | 'whatsapp' | 'contacts' | 'groups' | 'templates' | 'campaigns' | 'subscription' | 'share' | 'settings';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [authPage, setAuthPage] = useState<'login' | 'signup' | 'forgot-password'>('login');
  // const [open, setOpen] = useState(false);

    const { open, setOpen } = useConnectPlatformModal();



  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/forgot-password') {
      setAuthPage('forgot-password');
    } else if (path === '/signup') {
      setAuthPage('signup');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authPage === 'forgot-password') {
      return <ForgotPassword />;
    }
    if (authPage === 'signup') {
      return <SignUp />;
    }
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'vendors':
       return user?.role === 'ADMIN' ? <Vendors /> : <Dashboard />; // redirect or fallback
      case 'whatsapp':
      case 'contacts':
      case 'groups':
      case 'templates':
        return <WhatsApp />;
      case 'campaigns':
        return <Campaigns />;
      case 'subscription':
        return <Subscription />;
      case 'share':
        return <Share currentPage={currentPage} />;
      case 'leads':
        return <NewLeads />;
      case 'settings':
        return <Settings />;
      /* case 'whatsapp-setup-guide':
        return <WhatsappSetupGuide />; */
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header setOpen={setOpen}  currentPage={currentPage} setCurrentPage={(page :any) => setCurrentPage(page as Page)}/>
      <ConnectPlatformsModal open={open} onClose={() => setOpen(false)} />
      <Toaster
        position="top-center"
        reverseOrder={false}
      />
      <div className="flex flex-1">
        <Sidebar currentPage={currentPage} onNavigate={(page) => setCurrentPage(page as Page)} />
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
          <Footer />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
