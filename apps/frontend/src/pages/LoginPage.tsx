import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Building2, Shield, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* LEFT SIDE — BRAND PANEL */}
      <div className="hidden lg:flex w-[45%] bg-[#081A2D] text-white p-14 flex-col justify-between relative overflow-hidden">
        {/* Subtle geometric background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            <path d="M0,100 L500,600 L1000,100" fill="none" stroke="rgba(37,99,235,0.2)" strokeWidth="2" />
            <path d="M0,200 L500,700 L1000,200" fill="none" stroke="rgba(37,99,235,0.1)" strokeWidth="2" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">APEX CRM</h1>
              <p className="text-xs text-slate-300 font-medium">Real Estate Enterprise</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold tracking-wide">
            <Shield className="w-3.5 h-3.5" />
            <span>Enterprise Real Estate CRM</span>
          </div>
          <h2 className="text-[2.5rem] font-bold tracking-tight leading-[1.15] text-white">
            Transform lead pipelines into closed real estate contracts.
          </h2>
          <p className="text-[15px] text-slate-300 leading-relaxed font-medium">
            Manage customer relationships, property inventory, sales pipelines, and bookings from one unified platform.
          </p>
        </div>

        <div className="relative z-10 flex flex-col gap-1 text-xs text-slate-400 font-medium">
          <span className="text-slate-300">APEX Real Estate Suite</span>
          <span>Secure • Reliable • Role-based</span>
        </div>
      </div>

      {/* RIGHT SIDE — LOGIN PANEL */}
      <div className="w-full lg:w-[55%] flex flex-col items-center justify-center p-6 sm:p-12">
        {/* Mobile Branding (hidden on desktop) */}
        <div className="lg:hidden flex flex-col items-center mb-8 gap-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">APEX CRM</h1>
            <p className="text-xs text-slate-500 font-medium">Real Estate Enterprise</p>
          </div>
        </div>

        <div className="w-full max-w-[460px] flex flex-col items-center">
          {/* Login Card */}
          <div className="w-full bg-white rounded-[24px] shadow-xl shadow-slate-200/50 border border-slate-200 p-8 sm:p-10 mb-6">
            
            {/* Card Header */}
            <div className="hidden lg:flex items-center gap-2.5 mb-8">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">APEX CRM</h2>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Real Estate Enterprise</p>
              </div>
            </div>

            <div className="space-y-1.5 mb-8">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to your account</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Enter your enterprise credentials to access the CRM portal</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  required
                  icon={<Mail className="w-4 h-4" />}
                  placeholder="name@realestatecrm.com"
                  value={email}
                  autoComplete="off"
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLoginErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  error={loginErrors.email}
                  className="h-12 rounded-xl text-[15px]"
                />
              </div>

              <div>
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  required
                  icon={<Lock className="w-4 h-4" />}
                  placeholder="••••••••••••••••"
                  value={password}
                  autoComplete="new-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLoginErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  error={loginErrors.password}
                  className="h-12 rounded-xl text-[15px]"
                  rightElement={
                    <button
                      type="button"
                      tabIndex={-1}
                      className="p-1 text-blue-600 hover:text-blue-700 focus:outline-none rounded"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-[15px] font-semibold mt-2 bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20"
                size="lg"
                isLoading={isLoading}
                icon={!isLoading ? <ArrowRight className="w-4 h-4" /> : undefined}
              >
                {isLoading ? 'Signing in...' : 'Sign In to CRM'}
              </Button>
            </form>
          </div>

          {/* Demo Access Card */}
          <div className="w-full bg-white border border-slate-200/80 rounded-[20px] p-6 mb-8">
            <div className="mb-4">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500" />
                Demo Access
              </h4>
              <p className="text-xs text-slate-500 mt-1 pl-6">
                Use these test accounts to explore the CRM
              </p>
            </div>
            
            <div className="space-y-3">
              {/* Admin Row */}
              <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900 leading-tight">Admin</p>
                    <p className="text-[12px] text-slate-500 font-medium mt-0.5">admin@realestatecrm.com</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="h-8 px-3 border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors"
                  onClick={() => {
                    setEmail('admin@realestatecrm.com');
                    setPassword('password123');
                    setLoginErrors({});
                  }}
                >
                  Use Admin Demo
                </button>
              </div>

              {/* Sales Rep Row */}
              <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-slate-900 leading-tight">Sales Representative</p>
                    <p className="text-[12px] text-slate-500 font-medium mt-0.5">john@realestatecrm.com</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  className="h-8 px-3 border border-blue-200 bg-white text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-semibold transition-colors"
                  onClick={() => {
                    setEmail('john@realestatecrm.com');
                    setPassword('password123');
                    setLoginErrors({});
                  }}
                >
                  Use Sales Demo
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
