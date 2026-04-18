import { useEffect, useState } from 'react';

const CONFETTI_COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'];
const CONFETTI_COUNT = 60;

function ConfettiPiece({ color, style }) {
  return (
    <div
      className="absolute w-3 h-3 rounded-sm pointer-events-none"
      style={{ backgroundColor: color, top: '-20px', ...style }}
    />
  );
}

export default function CelebrationModal({ show, onClose, title, subtitle, reward, kid }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!show) return;
    const newPieces = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: `${Math.random() * 100}%`,
      duration: `${1.5 + Math.random() * 2}s`,
      delay: `${Math.random() * 0.8}s`,
    }));
    setPieces(newPieces);
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {pieces.map((p) => (
          <ConfettiPiece
            key={p.id}
            color={p.color}
            style={{
              left: p.left,
              animationName: 'confettiFall',
              animationDuration: p.duration,
              animationDelay: p.delay,
              animationFillMode: 'forwards',
              animationTimingFunction: 'linear',
            }}
          />
        ))}
      </div>

      <div className="bg-white rounded-3xl p-8 mx-6 text-center shadow-2xl animate-bounce-in max-w-sm w-full">
        <div className="text-7xl mb-4 animate-star-burst">{reward?.icon || '🌟'}</div>
        <h2 className="text-3xl font-black text-gray-800 mb-2">{title}</h2>
        {subtitle && <p className="text-lg text-gray-500 mb-6">{subtitle}</p>}

        {reward && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6">
            <p className="text-lg font-bold text-yellow-700">{reward.label}</p>
            <p className="text-sm text-yellow-600">{reward.detail}</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-gray-800 text-white text-xl font-bold active:scale-95 transition-transform"
        >
          Awesome! 🎉
        </button>
      </div>
    </div>
  );
}
