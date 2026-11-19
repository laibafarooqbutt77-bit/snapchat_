import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { LumoLogo } from '../common/LumoLogo';
import { Camera, Flame, MapPin, Sparkles, ArrowRight, UserPlus, LogIn } from 'lucide-react';

export const AuthOnboardingScreen: React.FC = () => {
  const { state, login, signup, completeOnboarding } = useApp();
  const [step, setStep] = useState<'onboarding' | 'auth'>(
    state.hasCompletedOnboarding ? 'auth' : 'onboarding'
  );
  const [slide, setSlide] = useState(0);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const [username, setUsername] = useState('alex_rivera');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('lumo2026');
  const [birthday, setBirthday] = useState('2001-06-14');
  const [bio, setBio] = useState('');

  const slides = [
    {
      icon: Camera,
      title: 'Live Camera & Face Lenses',
      desc: 'Capture crystal-clear photos and videos with 37 real-time filters, face lenses, and drawing tools.',
    },
    {
      icon: Flame,
      title: 'Keep Your Snapstreaks Alive',
      desc: 'Exchange daily Snaps with friends, send voice notes, and launch instant audio or video calls.',
    },
    {
      icon: MapPin,
      title: 'Stories, Spotlight & Snap Map',
      desc: 'Share 24-hour Stories, customize your Bitmoji avatar, and discover trending moments nearby.',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      login(username, password);
    } else {
      signup({ username, displayName, password, birthday, bio });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#101010] border border-[#292929] rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <LumoLogo size={40} withWordmark />
          {step === 'onboarding' && (
            <button
              onClick={() => {
                completeOnboarding();
                setStep('auth');
              }}
              className="text-xs font-semibold text-[#A1A1A1] hover:text-white transition-colors min-h-[40px] px-2"
            >
              Skip
            </button>
          )}
        </div>

        {step === 'onboarding' ? (
          <motion.div
            key={slide}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="h-52 rounded-2xl bg-[#181818] border border-[#292929] flex flex-col items-center justify-center p-6 text-center">
              {(() => {
                const Icon = slides[slide].icon;
                return (
                  <div className="w-16 h-16 rounded-2xl bg-[#FFFC00] text-black flex items-center justify-center mb-4">
                    <Icon className="w-8 h-8" />
                  </div>
                );
              })()}
              <h2 className="text-xl font-bold tracking-tight mb-2">{slides[slide].title}</h2>
              <p className="text-sm text-[#A1A1A1] leading-relaxed">{slides[slide].desc}</p>
            </div>

            <div className="flex items-center justify-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  aria-label={`Slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === slide ? 'w-7 bg-[#FFFC00]' : 'w-2 bg-[#292929]'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => {
                if (slide < slides.length - 1) setSlide(slide + 1);
                else {
                  completeOnboarding();
                  setStep('auth');
                }
              }}
              className="w-full h-12 rounded-xl bg-[#FFFC00] text-black font-bold text-sm flex items-center justify-center gap-2 hover:brightness-95 transition"
            >
              {slide < slides.length - 1 ? 'Next' : 'Get Started'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-1 p-1 bg-[#181818] rounded-xl mb-6 border border-[#292929]">
              <button
                type="button"
                onClick={() => setMode('login')}
                className={`h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition ${
                  mode === 'login' ? 'bg-[#FFFC00] text-black' : 'text-[#A1A1A1] hover:text-white'
                }`}
              >
                <LogIn className="w-4 h-4" />
                Log In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`h-10 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition ${
                  mode === 'signup' ? 'bg-[#FFFC00] text-black' : 'text-[#A1A1A1] hover:text-white'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#A1A1A1] mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="alex_rivera"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#181818] border border-[#292929] text-white text-sm focus:outline-none focus:border-[#FFFC00]"
                  required
                />
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#A1A1A1] mb-1.5">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full h-11 px-3.5 rounded-xl bg-[#181818] border border-[#292929] text-white text-sm focus:outline-none focus:border-[#FFFC00]"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[#A1A1A1] mb-1.5">
                        Birthday
                      </label>
                      <input
                        type="date"
                        value={birthday}
                        onChange={(e) => setBirthday(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl bg-[#181818] border border-[#292929] text-white text-sm focus:outline-none focus:border-[#FFFC00]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#A1A1A1] mb-1.5">Bio</label>
                      <input
                        type="text"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Vibes & snaps"
                        className="w-full h-11 px-3 rounded-xl bg-[#181818] border border-[#292929] text-white text-sm focus:outline-none focus:border-[#FFFC00]"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-[#A1A1A1] mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#181818] border border-[#292929] text-white text-sm focus:outline-none focus:border-[#FFFC00]"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#FFFC00] text-black font-bold text-sm hover:brightness-95 transition cursor-pointer"
              >
                {mode === 'login' ? 'Log In to Lumo' : 'Create Account'}
              </button>
            </form>

            <div className="mt-5 pt-5 border-t border-[#292929]">
              <button
                type="button"
                onClick={() => login('alex_rivera')}
                className="w-full h-11 rounded-xl bg-[#181818] border border-[#292929] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:border-[#FFFC00] transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#FFFC00]" />
                Quick Demo Login as @alex_rivera
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
