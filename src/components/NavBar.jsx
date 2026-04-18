import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { getTheme } from '../lib/themes';
import { getAvailableGameUnlock } from '../lib/storage';

const KID_TABS = [
  { path: '/today', icon: '🏠', label: 'Today' },
  { path: '/history', icon: '📅', label: 'History' },
  { path: '/dashboard', icon: '📊', label: 'Stats' },
  { path: '/report', icon: '💡', label: 'Report' },
  { path: '/rewards', icon: '⭐', label: 'Rewards' },
];

const PARENT_TABS = [
  { path: '/parent', icon: '🏠', label: 'Home' },
  { path: '/parent/kids', icon: '👶', label: 'Kids' },
  { path: '/parent/goals', icon: '✅', label: 'Goals' },
  { path: '/parent/report', icon: '📊', label: 'Reports' },
];

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentKid, isParent, logout } = useAuth();

  if (!currentKid && !isParent) return null;

  const tabs = currentKid ? KID_TABS : PARENT_TABS;
  const theme = currentKid ? getTheme(currentKid.color) : null;
  const hasGameUnlock = currentKid ? !!getAvailableGameUnlock(currentKid.id) : false;

  const isActive = (path) => {
    if (path === '/today' || path === '/parent') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg z-40 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const isGame = tab.path === '/game';
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all active:scale-90 relative ${
                active ? 'scale-105' : 'opacity-60'
              }`}
            >
              <span className="text-2xl leading-none relative">
                {tab.icon}
                {isGame && hasGameUnlock && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                )}
              </span>
              <span
                className={`text-xs font-semibold ${
                  active
                    ? theme
                      ? theme.navActive
                      : 'text-gray-700'
                    : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
              {active && (
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: theme?.primaryHex || '#374151' }}
                />
              )}
            </button>
          );
        })}

        {/* Game tab (kid only) */}
        {currentKid && (
          <button
            onClick={() => navigate('/game')}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all active:scale-90 relative ${
              isActive('/game') ? 'scale-105' : hasGameUnlock ? 'opacity-100' : 'opacity-40'
            }`}
          >
            <span className="text-2xl leading-none relative">
              🎮
              {hasGameUnlock && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </span>
            <span
              className={`text-xs font-semibold ${
                isActive('/game') ? theme?.navActive : hasGameUnlock ? 'text-red-500' : 'text-gray-400'
              }`}
            >
              Game
            </span>
          </button>
        )}

        <button
          onClick={logout}
          className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl opacity-50 active:scale-90"
        >
          <span className="text-2xl leading-none">🚪</span>
          <span className="text-xs font-semibold text-gray-400">Exit</span>
        </button>
      </div>
    </nav>
  );
}
