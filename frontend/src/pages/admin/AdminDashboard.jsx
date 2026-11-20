import React, { useState, useEffect } from 'react';
import { Users, Disc3, Gift, Percent, Frown, PackageOpen, TrendingUp } from 'lucide-react';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard-stats');
      if (res.data.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-7 h-7 border-3 border-[#476379] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Registered Visitors',
      value: stats.totalVisitors,
      icon: Users,
      bgColor: 'bg-slate-100',
      iconColor: 'text-[#476379]'
    },
    {
      title: 'Total Spins Executed',
      value: stats.totalSpins,
      icon: Disc3,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-700'
    },
    {
      title: 'Total Gifts Won',
      value: stats.giftsWon,
      icon: Gift,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-700'
    },
    {
      title: 'Total Discounts Won',
      value: stats.discountsWon,
      icon: Percent,
      bgColor: 'bg-rose-50',
      iconColor: 'text-rose-700'
    },
    {
      title: 'Better Luck Next Time',
      value: stats.noPrizeCount,
      icon: Frown,
      bgColor: 'bg-slate-100',
      iconColor: 'text-slate-600'
    },
    {
      title: 'Pending Claims',
      value: stats.pendingClaims,
      icon: PackageOpen,
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-700'
    }
  ];

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Expo Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Real-time analytics, participant flow and prize distribution metrics
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer shadow-xs"
        >
          Refresh Data
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {card.title}
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  {card.value}
                </p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${card.bgColor} ${card.iconColor} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Prize Distribution & Inventory Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prize Allocation Breakdown */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#476379]" />
            Prize Category Distribution
          </h2>
          <div className="space-y-3">
            {stats.categoryDistribution?.map((cat, i) => {
              const total = stats.totalSpins || 1;
              const pct = Math.round((cat.count / total) * 100);
              const barColor = i === 0 ? '#10b981' : i === 1 ? '#d97706' : '#64748b';
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-slate-700">{cat.name}</span>
                    <span className="text-slate-500">{cat.count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: barColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Prize Inventory Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs overflow-x-auto">
          <h2 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <PackageOpen className="w-4 h-4 text-[#476379]" />
            Configured Prizes & Probability
          </h2>
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider">
                <th className="pb-2">Prize</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Weight</th>
                <th className="pb-2">Won</th>
                <th className="pb-2">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.prizeStats?.map((p) => (
                <tr key={p.id} className="text-slate-700 hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 font-semibold text-slate-900 truncate max-w-[140px]">{p.name}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.category === 'Gift' ? 'bg-emerald-50 text-emerald-700' :
                      p.category === 'Discount' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.category}
                    </span>
                  </td>
                  <td className="py-2.5 font-mono text-slate-800 font-bold">{p.probability}%</td>
                  <td className="py-2.5">{p.wonCount}</td>
                  <td className="py-2.5 text-slate-500">
                    {p.quantity === -1 ? 'Unlimited' : Math.max(0, p.quantity - p.wonCount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
