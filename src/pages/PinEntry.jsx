import { useParams, useNavigate } from 'react-router-dom';
import { getKids } from '../lib/storage';
import { useAuth } from '../lib/AuthContext';
import { getTheme } from '../lib/themes';
import PinPad from '../components/PinPad';

export default function PinEntry() {
  const { kidId } = useParams();
  const navigate = useNavigate();
  const { loginKid } = useAuth();
  const kid = getKids().find((k) => k.id === kidId);
  const theme = kid ? getTheme(kid.color) : getTheme('purple');

  if (!kid) {
    navigate('/');
    return null;
  }

  const handleSubmit = (pin) => {
    if (loginKid(kidId, pin)) {
      navigate('/today');
      return true;
    }
    return false;
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme.bgLight}`}
    >
      <div className="w-full max-w-xs">
        <button
          onClick={() => navigate('/')}
          className="mb-8 text-gray-400 flex items-center gap-1 text-sm font-medium"
        >
          ← Back
        </button>

        <div className="text-center mb-10">
          <div className={`w-24 h-24 rounded-3xl ${theme.bgMed} flex items-center justify-center text-6xl mx-auto mb-4 shadow-md`}>
            {kid.avatar}
          </div>
          <h2 className="text-3xl font-black text-gray-800">{kid.name}</h2>
          <p className="text-gray-500 mt-1">Enter your secret PIN</p>
        </div>

        <div style={{ color: theme.primaryHex }}>
          <PinPad onSubmit={handleSubmit} primaryColor={theme.primaryHex} />
        </div>
      </div>
    </div>
  );
}
