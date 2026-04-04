import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const MfaVerifyPage = () => {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { verifyOtp, preAuthEmail } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!preAuthEmail) {
      navigate('/login');
    }
  }, [preAuthEmail, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Code must be 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(code);
      toast.success('Verification successful');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid code');
    } finally {
      setIsLoading(false);
    }
  };

  if (!preAuthEmail) return null;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8 relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 via-indigo-500/10 to-transparent blur-3xl -z-10 rounded-full"></div>
        
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
          <div className="mx-auto w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mb-6">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h2>
          <p className="text-slate-400 text-sm mb-8">
            Enter the 6-digit code from your authenticator app for <strong className="text-white">{preAuthEmail}</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <input
                type="text"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="block w-full px-4 py-4 text-center text-3xl tracking-[0.5em] font-mono bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all outline-none"
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Verify & Continue'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-sm text-slate-500 hover:text-slate-400 cursor-pointer" onClick={() => navigate('/login')}>
            Cancel and return to login
          </div>
        </div>
      </div>
    </div>
  );
};

export default MfaVerifyPage;
