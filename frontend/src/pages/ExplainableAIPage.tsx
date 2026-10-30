import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Sparkles, HelpCircle, CheckCircle2, TrendingUp, Info } from 'lucide-react';

export const ExplainableAIPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getExplainability()
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
          <span>Loading Explainable AI intelligence...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
          Failed to load explainability data: {error}
        </div>
      </div>
    );
  }

  const topFeatures = data.top_features || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Model Decision Intelligence (Explainable AI)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Interpreting machine learning risk predictions through Shapley Additive Explanations (TreeSHAP).
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-500 font-mono bg-slate-100 px-3 py-1.5 rounded border border-slate-200">
          <Sparkles size={13} className="text-blue-600" />
          <span>Evaluated Feature Space: {data.feature_count} Features</span>
        </div>
      </div>

      {/* TOP SECTION: Executive Summary & Methodological Foundation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-5 rounded-md border border-slate-200 shadow-2xs space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
            <Info size={16} className="text-blue-600" />
            <span>Why Explainability Matters in Logistics</span>
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Black-box algorithms are unacceptable in critical supply chain operations. Warehouse managers and transportation coordinators need to understand <em>why</em> an order has been flagged for delay before taking expensive operational actions such as expediting linehaul or paying overtime.
          </p>
          <p className="text-xs text-slate-600 leading-relaxed">
            Our framework calculates exact mathematical Shapley values for tree-based models, isolating each attribute’s marginal contribution to the final risk score.
          </p>
        </div>

        <div className="bg-slate-900 text-slate-200 p-5 rounded-md border border-slate-800 shadow-2xs space-y-2.5">
          <span className="text-[10px] font-bold tracking-wider text-blue-400 uppercase">
            Scientific Framework
          </span>
          <h3 className="text-sm font-bold text-white">TreeSHAP Architecture</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Game-theoretic feature attribution grounded in cooperative game theory (Lundberg et al., Nature Machine Intelligence 2020).
          </p>
          <div className="pt-2 text-[11px] text-slate-400 font-mono">
            Sample: 1,000 Chronological Validation Consignments
          </div>
        </div>
      </div>

      {/* GLOBAL FEATURE IMPORTANCE CHART */}
      <div className="bg-white p-6 rounded-md border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Global Feature Importance Ranking (Mean |SHAP Value|)
            </h2>
            <p className="text-xs text-slate-500">
              Magnitude of impact each order attribute exerts across all predictions
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Top 12 Most Influential Features
          </span>
        </div>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={topFeatures.slice(0, 12)} 
              layout="vertical"
              margin={{ top: 10, right: 30, left: 140, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} />
              <YAxis 
                type="category" 
                dataKey="feature" 
                tick={{ fontSize: 10, fill: '#1E293B' }} 
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '4px', color: '#FFF', fontSize: '12px' }}
                formatter={(val: any) => [Number(val).toFixed(4), 'Mean |SHAP Value|']}
              />
              <Bar 
                dataKey="importance" 
                name="Impact Magnitude" 
                fill="#2563EB" 
                radius={[0, 3, 3, 0]} 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* FEATURE ATTRIBUTION BREAKDOWN TABLE */}
      <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Operational Feature Interpretability Guide
            </h2>
            <p className="text-xs text-slate-500">
              Translating model weights into operational logistics drivers
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Feature Name</th>
                <th className="py-2.5 px-4 text-center">Correlation Direction</th>
                <th className="py-2.5 px-4 text-right">SHAP Impact</th>
                <th className="py-2.5 px-4">Operational Translation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topFeatures.slice(0, 10).map((f: any, idx: number) => {
                const isIncreasing = f.correlation_direction === 'Risk Increasing';
                
                // Narrative logistics translations
                let narrative = '';
                if (f.feature.includes('Shipping Mode_First Class')) {
                  narrative = 'First Class contracts a strict 1-day fulfillment window; historical data shows 95.3% late delivery frequency, making this the primary positive risk driver.';
                } else if (f.feature.includes('Days for shipment (scheduled)')) {
                  narrative = 'Longer scheduled shipping windows (e.g., 4 days for Standard Class) provide operational buffer, strongly decreasing late-delivery risk (Spearman rho = -0.65).';
                } else if (f.feature.includes('Type_TRANSFER')) {
                  narrative = 'Transfer payments exhibit lower historical delay frequencies once released compared to manual or check payment review flows.';
                } else if (f.feature.includes('order_hour')) {
                  narrative = 'Orders submitted later in the afternoon/evening have tighter windows before outbound carrier cutoff, increasing risk.';
                } else if (f.feature.includes('Shipping Mode_Second Class')) {
                  narrative = 'Second Class imposes an aggressive 2-day SLA window with a 76.6% historical delay rate, increasing risk relative to Standard Class.';
                } else if (f.feature.includes('Order Region_Western Europe')) {
                  narrative = 'Cross-border multi-tier transit through European entry hubs introduces customs variability, increasing risk.';
                } else if (f.feature.includes('Sales') || f.feature.includes('Order Item Total')) {
                  narrative = 'Larger consignment order values involve multi-item picking and secondary packaging checks, slightly shifting risk.';
                } else if (f.feature.includes('Order Item Discount Rate')) {
                  narrative = 'Promotional discount rate variation correlates with customer basket size and seasonal dispatch volume.';
                } else {
                  narrative = 'Specific customer segment, department, and geographical route combination shifting historical dispatch velocity.';
                }

                return (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {f.feature}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                        isIncreasing ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {f.correlation_direction}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums font-mono font-semibold text-slate-800">
                      {f.importance.toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-slate-600 leading-snug">
                      {narrative}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
