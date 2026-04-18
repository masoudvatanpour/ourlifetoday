import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { getKids } from '../lib/storage';
import { getTheme } from '../lib/themes';

export default function KidPicker() {
  const navigate = useNavigate();
  const { supabaseUser, signOut } = useAuth();
  const kids = getKids();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col p-6">
      <div className="w-full max-w-sm mx-auto flex flex-col flex-1">

        {/* Header */}
        <div className="flex items-start justify-between pt-10 mb-8">
          <div>
            <div className="text-5xl mb-1">🌟</div>
            <h1 className="text-3xl font-black text-gray-800">Our Life Today</h1>
            {supabaseUser && (
              <p className="text-gray-400 text-xs mt-0.5 truncate max-w-[180px]">{supabaseUser.email}</p>
            )}
          </div>
          <button
            onClick={signOut}
            className="text-xs text-gray-400 border border-gray-200 bg-white px-3 py-1.5 rounded-xl mt-1"
          >
            Sign out
          </button>
        </div>

        {/* Kids */}
        <p className="text-gray-600 font-semibold text-lg mb-4">Who's checking in today?</p>
        <div className="flex flex-col gap-4 flex-1">
          {kids.map((kid) => {
            const theme = getTheme(kid.color);
            return (
              <button
                key={kid.id}
                onClick={() => navigate(`/pin/${kid.id}`)}
                className={`flex items-center gap-5 p-5 rounded-3xl shadow-lg bg-white border-2 ${theme.border} active:scale-95 transition-all hover:shadow-xl`}
              >
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-5xl ${theme.bgLight}`}>
                  {kid.avatar}
                </div>
                <div className="text-left flex-1">
                  <p className="text-2xl font-black text-gray-800">{kid.name}</p>
                  <p className={`text-sm font-medium ${theme.text}`}>Age {kid.age} · Tap to log in</p>
                </div>
                <svg className={`w-6 h-6 ${theme.text}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}

          {kids.length === 0 && (
            <div className="text-center py-16 text-gray-400 flex-1 flex flex-col items-center justify-center">
              <p className="text-6xl mb-4">👶</p>
              <p className="text-xl font-semibold">No kids yet!</p>
              <p className="text-sm mt-2">Use Parent Settings below to add your kids.</p>
            </div>
          )}
        </div>

        {/* Parent Settings */}
        <button
          onClick={() => navigate('/parent/login')}
          className="mt-8 w-full py-4 rounded-2xl bg-gray-800 text-white font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
        >
          🔑 Parent Settings
        </button>
      </div>
    </div>
  );
}
