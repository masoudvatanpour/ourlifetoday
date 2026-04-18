import { useNavigate } from 'react-router-dom';
import { getKids } from '../lib/storage';
import { getTheme } from '../lib/themes';

export default function KidPicker() {
  const navigate = useNavigate();
  const kids = getKids();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">🌟</div>
          <h1 className="text-4xl font-black text-gray-800">Our Life Today</h1>
          <p className="text-gray-500 mt-2 text-lg">Who's checking in today?</p>
        </div>

        <div className="flex flex-col gap-4">
          {kids.map((kid) => {
            const theme = getTheme(kid.color);
            return (
              <button
                key={kid.id}
                onClick={() => navigate(`/pin/${kid.id}`)}
                className={`flex items-center gap-5 p-5 rounded-3xl shadow-lg bg-white border-2 ${theme.border} active:scale-95 transition-all hover:shadow-xl`}
              >
                <div
                  className={`w-20 h-20 rounded-2xl flex items-center justify-center text-5xl ${theme.bgLight}`}
                >
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
            <div className="text-center py-8 text-gray-400">
              <p className="text-6xl mb-4">👶</p>
              <p className="text-lg">No kids yet. Ask a parent to set things up!</p>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/parent/login')}
          className="mt-8 w-full py-3 rounded-2xl bg-white/70 text-gray-500 text-sm font-semibold border border-gray-200 active:scale-95 transition-all"
        >
          🔑 Parent access
        </button>
      </div>
    </div>
  );
}
