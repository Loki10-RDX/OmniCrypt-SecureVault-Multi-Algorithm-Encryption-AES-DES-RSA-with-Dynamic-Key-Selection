import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, LogOut, ShieldAlert } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid #334155',
        }
      }} />
      
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              OmniCrypt
            </span>
          </Link>

          {user && (
            <div className="flex items-center gap-6">
              {user.role === 'ADMIN' && (
                <Link 
                  to="/admin" 
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    location.pathname === '/admin' ? 'text-rose-400' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                {user.email}
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      
      <footer className="border-t border-white/5 py-6 text-center text-slate-500 text-sm">
        <p>OmniCrypt SecureVault &copy; {new Date().getFullYear()} - Multi-Algorithm Encryption System</p>
      </footer>
    </div>
  );
};

export default Layout;
