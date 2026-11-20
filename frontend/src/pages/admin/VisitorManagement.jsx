import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, Clock, X, FileSpreadsheet } from 'lucide-react';
import api from '../../services/api';

export default function VisitorManagement() {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [spinStatus, setSpinStatus] = useState('all');
  const [claimStatus, setClaimStatus] = useState('all');

  // Selected Visitor Modal
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [claimNotes, setClaimNotes] = useState('');
  const [updatingClaim, setUpdatingClaim] = useState(false);

  useEffect(() => {
    fetchVisitors(1);
  }, [category, spinStatus, claimStatus]);

  const fetchVisitors = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search,
        category,
        spinStatus,
        claimStatus
      };
      const res = await api.get('/admin/visitors', { params });
      if (res.data.success) {
        setVisitors(res.data.visitors);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load visitors', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVisitors(1);
  };

  // Excel Export Handler
  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const params = { search, category, spinStatus, claimStatus };
      const response = await api.get('/admin/visitors/export', {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `Jaliwala_Expo_Visitors_${today}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export error', err);
      alert('Failed to export Excel file.');
    } finally {
      setExporting(false);
    }
  };

  // Update Prize Claim Status
  const handleUpdateClaim = async (status) => {
    if (!selectedVisitor) return;
    try {
      setUpdatingClaim(true);
      const res = await api.patch(`/admin/visitors/${selectedVisitor._id}/claim`, {
        claimStatus: status,
        adminNotes: claimNotes
      });
      if (res.data.success) {
        setSelectedVisitor(res.data.visitor);
        setVisitors(prev => prev.map(v => v._id === res.data.visitor._id ? res.data.visitor : v));
      }
    } catch (err) {
      alert('Failed to update claim status.');
    } finally {
      setUpdatingClaim(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Visitor & Winner Records</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Search, filter, track prize redemptions and download verified reports
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-[#476379] hover:bg-[#384f61] text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{exporting ? 'Generating XLSX...' : 'Export to Excel'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by visitor name, mobile, participation ID or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#476379] hover:bg-[#384f61] text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filters:</span>
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-300"
          >
            <option value="all">All Prize Categories</option>
            <option value="Gift">Gifts Only</option>
            <option value="Discount">Discounts Only</option>
            <option value="No Prize">No Prize / Luck Next Time</option>
          </select>

          <select
            value={spinStatus}
            onChange={(e) => setSpinStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-300"
          >
            <option value="all">All Spin Status</option>
            <option value="spun">Completed Spin</option>
            <option value="unspun">Pending Spin</option>
          </select>

          <select
            value={claimStatus}
            onChange={(e) => setClaimStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-slate-300"
          >
            <option value="all">All Claim Statuses</option>
            <option value="Pending">Pending Redemption</option>
            <option value="Claimed">Claimed / Delivered</option>
            <option value="Not Applicable">Not Applicable</option>
          </select>
        </div>
      </div>

      {/* Visitor Records Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Visitor</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Spin Result</th>
                <th className="py-3 px-4">Claim Status</th>
                <th className="py-3 px-4">Registered At</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="w-5 h-5 border-2 border-[#476379] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading visitor records...
                  </td>
                </tr>
              ) : visitors.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No matching visitor records found.
                  </td>
                </tr>
              ) : (
                visitors.map((v) => (
                  <tr key={v._id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#476379]">{v.participationId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {v.fullName}
                      {v.city && <span className="block text-[10px] text-slate-400 font-normal">{v.city}</span>}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">+91 {v.mobileNumber}</td>
                    <td className="py-3 px-4 text-slate-500">{v.company || '—'}</td>
                    <td className="py-3 px-4">
                      {v.hasSpun ? (
                        <div>
                          <span className="font-medium text-slate-800">{v.prizeWon?.prizeName}</span>
                          <span className="block text-[10px] text-slate-400">{v.prizeWon?.category}</span>
                        </div>
                      ) : (
                        <span className="text-amber-600 italic">Not Spun Yet</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        v.claimStatus === 'Claimed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        v.claimStatus === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {v.claimStatus === 'Claimed' && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                        {v.claimStatus === 'Pending' && <Clock className="w-3 h-3 text-amber-600" />}
                        {v.claimStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(v.registeredAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedVisitor(v);
                          setClaimNotes(v.adminNotes || '');
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium border border-slate-200 cursor-pointer transition-colors shadow-xs"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <div>
            Showing {visitors.length} of {pagination.total} visitors
          </div>
          <div className="flex gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchVisitors(pagination.page - 1)}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer text-slate-700 shadow-xs"
            >
              Previous
            </button>
            <span className="py-1 px-2 font-mono text-slate-700 font-semibold">
              {pagination.page} / {pagination.totalPages || 1}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchVisitors(pagination.page + 1)}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer text-slate-700 shadow-xs"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Inspect & Manage Claim Modal */}
      {selectedVisitor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-xl relative text-slate-800">
            <button
              onClick={() => setSelectedVisitor(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-bold text-slate-900 mb-0.5">Visitor Details & Claim Status</h2>
            <p className="text-xs font-mono text-[#476379] mb-4">{selectedVisitor.participationId}</p>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
              <div>
                <span className="text-slate-400 block">Name:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedVisitor.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Mobile:</span>
                <span className="font-mono text-slate-900 text-sm">+91 {selectedVisitor.mobileNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Email:</span>
                <span className="text-slate-700">{selectedVisitor.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Company:</span>
                <span className="text-slate-700">{selectedVisitor.company || 'N/A'}</span>
              </div>
            </div>

            {/* Prize summary */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 text-xs">
              <span className="text-slate-400 block mb-0.5">Winning Prize:</span>
              <p className="text-base font-extrabold text-[#476379]">
                {selectedVisitor.prizeWon?.prizeName || 'No Spin Result'}
              </p>
              <p className="text-slate-500 mt-1">
                Category: <span className="text-slate-800 font-semibold">{selectedVisitor.prizeWon?.category || 'N/A'}</span>
              </p>
            </div>

            {/* Claim note & actions */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Internal Counter Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Delivered by John at Booth B3..."
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  disabled={updatingClaim}
                  onClick={() => handleUpdateClaim('Claimed')}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Mark as Claimed
                </button>
                <button
                  disabled={updatingClaim}
                  onClick={() => handleUpdateClaim('Pending')}
                  className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Mark as Pending
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
