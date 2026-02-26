import { useEffect, useRef } from 'react';
import { FileText, Globe, Webhook, Settings, History, Trash2 } from 'lucide-react';

export default function StepContextMenu({ x, y, step, phase, onClose, onSelect, hasConfig }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Keep menu within viewport
  const style = {
    position: 'fixed',
    left: Math.min(x, window.innerWidth - 240),
    top: Math.min(y, window.innerHeight - 300),
    zIndex: 9999,
  };

  const menuItems = hasConfig
    ? [
        { id: 'edit', label: 'Edit Configuration', icon: Settings, color: 'text-slate-600' },
        { id: 'versions', label: 'View Versions', icon: History, color: 'text-slate-600' },
        { divider: true },
        { id: 'remove', label: 'Remove Configuration', icon: Trash2, color: 'text-red-500' },
      ]
    : [
        { id: 'form', label: 'Create Form', icon: FileText, desc: 'AI-guided schema builder', color: 'text-blue-600' },
        { id: 'external-api', label: 'External API Call', icon: Globe, desc: 'Connect to an external system', color: 'text-amber-600' },
        { id: 'webhook', label: 'Expose Webhook', icon: Webhook, desc: 'Let external systems call in', color: 'text-green-600' },
      ];

  return (
    <div ref={menuRef} style={style} className="bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 w-56 animate-in fade-in zoom-in-95 duration-100">
      <div className="px-3 py-2 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-800 truncate">{step.name}</p>
        <p className="text-[10px] text-slate-400 uppercase tracking-wide">{phase.shortName}</p>
      </div>
      <div className="py-1">
        {menuItems.map((item, idx) => {
          if (item.divider) return <div key={idx} className="my-1 border-t border-slate-100" />;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => { onSelect(item.id, step, phase); onClose(); }}
              className="w-full flex items-start gap-2.5 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${item.color}`} />
              <div>
                <p className="text-sm font-medium text-slate-700">{item.label}</p>
                {item.desc && <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
