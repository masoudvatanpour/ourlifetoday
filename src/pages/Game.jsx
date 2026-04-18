import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { getTheme } from '../lib/themes';
import { getAvailableGameUnlock, markGameUnlockUsed, addReward } from '../lib/storage';

const EMOJI_PAIRS = ['🦋', '🦁', '🐸', '🦊', '🐼', '🦄', '🌈', '⭐'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createCards() {
  return shuffle([...EMOJI_PAIRS, ...EMOJI_PAIRS].map((emoji, i) => ({
    id: i,
    emoji,
    flipped: false,
    matched: false,
  })));
}

export default function Game() {
  const { currentKid } = useAuth();
  const navigate = useNavigate();
  const theme = getTheme(currentKid?.color);
  const [unlock, setUnlock] = useState(null);
  const [cards, setCards] = useState(() => createCards());
  const [selected, setSelected] = useState([]);
  const [locked, setLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(5 * 60);
  const [gameState, setGameState] = useState('idle'); // idle | playing | won | lost
  const [pairs, setPairs] = useState(0);

  useEffect(() => {
    if (!currentKid) return;
    const u = getAvailableGameUnlock(currentKid.id);
    setUnlock(u);
    if (!u) setGameState('locked');
    else setGameState('idle');
  }, [currentKid]);

  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { setGameState('lost'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const startGame = () => {
    setCards(createCards());
    setSelected([]);
    setMoves(0);
    setTimeLeft(5 * 60);
    setPairs(0);
    setGameState('playing');
  };

  const handleCard = useCallback((cardId) => {
    if (locked || gameState !== 'playing') return;
    setCards((prev) => {
      const card = prev.find((c) => c.id === cardId);
      if (!card || card.flipped || card.matched) return prev;
      return prev;
    });

    setSelected((prev) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card || card.matched || card.flipped) return prev;
      if (prev.length >= 2) return prev;
      if (prev.find((c) => c.id === cardId)) return prev;

      const newSel = [...prev, card];
      setCards((c) => c.map((x) => x.id === cardId ? { ...x, flipped: true } : x));

      if (newSel.length === 2) {
        setMoves((m) => m + 1);
        setLocked(true);
        if (newSel[0].emoji === newSel[1].emoji) {
          setTimeout(() => {
            setCards((c) => c.map((x) =>
              x.id === newSel[0].id || x.id === newSel[1].id ? { ...x, matched: true } : x
            ));
            setPairs((p) => {
              const newPairs = p + 1;
              if (newPairs === EMOJI_PAIRS.length) setGameState('won');
              return newPairs;
            });
            setSelected([]);
            setLocked(false);
          }, 600);
        } else {
          setTimeout(() => {
            setCards((c) => c.map((x) =>
              x.id === newSel[0].id || x.id === newSel[1].id ? { ...x, flipped: false } : x
            ));
            setSelected([]);
            setLocked(false);
          }, 1000);
        }
        return newSel;
      }
      return newSel;
    });
  }, [cards, locked, gameState]);

  useEffect(() => {
    if (gameState === 'won' && unlock) {
      markGameUnlockUsed(unlock.id);
      addReward({ kidId: currentKid.id, type: 'game_win', icon: '🎮', name: 'Memory Master', reason: `Won in ${moves} moves` });
    }
  }, [gameState]);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (!currentKid) return null;

  if (gameState === 'locked') {
    return (
      <div className={`min-h-screen pb-28 ${theme.bgLight} flex flex-col items-center justify-center p-6`}>
        <div className="text-center max-w-sm">
          <div className="text-8xl mb-6">🔒</div>
          <h2 className="text-3xl font-black text-gray-800 mb-3">Game Locked</h2>
          <p className="text-gray-500 text-lg mb-2">Complete all your goals for {currentKid.weeklyTarget || 5} days in a week to unlock the game!</p>
          <p className="text-gray-400 text-sm mb-8">Check the Rewards page when you earn a trophy 🏆</p>
          <button onClick={() => navigate('/today')} className={`${theme.button} text-white px-8 py-4 rounded-2xl font-black text-xl active:scale-95 transition-transform`}>
            Back to Goals
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'idle') {
    return (
      <div className={`min-h-screen pb-28 ${theme.bgLight} flex flex-col items-center justify-center p-6`}>
        <div className="text-center max-w-sm">
          <div className="text-8xl mb-4">🎮</div>
          <h2 className="text-3xl font-black text-gray-800 mb-2">Memory Match!</h2>
          <p className="text-gray-500 text-lg mb-2">Flip the cards to find matching pairs!</p>
          <p className="text-gray-400 text-sm mb-8">You have 5 minutes ⏱️ Match all 8 pairs to win!</p>
          <button onClick={startGame} className={`${theme.button} text-white px-10 py-5 rounded-3xl font-black text-2xl active:scale-95 transition-transform shadow-lg`}>
            🕹️ Let's Play!
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'won') {
    return (
      <div className={`min-h-screen pb-28 ${theme.bgLight} flex flex-col items-center justify-center p-6`}>
        <div className="text-center max-w-sm">
          <div className="text-8xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-4xl font-black text-gray-800 mb-2">YOU WON! 🏆</h2>
          <p className="text-gray-500 text-xl mb-2">Amazing memory, {currentKid.name}!</p>
          <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm">
            <p className="text-lg font-bold text-gray-700">Finished in <span className={theme.text}>{moves} moves</span></p>
            <p className="text-sm text-gray-400">Time left: {fmt(timeLeft)}</p>
          </div>
          <button onClick={() => navigate('/rewards')} className={`${theme.button} text-white px-8 py-4 rounded-2xl font-black text-xl active:scale-95 transition-transform`}>
            See My Rewards ⭐
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'lost') {
    return (
      <div className={`min-h-screen pb-28 ${theme.bgLight} flex flex-col items-center justify-center p-6`}>
        <div className="text-center max-w-sm">
          <div className="text-8xl mb-4">⏰</div>
          <h2 className="text-3xl font-black text-gray-800 mb-2">Time's up!</h2>
          <p className="text-gray-500 text-lg mb-2">You matched {pairs} of 8 pairs — so close!</p>
          <p className="text-gray-400 text-sm mb-6">Practice makes perfect! Try again next week.</p>
          <button onClick={() => navigate('/today')} className={`${theme.button} text-white px-8 py-4 rounded-2xl font-black text-xl active:scale-95 transition-transform`}>
            Back to Goals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-28 ${theme.bgLight}`}>
      {/* Header */}
      <div className={`bg-gradient-to-br ${theme.gradient} px-5 pt-10 pb-5 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black">Memory Match 🎮</h1>
            <p className="text-white/70 text-sm">Find all the pairs!</p>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-black ${timeLeft <= 60 ? 'text-red-300 animate-pulse' : ''}`}>{fmt(timeLeft)}</p>
            <p className="text-white/70 text-xs">{moves} moves · {pairs}/8 pairs</p>
          </div>
        </div>
      </div>

      {/* Game board */}
      <div className="p-4">
        <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => handleCard(card.id)}
              className={`aspect-square rounded-2xl text-4xl flex items-center justify-center transition-all duration-300 active:scale-90 shadow-md ${
                card.matched
                  ? `${theme.bgMed} border-2 ${theme.borderMed}`
                  : card.flipped
                  ? 'bg-white border-2 border-gray-200'
                  : `${theme.bg} text-transparent`
              }`}
            >
              {card.flipped || card.matched ? card.emoji : '❓'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
