import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, CheckCircle2, AlertTriangle, RefreshCw, X, SlidersHorizontal, Lock, Unlock, ArrowDownUp, Check } from 'lucide-react';
import api from '../../services/api';

export default function PrizeManagement() {
  const [prizes, setPrizes] = useState([]);
  const [totalProbability, setTotalProbability] = useState(100);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState(null);

  const [autoBalance, setAutoBalance] = useState(true);
  const [lockedPrizes, setLockedPrizes] = useState({});
  const [savingProbabilities, setSavingProbabilities] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const initialForm = {
    name: '',
    description: '',
    category: 'Gift',
    probability: 10,
    quantity: -1,
    discountPercentage: 0,
    color: '#476379',
    textColor: '#FFFFFF',
    claimInstructions: 'Claim at Jaliwala exhibition counter',
    isActive: true,
    order: 0
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchPrizes();
  }, []);

  const fetchPrizes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/prizes');
      if (res.data.success) {
        setPrizes(res.data.prizes);
        setTotalProbability(res.data.totalActiveProbability);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Failed to load prizes', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProbabilityChange = (changedId, newRawVal) => {
    let targetVal = Math.max(0, Math.min(100, parseFloat(newRawVal) || 0));
    targetVal = Math.round(targetVal * 10) / 10;

    setPrizes(prevPrizes => {
      const activePrizes = prevPrizes.filter(p => p.isActive);
      const targetPrize = activePrizes.find(p => p._id === changedId);

      if (!targetPrize) return prevPrizes;

      if (!autoBalance) {
        const updated = prevPrizes.map(p => p._id === changedId ? { ...p, probability: targetVal } : p);
        const newTotal = updated.filter(p => p.isActive).reduce((sum, p) => sum + Number(p.probability), 0);
        setTotalProbability(parseFloat(newTotal.toFixed(1)));
        setHasUnsavedChanges(true);
        return updated;
      }

      const otherEligible = activePrizes.filter(p => p._id !== changedId && !lockedPrizes[p._id]);
      const lockedSum = activePrizes
        .filter(p => p._id !== changedId && lockedPrizes[p._id])
        .reduce((sum, p) => sum + Number(p.probability), 0);

      const maxAllowed = Math.max(0, 100 - lockedSum);
      if (targetVal > maxAllowed) targetVal = maxAllowed;

      const remainingToDistribute = Math.max(0, 100 - targetVal - lockedSum);

      let updatedPrizes;
      if (otherEligible.length === 0) {
        updatedPrizes = prevPrizes.map(p => p._id === changedId ? { ...p, probability: targetVal } : p);
      } else {
        const currentOtherSum = otherEligible.reduce((sum, p) => sum + Number(p.probability), 0);
        let distributedShares;
        if (currentOtherSum > 0) {
          distributedShares = otherEligible.map(p => ({
            id: p._id,
            newProb: Math.round(((p.probability / currentOtherSum) * remainingToDistribute) * 10) / 10
          }));
        } else {
          const share = Math.round((remainingToDistribute / otherEligible.length) * 10) / 10;
          distributedShares = otherEligible.map(p => ({ id: p._id, newProb: share }));
        }

        const allocatedSum = distributedShares.reduce((sum, item) => sum + item.newProb, 0);
        const delta = Math.round((remainingToDistribute - allocatedSum) * 10) / 10;
        if (distributedShares.length > 0 && delta !== 0) {
          distributedShares[0].newProb = Math.max(0, Math.round((distributedShares[0].newProb + delta) * 10) / 10);
        }

        const shareMap = Object.fromEntries(distributedShares.map(s => [s.id, s.newProb]));

        updatedPrizes = prevPrizes.map(p => {
          if (p._id === changedId) return { ...p, probability: targetVal };
          if (shareMap[p._id] !== undefined) return { ...p, probability: shareMap[p._id] };
          return p;
        });
      }

      const newTotal = updatedPrizes.filter(p => p.isActive).reduce((sum, p) => sum + Number(p.probability), 0);
      setTotalProbability(parseFloat(newTotal.toFixed(1)));
      setHasUnsavedChanges(true);
      return updatedPrizes;
    });
  };

  const handleDistributeEqually = () => {
    const activePrizes = prizes.filter(p => p.isActive);
    if (activePrizes.length === 0) return;

    const baseShare = Math.floor((100 / activePrizes.length) * 10) / 10;
    let distributed = activePrizes.map(p => ({ id: p._id, prob: baseShare }));
    const currentSum = distributed.reduce((s, i) => s + i.prob, 0);
    const diff = Math.round((100 - currentSum) * 10) / 10;
    if (distributed.length > 0 && diff !== 0) {
      distributed[0].prob = Math.round((distributed[0].prob + diff) * 10) / 10;
    }

    const probMap = Object.fromEntries(distributed.map(d => [d.id, d.prob]));
    const updated = prizes.map(p => probMap[p._id] !== undefined ? { ...p, probability: probMap[p._id] } : p);

    setPrizes(updated);
    setTotalProbability(100);
    setHasUnsavedChanges(true);
  };

  const handleSaveAllProbabilities = async () => {
    try {
      setSavingProbabilities(true);
      const updates = prizes.map(p => ({ id: p._id, probability: p.probability }));
      const res = await api.put('/admin/prizes/bulk-probabilities', { updates });
      if (res.data.success) {
        setPrizes(res.data.prizes);
        setTotalProbability(res.data.totalActiveProbability);
        setHasUnsavedChanges(false);
        setSaveSuccessMsg('Probabilities successfully updated & balanced to 100%!');
        setTimeout(() => setSaveSuccessMsg(''), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save probabilities.');
    } finally {
      setSavingProbabilities(false);
    }
  };

  const toggleLock = (id) => {
    setLockedPrizes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenModal = (prize = null) => {
    if (prize) {
      setEditingPrize(prize);
      setFormData({
        name: prize.name,
        description: prize.description || '',
        category: prize.category,
        probability: prize.probability,
        quantity: prize.quantity,
        discountPercentage: prize.discountPercentage || 0,
        color: prize.color || '#476379',
        textColor: prize.textColor || '#FFFFFF',
        claimInstructions: prize.claimInstructions || '',
        isActive: prize.isActive,
        order: prize.order || 0
      });
    } else {
      setEditingPrize(null);
      setFormData({ ...initialForm, probability: 10 });
    }
    setModalOpen(true);
  };

  const handleSavePrize = async (e) => {
    e.preventDefault();
    try {
      if (editingPrize) {
        await api.put(`/admin/prizes/${editingPrize._id}`, formData);
      } else {
        await api.post('/admin/prizes', { ...formData, autoBalance: true });
      }
      setModalOpen(false);
      setSaveSuccessMsg(editingPrize ? 'Prize updated!' : 'New prize added and wheel probabilities auto-balanced to 100%!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
      fetchPrizes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save prize.');
    }
  };

  const handleDeletePrize = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prize?')) return;
    try {
      await api.delete(`/admin/prizes/${id}`);
      fetchPrizes();
    } catch (err) {
      alert('Failed to delete prize.');
    }
  };

  const isExact100 = Math.abs(totalProbability - 100) < 0.1;

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header & Add Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Prize & Probability Configuration</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Control wheel segments, real-time dynamic probability redistribution, stock limits & aesthetics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <button
              onClick={handleSaveAllProbabilities}
              disabled={savingProbabilities}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{savingProbabilities ? 'Saving...' : 'Save Probabilities'}</span>
            </button>
          )}

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#476379] hover:bg-[#384f61] text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Prize Segment</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Probability Calibration Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
        isExact100
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          : 'bg-amber-50/70 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center gap-3">
          {isExact100 ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          )}
          <div className="text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base">Total Active Probability: {totalProbability}%</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isExact100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isExact100 ? 'Balanced' : 'Action Needed'}
              </span>
            </div>
            <p className="text-xs opacity-80 mt-0.5">
              {autoBalance
                ? '⚡ Dynamic Auto-Balancing is ACTIVE: Adjusting any percentage recalculates other gifts out of 100%.'
                : 'Manual Mode: Change values independently.'}
            </p>
          </div>
        </div>

        {/* Dynamic Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => setAutoBalance(!autoBalance)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
              autoBalance
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Auto-Balance: {autoBalance ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={handleDistributeEqually}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-slate-500" />
            <span>Split Equally</span>
          </button>

          <button
            onClick={fetchPrizes}
            className="p-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer text-slate-600 shadow-xs"
            title="Reset / Reload"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visual Probability Distribution Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
          <span>Wheel Segment Probability Allocation (100% Total)</span>
          <span className="font-mono text-slate-800 font-bold">{totalProbability}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
          {prizes.filter(p => p.isActive).map(prize => (
            <div
              key={prize._id}
              className="h-full transition-all duration-300 relative group cursor-pointer"
              style={{
                width: `${Math.max(0, prize.probability)}%`,
                backgroundColor: prize.color || '#476379'
              }}
              title={`${prize.name}: ${prize.probability}%`}
            />
          ))}
        </div>
      </div>

      {/* Prize Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prizes.map((prize) => {
          const isOutOfStock = prize.quantity !== -1 && prize.wonCount >= prize.quantity;
          const remaining = prize.quantity === -1 ? 'Unlimited' : Math.max(0, prize.quantity - prize.wonCount);
          const isLocked = !!lockedPrizes[prize._id];

          return (
            <div
              key={prize._id}
              className={`bg-white border rounded-2xl p-5 shadow-xs relative flex flex-col justify-between transition-all ${
                !prize.isActive
                  ? 'border-slate-200 opacity-60 bg-slate-50/50'
                  : isOutOfStock
                  ? 'border-rose-200'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-200 shadow-xs"
                      style={{ backgroundColor: prize.color }}
                    />
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {prize.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {prize.isActive && (
                      <button
                        onClick={() => toggleLock(prize._id)}
                        className={`p-1 rounded-lg text-xs transition-colors cursor-pointer ${
                          isLocked ? 'text-amber-700 bg-amber-50' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title={isLocked ? 'Locked from auto-redistribution' : 'Lock this value during dynamic rebalancing'}
                      >
                        {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      prize.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {prize.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-0.5 truncate">{prize.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{prize.description || 'No description provided.'}</p>

                {/* DYNAMIC PROBABILITY SLIDER */}
                {prize.isActive && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 font-medium flex items-center gap-1">
                        Probability:
                        {isLocked && <span className="text-[10px] text-amber-700 font-semibold">(Locked)</span>}
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={prize.probability}
                          onChange={(e) => handleProbabilityChange(prize._id, e.target.value)}
                          className="w-14 px-1 py-0.5 bg-white border border-slate-200 rounded text-right font-mono text-slate-900 font-bold text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
                        />
                        <span className="text-slate-700 font-bold text-xs">%</span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="0.5"
                      value={prize.probability}
                      onChange={(e) => handleProbabilityChange(prize._id, e.target.value)}
                      className="w-full accent-[#476379] h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2 rounded-xl border border-slate-100 mb-3">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Stock Left:</span>
                    <span className={`font-mono font-bold text-xs ${isOutOfStock ? 'text-rose-600' : 'text-slate-700'}`}>
                      {remaining}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Won Count:</span>
                    <span className="font-mono text-slate-700 text-xs">{prize.wonCount}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleOpenModal(prize)}
                  className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer border border-slate-200"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeletePrize(prize._id)}
                  className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg text-xs transition-colors cursor-pointer border border-rose-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Save Probabilities Bar */}
      {hasUnsavedChanges && (
        <div className="sticky bottom-6 z-40 bg-white border border-slate-300 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-slate-900">Unsaved Probability Changes Detected</span>
              <p className="text-slate-500 text-xs">Total is calibrated to {totalProbability}%. Click save to apply to future spins.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchPrizes}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200"
            >
              Discard
            </button>
            <button
              onClick={handleSaveAllProbabilities}
              disabled={savingProbabilities}
              className="px-4 py-1.5 bg-[#476379] hover:bg-[#384f61] text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {savingProbabilities ? 'Saving...' : 'Save All Probabilities'}
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-xl relative my-8 text-slate-800">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            <h2 className="text-base font-bold text-slate-900 mb-4">
              {editingPrize ? 'Edit Wheel Prize Segment' : 'Add New Prize Segment'}
            </h2>

            <form onSubmit={handleSavePrize} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Prize Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Smart Watch / 10% Off Bakery Equipment"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300"
                  >
                    <option value="Gift">Gift</option>
                    <option value="Discount">Discount</option>
                    <option value="No Prize">No Prize (Luck Next Time)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Winning Probability (%) *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={formData.probability}
                    onChange={(e) => setFormData(p => ({ ...p, probability: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Inventory Limit (-1 = Unlimited)</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData(p => ({ ...p, quantity: parseInt(e.target.value, 10) }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-slate-300"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Discount % (If applicable)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.discountPercentage}
                    onChange={(e) => setFormData(p => ({ ...p, discountPercentage: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wheel Slice Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(p => ({ ...p, color: e.target.value }))}
                      className="w-9 h-9 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) => setFormData(p => ({ ...p, color: e.target.value }))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Segment Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData(p => ({ ...p, order: parseInt(e.target.value, 10) || 0 }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Claim & Redemption Instructions</label>
                <textarea
                  rows={2}
                  value={formData.claimInstructions}
                  onChange={(e) => setFormData(p => ({ ...p, claimInstructions: e.target.value }))}
                  placeholder="Instructions displayed to winner on their screen..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-slate-300"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))}
                  className="rounded text-[#476379] focus:ring-[#476379]"
                />
                <label htmlFor="isActive" className="text-slate-700 font-medium cursor-pointer">
                  Prize is Active on Wheel
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#476379] hover:bg-[#384f61] text-white font-semibold rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wide shadow-xs"
                >
                  Save Prize Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
