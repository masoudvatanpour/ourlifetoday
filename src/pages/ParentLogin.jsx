import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import PinPad from '../components/PinPad';

export default function ParentLogin() {
  const navigate = useNavigate();
  const { loginParent } = useAuth();

  const handleSubmit = (pin) => {
    if (loginParent(pin)) {
      navigate('/parent');
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-800 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <button onClick={() => navigate('/')} className="mb-8 text-gray-400 flex items-center gap-1 text-sm font-medium">
          ← Back
        </button>

        <div className="text-center mb-10">
          <div className="w-24 h-24 rounded-3xl bg-gray-700 flex items-center justify-center text-5xl mx-auto mb-4">
            🔑
          </div>
          <h2 className="text-3xl font-black text-white">Parent Access</h2>
          <p className="text-gray-400 mt-1">Enter your 4-digit PIN</p>
          <p className="text-gray-500 text-xs mt-1">Default PIN: 0000</p>
        </div>

        <div className="text-white">
          <PinPad onSubmit={handleSubmit} primaryColor="#6b7280" />
        </div>
      </div>
    </div>
  );
}
