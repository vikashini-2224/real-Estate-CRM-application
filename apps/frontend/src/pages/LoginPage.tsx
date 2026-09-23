import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Building2, Shield, UserCheck, Lock, Mail, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = 'Email Address is required.';
    if (!password) errors.password = 'Password is required.';

    if (Object.keys(errors).length > 0) {
      setLoginErrors(errors);
      return;
    }
    setLoginErrors({});

    setIsLoading(true);
    try {
      await login(email, password);
      success('Welcome back! Successfully authenticated.');
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setIsLoading(true);
    try {
      await login(demoEmail, 'password123');
      success(`Signed in as ${demoEmail.includes('admin') ? 'Administrator' : 'Sales Representative'}`);
      navigate('/dashboard');
    } catch (err: any) {
      error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Left Column: Hero & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#081523] text-white p-12 flex-col justify-between relative overflow-hidden border-r border-slate-800">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-10 top-1/4 w-72 h-72 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">APEX REAL ESTATE CRM</h1>
              <p className="text-xs text-slate-400">Enterprise Asset & Inventory Management</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>ACID-Compliant Concurrency Engine</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight leading-tight text-white">
            Transform lead pipelines into closed real estate contracts.
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Manage multi-tier project inventories, track leads through custom sales stages, and guarantee zero double-booking with database-level isolation.
          </p>
        </div>

        <div className="relative z-10 pt-8 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>Enterprise Real Estate Suite v1.0</span>
          <span>Role-Based Access Control</span>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
            <p className="text-xs text-slate-500">Enter your enterprise credentials to access the CRM portal</p>
          </div>

          {/* Quick Demo Login Previews */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-2.5">
            <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>One-Click Demo Personas</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@realestatecrm.com')}
                disabled={isLoading}
                className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-500 hover:shadow-sm text-left transition-all group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">Admin</span>
                <span className="text-[10px] text-slate-400">Victoria Vance</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('john@realestatecrm.com')}
                disabled={isLoading}
                className="flex flex-col items-start p-2.5 rounded-lg border border-slate-200 bg-white hover:border-blue-500 hover:shadow-sm text-left transition-all group"
              >
                <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">Sales Rep</span>
                <span className="text-[10px] text-slate-400">John Miller</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="name@realestatecrm.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setLoginErrors(prev => ({ ...prev, email: undefined }));
                }}
                error={loginErrors.email}
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginErrors(prev => ({ ...prev, password: undefined }));
                }}
                error={loginErrors.password}
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isLoading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to CRM
            </Button>
          </form>

          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-400">
              Secured with HTTP-Only JWT tokens & Role-based Access Control
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
