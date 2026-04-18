import { useState } from 'react';

export default function PinPad({ onSubmit, primaryColor = '#9333ea' }) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleDigit = (d) => {
    if (pin.length >= 4 || submitting) return;
    const newPin = pin + d;
    setPin(newPin);
    if (newPin.length === 4) {
      setSubmitting(true);
      setTimeout(() => {
        const success = onSubmit(newPin);
        if (!success) {
          setShake(true);
          setTimeout(() => {
            setShake(false);
            setPin('');
            setSubmitting(false);
          }, 600);
        }
      }, 100);
    }
  };

  const handleDelete = () => {
    if (!submitting) setPin((p) => p.slice(0, -1));
  };

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

  return (
    <div className="flex flex-col items-center gap-8">
      <div className={`flex gap-5 ${shake ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full border-2 transition-all duration-150"
            style={{
              backgroundColor: i < pin.length ? primaryColor : 'transparent',
              borderColor: primaryColor,
              transform: i < pin.length ? 'scale(1.2)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {digits.map((d, i) =>
          d === '' ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => (d === '⌫' ? handleDelete() : handleDigit(d))}
              className="w-20 h-20 rounded-full bg-white shadow-md hover:shadow-lg text-2xl font-bold text-gray-700 active:scale-90 transition-all duration-100 flex items-center justify-center select-none"
            >
              {d}
            </button>
          )
        )}
      </div>
    </div>
  );
}
