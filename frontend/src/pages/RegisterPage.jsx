import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, Loader2, ArrowRight, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enableMfa, setEnableMfa] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // MFA Setup State
  const [qrCode, setQrCode] = useState('');
  const [isSettingUpMfa, setIsSettingUpMfa] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await register(email, password, enableMfa);
      
      if (result.mfaRequired && result.qrCode) {
        setQrCode(result.qrCode);
        setIsSettingUpMfa(true);
        toast.success('Account created! Please configure MFA.');
      } else {
        toast.success('Registration successful. Welcome!');
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueToLogin = () => {
    navigate('/login');
  };

  if (isSettingUpMfa) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-2xl border border-emerald-500/30 flex items-center justify-center mb-6">
            <Smartphone className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Set up Two-Factor Auth</h2>
          <p className="text-slate-400 text-sm mb-8">Scan this QR code with Google Authenticator or Authy to secure your account.</p>
          
          <div className="bg-white p-4 rounded-xl inline-block mb-8">
            {qrCode ? (
              <img src={`data:image/png;base64,${qrCode}`} alt="MFA QR Code" className="w-48 h-48" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center bg-slate-100 text-slate-400">Loading...</div>
            )}
          </div>
          
          <div className="space-y-4">
            <button
              onClick={handleContinueToLogin}
              className="w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-all"
            >
              I've scanned the code &gt; Go to Login
            </button>
            <p className="text-xs text-yellow-400/80">
              Make sure to scan the code before continuing, as it won't be shown again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 relative">
        <div className="absolute inset-0 bg-gradient-to-bl from-indigo-500/10 via-emerald-500/10 to-transparent blur-3xl -z-10 rounded-full"></div>
        
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Create Account</h2>
            <p className="text-sm text-slate-400">Join OmniCrypt SecureVault</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
                    placeholder="user@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-start bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center h-5">
                  <input
                    id="mfa"
                    name="mfa"
                    type="checkbox"
                    checked={enableMfa}
                    onChange={(e) => setEnableMfa(e.target.checked)}
                    className="h-4 w-4 bg-slate-900 border-slate-700 rounded text-indigo-600 focus:ring-indigo-500/50"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="mfa" className="font-medium text-white cursor-pointer select-none">
                    Enable Two-Factor Authentication
                  </label>
                  <p className="text-slate-400 text-xs mt-1">Highly recommended for security. Requires Google Authenticator.</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Register <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
