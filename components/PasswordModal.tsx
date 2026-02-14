import React, { useState } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onPasswordCorrect: () => void;
  correctPassword: string;
  mode?: 'unlock' | 'lock'; // 'unlock' = unlocking site, 'lock' = locking site
}

export const PasswordModal: React.FC<Props> = ({ isOpen, onPasswordCorrect, correctPassword, mode = 'unlock' }) => {
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (passwordInput.trim() === correctPassword) {
      setPasswordInput("");
      setError("");
      onPasswordCorrect();
    } else {
      setError("קוד שגוי. אנא נסה שוב.");
      setPasswordInput("");
    }
  };

  const isLockMode = mode === 'lock';
  const title = isLockMode ? "נעילת האתר" : "האתר נעול";
  const description = isLockMode 
    ? "אנא הזן קוד גישה כדי לנעול את האתר" 
    : "אנא הזן קוד גישה כדי להמשיך";
  const buttonText = isLockMode ? "נעל" : "כניסה";

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`bg-slate-900 border-2 rounded-3xl p-8 max-w-md w-full shadow-2xl relative ${
        isLockMode ? 'border-red-500/50' : 'border-amber-500/50'
      }`}>
        <div className="absolute top-4 left-4">
          <Lock className={`w-8 h-8 ${isLockMode ? 'text-red-500' : 'text-amber-500'}`} />
        </div>
        
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-white mb-2">{title}</h2>
          <p className="text-slate-300 text-lg">{description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setError("");
              }}
              placeholder="הזן קוד גישה"
              className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-4 text-white text-xl text-center focus:outline-none focus:border-amber-500 transition-colors"
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-200 p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className={`w-full font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${
              isLockMode 
                ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white'
            }`}
          >
            {buttonText}
          </button>
        </form>
      </div>
    </div>
  );
};
