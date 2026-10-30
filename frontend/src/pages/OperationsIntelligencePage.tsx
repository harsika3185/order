import React, { useEffect, useState } from 'react';
import { OperationsRecommendation } from '../types';
import { api } from '../services/api';
import { 
  Compass, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  ShieldAlert 
} from 'lucide-react';

export const OperationsIntelligencePage: React.FC = () => {
  const [recommendations, setRecommendations] = useState<OperationsRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getOperationsIntelligence()
      .then(res => {
        setRecommendations(res.recommendations);
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
          <span>Loading operations intelligence...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
          Failed to load operations intelligence: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Operational Insights &amp; Recommendations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Evidence-based logistics interventions derived directly from empirical data distributions and model feature attributions.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>4 Production Action Protocols Active</span>
        </div>
      </div>

      {/* RECOMMENDATIONS CARDS */}
      <div className="space-y-6">
        {recommendations.map((rec) => {
          const isCritical = rec.priority === 'Critical';
          const isHigh = rec.priority === 'High';

          return (
            <div 
              key={rec.id} 
              className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden"
            >
              {/* Card Header Bar */}
              <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                    isCritical ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                    isHigh ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {rec.priority} Priority
                  </span>
                  <h2 className="text-sm font-bold text-slate-900">
                    {rec.finding}
                  </h2>
                </div>

                {/* Metrics Badges */}
                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1 text-slate-500 font-mono">
                    <span>Impacted Volume:</span>
                    <strong className="text-slate-800">{rec.order_count.toLocaleString()} Orders</strong>
                  </div>
                  <div className="flex items-center space-x-1 font-mono">
                    <span className="text-slate-500">Observed Risk:</span>
                    <strong className="text-rose-600 font-bold">{rec.observed_risk_rate}%</strong>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-4">
                {/* Supporting Empirical Evidence */}
                <div>
                  <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Supporting Data &amp; Empirical Findings
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {rec.supporting_data}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {/* Concrete Recommended Action */}
                  <div className="p-4 bg-blue-50/70 border border-blue-200 rounded text-xs space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-blue-900 font-bold uppercase tracking-wider text-[11px]">
                      <Compass size={14} className="text-blue-700" />
                      <span>Recommended Operational Protocol:</span>
                    </div>
                    <p className="text-blue-950 font-medium leading-relaxed">
                      {rec.recommended_action}
                    </p>
                  </div>

                  {/* Commercial Relevance */}
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded text-xs space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-emerald-900 font-bold uppercase tracking-wider text-[11px]">
                      <DollarSign size={14} className="text-emerald-700" />
                      <span>Business &amp; Cost Impact:</span>
                    </div>
                    <p className="text-emerald-950 font-medium leading-relaxed">
                      {rec.business_relevance}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
