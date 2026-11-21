import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Building, MapPin, Sparkles, AlertCircle, ArrowRight, ShieldCheck, AtSign } from 'lucide-react';
import api from '../services/api';

export default function VisitorRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    email: '',
    company: '',
    city: '',
    instagramHandle: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mobileError, setMobileError] = useState('');

  const validateMobile = (value) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length > 0 && cleaned.length !== 10) {
      setMobileError('Indian mobile number must be exactly 10 digits.');
    } else if (cleaned.length === 10 && !/^[6-9]/.test(cleaned)) {
      setMobileError('Mobile number must begin with 6, 7, 8, or 9.');
    } else {
      setMobileError('');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mobileNumber') {
      const numbersOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [name]: numbersOnly }));
      validateMobile(numbersOnly);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }

    if (!formData.mobileNumber || formData.mobileNumber.length !== 10 || !/^[6-9]/.test(formData.mobileNumber)) {
      setError('Please provide a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/visitor/register', formData);
      if (res.data.success) {
        sessionStorage.setItem('expo_participation_id', res.data.visitor.participationId);
        sessionStorage.setItem('expo_visitor_name', res.data.visitor.fullName);
        sessionStorage.setItem('expo_visitor_mobile', res.data.visitor.mobileNumber);
        navigate('/spin');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative text-slate-800">
      {/* Subtle clean ambient background accents */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-slate-100 to-transparent pointer-events-none" />

      {/* Header & Brand Logo */}
      <div className="text-center mb-6 max-w-xl z-10 flex flex-col items-center">
        <div className="mb-4 px-6 py-3 bg-white rounded-2xl shadow-sm border border-slate-200/80 transition-transform hover:scale-105">
          <img
            src="/jaliwala-logo.png"
            alt="Jaliwala Innovations Pvt. Ltd."
            className="h-11 sm:h-12 w-auto object-contain"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-200/70 border border-slate-300/80 text-slate-700 text-xs font-semibold tracking-wide uppercase mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          Interactive Expo Experience
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Welcome to <span className="text-[#d97706]">Spin & Win</span>
        </h1>
        <p className="mt-1.5 text-slate-600 text-xs sm:text-sm">
          Foundation of Food Industry • Register below to activate the prize wheel!
        </p>
      </div>

      {/* Content Layout: Responsive Side-by-Side on Desktop/Tablet, Clean Stack on Mobile */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch relative z-10">
        
        {/* Main Form Card (7 cols on Desktop) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
          <div>
            {error && (
              <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-xs sm:text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name <span className="text-amber-600">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 text-sm transition-all"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                  Mobile Number (10 Digits) <span className="text-amber-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-xs sm:text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="mobileNumber"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-2.5 bg-slate-50 border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 text-sm transition-all ${
                      mobileError ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200'
                    }`}
                  />
                </div>
                {mobileError && (
                  <p className="mt-1 text-xs text-rose-600">{mobileError}</p>
                )}
              </div>

              {/* Email Address & Instagram Handle Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      placeholder="rahul@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Instagram Handle <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="instagramHandle"
                      placeholder="@yourhandle"
                      value={formData.instagramHandle}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Company & City Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Company / Bakery <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="company"
                      placeholder="e.g. Royal Bakers"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 text-sm transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    City <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      name="city"
                      placeholder="Indore"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 text-sm transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 px-6 bg-[#476379] hover:bg-[#384f61] text-white font-bold rounded-xl shadow-sm hover:shadow active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <span>Enter & Spin Wheel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Security / Kiosk Policy Badge */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-slate-500 text-xs text-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>Fair Play: 1 Spin per verified registration</span>
          </div>
        </div>

        {/* Dedicated Side Panel: High-Impact Instagram QR Scanner Card (5 cols on Desktop) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-amber-50/70 via-rose-50/60 to-orange-50/70 border border-rose-200/80 rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col items-center justify-between text-center relative overflow-hidden">
          {/* Decorative subtle background circle */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-200/40 rounded-full blur-2xl pointer-events-none" />

          <div className="w-full flex flex-col items-center">
            <span className="inline-block text-[10px] font-extrabold tracking-wider uppercase px-3 py-1 rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white mb-3 shadow-xs">
              Instagram Follow
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
              Connect & Follow Us
            </h3>
            <p className="text-xs text-slate-600 mt-1 max-w-xs leading-relaxed">
              Scan with your phone camera to visit <span className="font-bold text-rose-600">@jaliwala_innovations</span>
            </p>

            {/* Massive, Crisp White QR Box - Highly Visible & Instantly Scannable */}
            <div className="my-5 p-3.5 bg-white rounded-3xl shadow-lg border-2 border-rose-200/90 hover:scale-105 transition-transform">
              <a
                href="https://www.instagram.com/jaliwala_innovations/"
                target="_blank"
                rel="noopener noreferrer"
                title="Scan or Tap to open @jaliwala_innovations Instagram"
                className="block"
              >
                <img
                  src="/jaliwala-qr-cropped.png"
                  alt="@jaliwala_innovations Instagram QR Code"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-2xl"
                />
              </a>
            </div>

            <p className="text-[11px] font-medium text-slate-500">
              Point your phone camera at the screen
            </p>
          </div>

          <div className="w-full pt-4 mt-2 border-t border-rose-200/60">
            <a
              href="https://www.instagram.com/jaliwala_innovations/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5"
            >
              <span>Tap to Open Profile</span>
              &rarr;
            </a>
          </div>
        </div>

      </div>

      {/* Admin Quick Link */}
      <div className="mt-5 text-center text-xs text-slate-400 z-10">
        <a href="/admin/login" className="hover:text-slate-700 transition-colors underline">
          Admin Login Portal
        </a>
      </div>
    </div>
  );
}
