import { pecoProgram, lifecycleStates } from '../data/pecoProgram';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export default function LifecycleView() {
  const { lifecycle } = pecoProgram.currentState;
  const total = Object.values(lifecycle).reduce((a, b) => a + b, 0);
  
  const data = lifecycleStates.map(state => ({
    name: state.label,
    value: lifecycle[state.key],
    color: state.color,
    percentage: ((lifecycle[state.key] / total) * 100).toFixed(1),
  }));

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Lifecycle Distribution</h3>
          <p className="text-sm text-slate-400">Current state of all meters in program</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{total.toLocaleString()}</p>
          <p className="text-xs text-slate-400">Total meters</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8">
        {/* Donut Chart */}
        <div className="w-full lg:w-1/3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                }}
                formatter={(value) => [value.toLocaleString() + ' meters', '']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* State Breakdown */}
        <div className="w-full lg:w-2/3 grid grid-cols-2 md:grid-cols-3 gap-4">
          {data.map((state, idx) => (
            <div 
              key={idx}
              className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: state.color }}
                />
                <span className="text-sm text-slate-400">{state.name}</span>
              </div>
              <p className="text-xl font-bold text-white">{state.value.toLocaleString()}</p>
              <p className="text-xs text-slate-500">{state.percentage}% of total</p>
              
              {/* Progress bar */}
              <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${state.percentage}%`,
                    backgroundColor: state.color 
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
