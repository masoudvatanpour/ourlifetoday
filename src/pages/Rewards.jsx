import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { getTheme } from '../lib/themes';
import { getRewards, getGameUnlocks, getAvailableGameUnlock } from '../lib/storage';
import { formatShort } from '../lib/dateUtils';

function TrophyCard({ reward }) {
  return (
    <div className="bg-white rounded-2xl p-3 flex flex-col items-center gap-1 shadow-sm border border-yellow-100 animate-fade-in">
      <span className="text-4xl">{reward.icon}</span>
      <p className="text-xs font-bold text-gray-700 text-center">{reward.name}</p>
      <p className="text-xs text-gray-400">{formatShort(reward.earnedAt?.split('T')[0])}</p>
    </div>
  );
}

export default function Rewards() {
  const { currentKid } = useAuth();
  const navigate = useNavigate();
  const theme = getTheme(currentKid?.color);

  const { stars, trophies, gameUnlocks, hasUnlock } = useMemo(() => {
    if (!currentKid) return { stars: [], trophies: [], gameUnlocks: [], hasUnlock: false };
    const all = getRewards(currentKid.id);
    const stars = all.filter((r) => r.type === 'star');
    const trophies = all.filter((r) => r.type === 'trophy');
    const gameUnlocks = getGameUnlocks(currentKid.id);
    const hasUnlock = !!getAvailableGameUnlock(currentKid.id);
    return { stars, trophies, gameUnlocks, hasUnlock };
  }, [currentKid]);

  if (!currentKid) return null;

  return (
    <div className={`min-h-screen pb-28 ${theme.bgLight}`}>
      <div className={`bg-gradient-to-br ${theme.gradient} px-5 pt-12 pb-6 text-white`}>
        <h1 className="text-3xl font-black mb-1">⭐ My Rewards</h1>
        <p className="text-white/70 text-sm">Your amazing collection!</p>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Star counter */}
        <div className={`bg-white rounded-3xl p-6 shadow-sm border-2 border-yellow-200`}>
          <div className="flex items-center gap-4">
            <div className="text-7xl">⭐</div>
            <div>
              <p className="text-5xl font-black text-yellow-500">{stars.length}</p>
              <p className="text-lg font-bold text-gray-600">Stars earned</p>
              <p className="text-sm text-gray-400">1 star per perfect day</p>
            </div>
          </div>
        </div>

        {/* Game unlock banner */}
        {hasUnlock && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-5 text-white text-center shadow-lg">
            <p className="text-4xl mb-2">🎮</p>
            <p className="text-xl font-black">Game Ready!</p>
            <p className="text-sm opacity-80 mb-3">You earned a game session this week!</p>
            <button
              onClick={() => navigate('/game')}
              className="bg-white text-purple-600 font-black px-8 py-3 rounded-2xl text-lg active:scale-95 transition-transform"
            >
              Play Now! 🕹️
            </button>
          </div>
        )}

        {/* Trophies */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🏆</span>
            <h3 className="font-black text-gray-700 text-xl">Trophies ({trophies.length})</h3>
          </div>
          {trophies.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-4xl mb-2">🏅</p>
              <p className="font-medium">Complete your goals for a full week to earn a trophy!</p>
              <p className="text-sm mt-1">Need {currentKid.weeklyTarget || 5} perfect days in a week</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {trophies.map((t) => <TrophyCard key={t.id} reward={t} />)}
            </div>
          )}
        </div>

        {/* Game history */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🎮</span>
            <h3 className="font-black text-gray-700 text-xl">Game history</h3>
          </div>
          {gameUnlocks.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              <p className="text-sm">No games played yet — earn a trophy to unlock!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {gameUnlocks.map((u) => (
                <div key={u.id} className={`flex items-center justify-between p-3 rounded-xl ${u.used ? 'bg-gray-50' : 'bg-green-50'}`}>
                  <div>
                    <p className="font-semibold text-sm text-gray-700">Week of {formatShort(u.weekOf)}</p>
                    <p className="text-xs text-gray-400">{u.used ? 'Played ✓' : 'Available!'}</p>
                  </div>
                  {!u.used && (
                    <button onClick={() => navigate('/game')} className="bg-green-500 text-white text-xs px-3 py-1 rounded-lg font-bold">
                      Play
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Motivational message */}
        <div className={`${theme.bgMed} rounded-2xl p-4 text-center`}>
          <p className={`text-sm font-semibold ${theme.text}`}>
            {stars.length === 0
              ? '✨ Complete all your goals today to earn your first star!'
              : stars.length < 7
              ? `🌟 ${7 - stars.length} more stars to get a full week of stars!`
              : `🎉 You have ${stars.length} stars — you're incredible!`}
          </p>
        </div>
      </div>
    </div>
  );
}
