import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { ArrowLeft, RefreshCw, Trophy, UserCheck, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import CanvasWheel from '../components/CanvasWheel';
import WinnerModal from '../components/WinnerModal';

export default function SpinWheel() {
  const navigate = useNavigate();
  const [prizes, setPrizes] = useState([]);
  const [visitor, setVisitor] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinCompleted, setSpinCompleted] = useState(false);
  const [winningResult, setWinningResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const participationId = sessionStorage.getItem('expo_participation_id');

  useEffect(() => {
    if (!participationId) {
      navigate('/');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const prizeRes = await api.get('/visitor/wheel-prizes');
        if (prizeRes.data.success) {
          setPrizes(prizeRes.data.prizes);
        }

        const visitorRes = await api.get(`/visitor/status/${participationId}`);
        if (visitorRes.data.success) {
          setVisitor(visitorRes.data.visitor);
          if (visitorRes.data.visitor.hasSpun) {
            setSpinCompleted(true);
            setWinningResult(visitorRes.data.visitor.prizeWon);
          }
        }
      } catch (err) {
        setErrorMessage('Failed to load wheel session. Please re-register.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [participationId, navigate]);

  const handleSpin = async () => {
    if (isSpinning || spinCompleted || !visitor || !prizes.length) return;

    try {
      setIsSpinning(true);
      setErrorMessage('');

      const res = await api.post('/visitor/spin', { participationId });

      if (res.data.success) {
        const { prizeIndex, totalSegments } = res.data.result;

        const arcDeg = 360 / totalSegments;
        const segmentCenterDeg = (prizeIndex * arcDeg) + (arcDeg / 2);
        const targetPointerDeg = 270;

        let stopAngle = (targetPointerDeg - segmentCenterDeg) % 360;
        if (stopAngle < 0) stopAngle += 360;

        const extraRounds = 7 * 360;
        const finalTargetRotation = rotation + extraRounds + (stopAngle - (rotation % 360) + 360) % 360;

        animateWheel(rotation, finalTargetRotation, 5500, () => {
          setIsSpinning(false);
          setSpinCompleted(true);
          setWinningResult(res.data.result);
          setIsModalOpen(true);

          if (res.data.result.category !== 'No Prize') {
            fireConfetti();
          }
        });
      }
    } catch (err) {
      setIsSpinning(false);
      const msg = err.response?.data?.message || 'Failed to complete spin. Please try again.';
      setErrorMessage(msg);
      if (err.response?.data?.alreadySpun) {
        setSpinCompleted(true);
      }
    }
  };

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const animateWheel = (startAngle, endAngle, duration, onComplete) => {
    const startTime = performance.now();

    const frame = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const current = startAngle + (endAngle - startAngle) * easedProgress;
      setRotation(current);

      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        setRotation(endAngle % 360);
        if (onComplete) onComplete();
      }
    };

    requestAnimationFrame(frame);
  };

  const fireConfetti = () => {
    const count = 200;
    const defaults = { origin: { y: 0.7 } };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  };

  const handleResetKiosk = () => {
    sessionStorage.removeItem('expo_participation_id');
    sessionStorage.removeItem('expo_visitor_name');
    sessionStorage.removeItem('expo_visitor_mobile');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-700">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#476379] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold tracking-wide text-slate-500">Setting Up Wheel Arena...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-between p-4 sm:p-6 select-none relative text-slate-800">
      {/* Top Bar / Visitor Info */}
      <div className="w-full max-w-5xl relative flex items-center justify-between z-10 py-2">
        <button
          onClick={handleResetKiosk}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm transition-all cursor-pointer z-10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Kiosk</span>
        </button>

        {/* Center Brand Logo in Top Navigation */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="px-5 py-2 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
            <img
              src="/jaliwala-logo.png"
              alt="Jaliwala Innovations"
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </div>
        </div>

        {visitor && (
          <div className="flex items-center gap-2 sm:gap-3 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs z-10">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-slate-800">{visitor.fullName}</span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="text-[#476379] font-mono font-bold">{visitor.participationId}</span>
          </div>
        )}
      </div>

      {/* Center Stage: Wheel */}
      <div className="flex flex-col items-center justify-center my-auto z-10">
        {errorMessage && (
          <div className="mb-4 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Wheel Canvas Container with crisp clean shadow */}
        <div className="relative p-2 sm:p-3 rounded-full bg-white border border-slate-200 shadow-md glow-ring">
          <CanvasWheel
            prizes={prizes}
            rotation={rotation}
            isSpinning={isSpinning}
          />
        </div>

        {/* Big Spin Control Button */}
        <div className="mt-6 flex flex-col items-center">
          {!spinCompleted ? (
            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className={`px-10 py-3.5 sm:px-14 sm:py-4 rounded-xl font-bold text-base sm:text-xl uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
                isSpinning
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed scale-95 shadow-none'
                  : 'bg-[#476379] hover:bg-[#384f61] text-white hover:shadow-md hover:scale-[1.02] active:scale-95'
              }`}
            >
              {isSpinning ? 'SPINNING...' : 'TAP TO SPIN!'}
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#476379] hover:bg-[#384f61] text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>View My Prize Ticket</span>
              </button>

              <button
                onClick={handleResetKiosk}
                className="px-5 py-2.5 rounded-xl font-bold text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset For Next Attendee</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="w-full max-w-xl text-center z-10 py-2">
        <p className="text-[11px] text-slate-400 font-medium">
          Jaliwala Innovations Pvt. Ltd. • Foundation of Food Industry
        </p>
      </div>

      {/* Modal Popup */}
      <WinnerModal
        isOpen={isModalOpen}
        result={winningResult}
        onClose={() => setIsModalOpen(false)}
        onResetKiosk={handleResetKiosk}
      />
    </div>
  );
}
