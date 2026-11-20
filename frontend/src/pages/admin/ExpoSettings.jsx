import React, { useState, useEffect } from 'react';
import { Save, Shield, CheckCircle } from 'lucide-react';
import api from '../../services/api';

export default function ExpoSettings() {
  const [settings, setSettings] = useState({
    allowDuplicateMobile: false,
    expoName: '',
    welcomeMessage: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      if (res.data.success) {
        setSettings(res.data.settings);
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      const res = await api.put('/admin/settings', settings);
      if (res.data.success) {
        setMessage('Settings successfully updated!');
        setTimeout(() => setMessage(''), 4000);
      }
    } catch (err) {
      alert('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 border-3 border-[#476379] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 text-slate-800">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Kiosk Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Configure exhibition registration policies, branding and kiosk behavior
        </p>
      </div>

      {message && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        {/* Anti-Duplicate Registration Policy */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#476379]" />
                Single Mobile Spin Restriction
              </span>
              <p className="text-xs text-slate-500">
                When enabled, each Indian mobile number can only participate once. Accidental duplicates will be rejected.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={!settings.allowDuplicateMobile}
                onChange={(e) => setSettings(s => ({ ...s, allowDuplicateMobile: !e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#476379]"></div>
            </label>
          </div>
        </div>

        {/* Expo Exhibition Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Exhibition Event Name
          </label>
          <input
            type="text"
            value={settings.expoName}
            onChange={(e) => setSettings(s => ({ ...s, expoName: e.target.value }))}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
          />
        </div>

        {/* Welcome Tagline */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Kiosk Welcome Message / Tagline
          </label>
          <textarea
            rows={2}
            value={settings.welcomeMessage}
            onChange={(e) => setSettings(s => ({ ...s, welcomeMessage: e.target.value }))}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-[#476379] hover:bg-[#384f61] text-white font-semibold text-xs uppercase tracking-wide rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
        >
          <Save className="w-4 h-4 text-white" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </form>
    </div>
  );
}
