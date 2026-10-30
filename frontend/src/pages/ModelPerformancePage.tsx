import React, { useEffect, useState } from 'react';
import { ModelPerformanceData } from '../types';
import { api } from '../services/api';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { Activity, ShieldCheck, CheckCircle2, Sliders, ArrowRight } from 'lucide-react';

export const ModelPerformancePage: React.FC = () => {
  const [data, setData] = useState<ModelPerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Split Tab for Comparison Table (Validation vs Test)
  const [activeSplit, setActiveSplit] = useState<'test' | 'validation'>('test');

  // Selected Curve Model
  const [selectedCurveModel] = useState<string>('LightGBM');

  // Active Threshold for Confusion Matrix (0.50 Standard vs 0.45 Optimal Operational)
  const [cmThreshold, setCmThreshold] = useState<number>(0.50);

  useEffect(() => {
    api.getModelPerformance()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-2 text-slate-500 text-sm">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading model performance benchmarks...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
          Failed to load model performance: {error}
        </div>
      </div>
    );
  }

  const models = ['Logistic Regression', 'Random Forest', 'LightGBM'];

  // Dynamic confusion matrix based on selected threshold (0.50 vs 0.45)
  const cmData = cmThreshold === 0.45 
    ? {
        cm: [[4965, 898], [2812, 4271]],
        accuracy: '71.34%',
        precision: '82.63%',
        recall: '60.30%',
        label: 'Optimal Operational (0.45)'
      }
    : {
        cm: [[5103, 760], [2906, 4177]],
        accuracy: '71.68%',
        precision: '84.61%',
        recall: '58.97%',
        label: 'Standard Baseline (0.50)'
      };

  const [tn, fp] = cmData.cm[0];
  const [fn, tp] = cmData.cm[1];

  const activeCurves = data.curves[selectedCurveModel] || data.curves['LightGBM'];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Model Evaluation &amp; Reliability
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Rigorous chronological held-out validation comparing baseline linear models against ensemble gradient boosted trees.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono bg-blue-50 text-blue-800 px-3 py-1.5 rounded border border-blue-200">
          <ShieldCheck size={14} className="text-blue-600" />
          <span>Production Winner: LightGBM (AUC = 0.7709)</span>
        </div>
      </div>

      {/* SECTION 1: Comparative Model Benchmark Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Cross-Model Evaluation Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Evaluated strictly on order-placement features without target lookahead
            </p>
          </div>

          {/* Split Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded border border-slate-200 text-xs">
            <button
              onClick={() => setActiveSplit('test')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeSplit === 'test'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Held-Out Test Set (12,946 Consignments)
            </button>
            <button
              onClick={() => setActiveSplit('validation')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeSplit === 'validation'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Validation Set (29,511 Consignments)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Model Architecture</th>
                <th className="py-2.5 px-4 text-center">Accuracy</th>
                <th className="py-2.5 px-4 text-center">Precision</th>
                <th className="py-2.5 px-4 text-center">Recall (Target)</th>
                <th className="py-2.5 px-4 text-center">F1 Score</th>
                <th className="py-2.5 px-4 text-center">ROC-AUC</th>
                <th className="py-2.5 px-4 text-center">PR-AUC</th>
                <th className="py-2.5 px-4">Operational Verdict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {models.map((m) => {
                const metrics = data.model_comparison[m]?.[activeSplit];
                const isBest = m === 'LightGBM';

                return (
                  <tr key={m} className={`hover:bg-slate-50 ${isBest ? 'bg-blue-50/30' : ''}`}>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center space-x-2">
                      <span>{m}</span>
                      {isBest && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-600 text-white font-bold">
                          Selected
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center tabular-nums text-slate-700">
                      {(metrics.accuracy * 100).toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-4 text-center tabular-nums text-slate-700 font-medium">
                      {(metrics.precision * 100).toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-4 text-center tabular-nums font-bold text-blue-700">
                      {(metrics.recall * 100).toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-4 text-center tabular-nums text-slate-700">
                      {(metrics.f1_score * 100).toFixed(2)}%
                    </td>
                    <td className="py-3.5 px-4 text-center tabular-nums font-bold text-slate-900">
                      {metrics.roc_auc.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 text-center tabular-nums font-bold text-slate-900">
                      {metrics.pr_auc.toFixed(4)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {isBest ? 'Superior discrimination on non-linear route-carrier interactions.' :
                       m === 'Random Forest' ? 'Robust ensemble performance; higher tree inference latency.' :
                       'Underfits non-linear interaction between scheduled days and region.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Confusion Matrix & Decision Trade-offs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix Card */}
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Production Confusion Matrix (LightGBM Test Set)
              </h2>
              <p className="text-xs text-slate-500">
                Realized classification counts on 12,946 completely unseen orders
              </p>
            </div>
            
            {/* Interactive Threshold Selector */}
            <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded border border-slate-200 text-[11px]">
              <button
                onClick={() => setCmThreshold(0.50)}
                className={`px-2 py-0.5 rounded font-mono font-medium transition-colors ${
                  cmThreshold === 0.50 
                    ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Threshold 0.50
              </button>
              <button
                onClick={() => setCmThreshold(0.45)}
                className={`px-2 py-0.5 rounded font-mono font-medium transition-colors ${
                  cmThreshold === 0.45 
                    ? 'bg-white text-blue-700 shadow-2xs font-bold' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Threshold 0.45 (Optimal)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center my-4">
            {/* True Negative */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[11px] text-slate-500 block uppercase font-medium">True Negative (On-Time)</span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">{tn.toLocaleString()}</span>
              <p className="text-[10px] text-slate-400 mt-1">Correctly cleared for standard batch routing</p>
            </div>

            {/* False Positive */}
            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded">
              <span className="text-[11px] text-amber-800 block uppercase font-medium">False Positive (False Alarm)</span>
              <span className="text-xl font-bold text-amber-900 tabular-nums">{fp.toLocaleString()}</span>
              <p className="text-[10px] text-amber-700 mt-1">Unnecessary expedite review (Low operational cost)</p>
            </div>

            {/* False Negative */}
            <div className="p-4 bg-rose-50/60 border border-rose-200 rounded">
              <span className="text-[11px] text-rose-800 block uppercase font-medium">False Negative (Missed Delay)</span>
              <span className="text-xl font-bold text-rose-900 tabular-nums">{fn.toLocaleString()}</span>
              <p className="text-[10px] text-rose-700 mt-1">Uncaught delays (Critical operational concern)</p>
            </div>

            {/* True Positive */}
            <div className="p-4 bg-blue-50/60 border border-blue-200 rounded">
              <span className="text-[11px] text-blue-800 block uppercase font-medium">True Positive (Intercepted Delay)</span>
              <span className="text-xl font-bold text-blue-900 tabular-nums">{tp.toLocaleString()}</span>
              <p className="text-[10px] text-blue-700 mt-1">Successfully flagged for intervention before dispatch</p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span><strong>Active Metrics:</strong> Precision = <strong>{cmData.precision}</strong> | Recall = <strong>{cmData.recall}</strong> | Accuracy = <strong>{cmData.accuracy}</strong></span>
            <span className="font-mono text-[11px] text-slate-500">N = 12,946</span>
          </div>
        </div>

        {/* Operational Decision Threshold Analysis */}
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Operational Threshold Optimization
              </h2>
              <p className="text-xs text-slate-500">
                Tuning prediction threshold to balance Recall vs False Alarms
              </p>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-mono font-bold border border-emerald-200">
              Selected: 0.45
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2 px-2.5">Threshold</th>
                  <th className="py-2 px-2.5 text-center">Recall</th>
                  <th className="py-2 px-2.5 text-center">Precision</th>
                  <th className="py-2 px-2.5 text-center">F1 Score</th>
                  <th className="py-2 px-2.5 text-right">Flagged Consignments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.threshold_analysis.slice(2, 7).map((t) => {
                  const isSelected = t.threshold === data.optimal_threshold;
                  return (
                    <tr key={t.threshold} className={isSelected ? 'bg-blue-50/50 font-semibold' : 'hover:bg-slate-50'}>
                      <td className="py-2 px-2.5 font-mono text-slate-900">
                        {t.threshold.toFixed(2)} {isSelected && '(Default)'}
                      </td>
                      <td className="py-2 px-2.5 text-center tabular-nums text-blue-700 font-bold">
                        {(t.recall * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-2.5 text-center tabular-nums text-slate-700">
                        {(t.precision * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-2.5 text-center tabular-nums text-slate-700">
                        {(t.f1_score * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-2.5 text-right tabular-nums text-slate-600">
                        {t.flagged_orders_count.toLocaleString()} ({t.flagged_orders_percentage}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-slate-500 mt-3">
            Lowering threshold to 0.35 yields a 91.2% catch rate (Recall) for mission-critical operations where any delay causes contract cancellation.
          </p>
        </div>
      </div>

      {/* SECTION 3: Interactive ROC Curve & Precision-Recall Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Curve */}
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Receiver Operating Characteristic (ROC Curve)
              </h2>
              <p className="text-xs text-slate-500">True Positive Rate vs False Positive Rate</p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600">
              AUC = {data.model_comparison[selectedCurveModel]?.test?.roc_auc.toFixed(4)}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeCurves.roc} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="fpr" tick={{ fontSize: 10, fill: '#64748B' }} label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748B' }} />
                <YAxis dataKey="tpr" tick={{ fontSize: 10, fill: '#64748B' }} label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748B' }} domain={[0, 1]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '4px', color: '#FFF', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="tpr" name="LightGBM ROC" stroke="#2563EB" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PR Curve */}
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Precision-Recall (PR Curve)
              </h2>
              <p className="text-xs text-slate-500">Precision vs Recall across decision thresholds</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600">
              PR-AUC = {data.model_comparison[selectedCurveModel]?.test?.pr_auc.toFixed(4)}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activeCurves.pr} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="recall" tick={{ fontSize: 10, fill: '#64748B' }} label={{ value: 'Recall', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748B' }} />
                <YAxis dataKey="precision" tick={{ fontSize: 10, fill: '#64748B' }} label={{ value: 'Precision', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748B' }} domain={[0.4, 1]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '4px', color: '#FFF', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="precision" name="Precision" stroke="#059669" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
