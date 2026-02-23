import { CheckCircle2, XCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

// Simulated event stream - process lifecycle events
const events = [
  { id: 1, type: 'complete', meter: 'MTR-2847291', address: '1423 Walnut St, Philadelphia', time: '2 min ago', region: 'Philadelphia' },
  { id: 2, type: 'complete', meter: 'MTR-1938472', address: '892 Main St, Norristown', time: '3 min ago', region: 'Montgomery' },
  { id: 3, type: 'failed', meter: 'MTR-3847291', address: '234 Oak Ave, Media', time: '5 min ago', reason: 'No Access', region: 'Delaware' },
  { id: 4, type: 'complete', meter: 'MTR-9182734', address: '567 Pine Rd, West Chester', time: '6 min ago', region: 'Chester' },
  { id: 5, type: 'complete', meter: 'MTR-2738194', address: '789 Elm St, Doylestown', time: '8 min ago', region: 'Bucks' },
  { id: 6, type: 'scheduled', meter: 'MTR-4829173', address: '321 Market St, Philadelphia', time: '9 min ago', region: 'Philadelphia' },
  { id: 7, type: 'failed', meter: 'MTR-1928374', address: '456 Ridge Ave, Conshohocken', time: '11 min ago', reason: 'Meter Damage', region: 'Montgomery' },
  { id: 8, type: 'complete', meter: 'MTR-8374652', address: '678 Cedar Ln, Bryn Mawr', time: '12 min ago', region: 'Montgomery' },
  { id: 9, type: 'verifying', meter: 'MTR-2938475', address: '890 Spruce St, Philadelphia', time: '14 min ago', region: 'Philadelphia' },
  { id: 10, type: 'complete', meter: 'MTR-4738291', address: '123 Broad St, Philadelphia', time: '15 min ago', region: 'Philadelphia' },
];

const eventConfig = {
  complete: {
    icon: CheckCircle2,
    color: 'text-green-400',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
    label: 'Completed',
  },
  failed: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    label: 'Exception',
  },
  scheduled: {
    icon: Clock,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    label: 'Scheduled',
  },
  verifying: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    label: 'Verifying',
  },
};

export default function EventStream() {
  // Calculate success rate from visible events
  const completeCount = events.filter(e => e.type === 'complete').length;
  const failedCount = events.filter(e => e.type === 'failed').length;
  const totalProcessed = completeCount + failedCount;
  const successRate = totalProcessed > 0 ? ((completeCount / totalProcessed) * 100).toFixed(0) : 0;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Live Events</h3>
          <p className="text-sm text-slate-400">Process state changes</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <span className="text-sm font-medium text-green-400">{successRate}% success</span>
        </div>
      </div>

      {/* Event list */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {events.map((event) => {
          const config = eventConfig[event.type];
          const Icon = config.icon;
          
          return (
            <div 
              key={event.id}
              className={`flex items-center gap-3 p-3 rounded-xl ${config.bg} border ${config.border} transition-all hover:scale-[1.01]`}
            >
              <Icon className={`w-5 h-5 ${config.color} flex-shrink-0`} />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">{event.address}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{event.meter}</span>
                  <span>·</span>
                  <span>{event.region}</span>
                  {event.reason && (
                    <>
                      <span>·</span>
                      <span className="text-red-400">{event.reason}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="text-right flex-shrink-0">
                <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
                <p className="text-xs text-slate-500">{event.time}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary bar */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Last 15 minutes</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-green-400 font-medium">{completeCount}</span>
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-medium">{failedCount}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
