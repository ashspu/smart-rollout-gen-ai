import { pecoProgram } from '../data/pecoProgram';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function CohortView() {
  const { cohorts } = pecoProgram;

  const riskColors = {
    critical: '#ef4444',
    high: '#f97316',
    moderate: '#f59e0b',
    low: '#22c55e',
    minimal: '#10b981',
  };

  const statusColors = {
    'on-track': 'text-green-400 bg-green-500/10',
    'at-risk': 'text-amber-400 bg-amber-500/10',
    'ahead': 'text-platform-400 bg-platform-500/10',
    'not-started': 'text-slate-400 bg-slate-500/10',
  };

  const chartData = cohorts.map(c => ({
    name: c.name.split(' ')[0],
    complete: c.complete,
    remaining: c.size - c.complete,
    color: riskColors[c.riskLevel],
  }));

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Cohort Progress</h3>
          <p className="text-sm text-slate-400">By installation year</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="horizontal">
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 10 }}
            />
            <YAxis 
              hide
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
              }}
              formatter={(value) => [value.toLocaleString() + ' meters', '']}
            />
            <Bar dataKey="complete" stackId="a" radius={[0, 0, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <Bar dataKey="remaining" stackId="a" fill="#1e293b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Cohort List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {cohorts.map((cohort) => (
          <div 
            key={cohort.id}
            className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-2 h-8 rounded-full"
                style={{ backgroundColor: riskColors[cohort.riskLevel] }}
              />
              <div>
                <p className="text-sm font-medium text-white">{cohort.name}</p>
                <p className="text-xs text-slate-500">
                  {cohort.size.toLocaleString()} meters • {(cohort.failureProbability * 100).toFixed(0)}% failure risk
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">
                {cohort.size > 0 ? ((cohort.complete / cohort.size) * 100).toFixed(0) : 0}%
              </p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs ${statusColors[cohort.status]}`}>
                {cohort.status.replace('-', ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
