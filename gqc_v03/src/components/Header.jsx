import { ArrowLeft, LogOut } from 'lucide-react';

export default function Header({ onBack, userEmail, onSignOut }) {
  return (
    <header className="sticky top-0 z-50" style={{
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.6)'
    }}>
      <div className="max-w-6xl mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 -ml-2 rounded-full text-slate-500 hover:text-cyan-600 hover:bg-white/60 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {/* Main Logo - Smart Rollout */}
            <img
              src="/smartrollout-logo.png"
              alt="Smart Rollout"
              className="h-12 object-contain"
            />
          </div>

          {/* Right side: attributions + user */}
          <div className="flex items-center gap-4">
            <img
              src="/smartutilities-logo.png"
              alt="Smart Utilities"
              className="h-8 object-contain"
            />
            <span className="text-sm font-medium bg-gradient-to-r from-cyan-500 to-pink-500 bg-clip-text text-transparent">powered by</span>
            <img
              src="/celonis-logo.png"
              alt="Celonis"
              className="h-6 object-contain"
            />

            {userEmail && (
              <>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <span className="text-xs text-slate-500 max-w-[160px] truncate">{userEmail}</span>
                <button
                  onClick={onSignOut}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
