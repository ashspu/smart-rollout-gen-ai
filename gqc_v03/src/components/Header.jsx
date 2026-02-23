import { ArrowLeft } from 'lucide-react';

export default function Header({ onBack }) {
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

          {/* Attributions */}
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
          </div>
        </div>
      </div>
    </header>
  );
}
