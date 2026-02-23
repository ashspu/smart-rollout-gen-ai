export default function StatusBar() {
  return (
    <div className="mb-8">
      {/* Program Title */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PECO AMI 2.0 Rollout</h1>
          <p className="text-slate-500">1.72 million meters · Day 395 of program</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium text-green-700">Live</span>
        </div>
      </div>

      {/* Three Simple Numbers */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-6 text-center">
          <p className="text-4xl font-bold text-green-600">438,000</p>
          <p className="text-slate-500 mt-1">Complete</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-4xl font-bold text-blue-600">68,700</p>
          <p className="text-slate-500 mt-1">In Progress</p>
        </div>
        <div className="card p-6 text-center">
          <p className="text-4xl font-bold text-amber-600">8,300</p>
          <p className="text-slate-500 mt-1">Need Attention</p>
        </div>
      </div>
    </div>
  );
}
