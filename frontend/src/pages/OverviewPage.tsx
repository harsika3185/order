import React, { useEffect, useState } from 'react';
import { OverviewData, NavigationTab } from '../types';
import { api } from '../services/api';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  AlertCircle, 
  ArrowRight, 
  Package, 
  Clock, 
  CheckCircle, 
  ShieldCheck, 
  Lightbulb 
} from 'lucide-react';

interface OverviewPageProps {
  onNavigate: (tab: NavigationTab) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate }) => {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getOverview()
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
          <span>Loading logistics intelligence overview...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
          Failed to load overview data: {error}
        </div>
      </div>
    );
  }

  // Format delivery distribution for Recharts
  const deliveryStatusChartData = Object.entries(data.delivery_distribution).map(([status, info]) => ({
    status,
    count: info.count,
    percentage: info.percentage
  }));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header with Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Logistics Intelligence Overview
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {data.subtitle}
          </p>
        </div>
        <div className="flex items-center space-x-3 text-xs text-slate-500">
          <span className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200 font-mono">
            Period: {data.data_period}
          </span>
          <span className="px-2.5 py-1 bg-slate-100 rounded border border-slate-200 font-mono">
            Analyzed: {new Date(data.last_analysis_timestamp).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* TOP KPI SECTION - Formatted Enterprise Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Orders */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">{data.kpis.total_orders.label}</span>
            <Package size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {data.kpis.total_orders.formatted}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {data.kpis.total_orders.context}
          </p>
        </div>

        {/* Late Delivery Rate */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">{data.kpis.late_delivery_rate.label}</span>
            <AlertCircle size={16} className="text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600 tabular-nums">
            {data.kpis.late_delivery_rate.formatted}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {data.kpis.late_delivery_rate.context}
          </p>
        </div>

        {/* On-Time Rate */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">{data.kpis.ontime_delivery_rate.label}</span>
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 tabular-nums">
            {data.kpis.ontime_delivery_rate.formatted}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {data.kpis.ontime_delivery_rate.context}
          </p>
        </div>

        {/* High Risk Orders Queued */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">{data.kpis.high_risk_orders_queued.label}</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {data.kpis.high_risk_orders_queued.formatted}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {data.kpis.high_risk_orders_queued.context}
          </p>
        </div>

        {/* Model Recall */}
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium uppercase tracking-wider">{data.kpis.model_recall.label}</span>
            <ShieldCheck size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 tabular-nums">
            {data.kpis.model_recall.formatted}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {data.kpis.model_recall.context}
          </p>
        </div>
      </div>

      {/* MAIN ANALYTICS SECTION - 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance Trend */}
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Monthly Delivery Performance Trend
              </h2>
              <p className="text-xs text-slate-500">Order volume & late delivery rate over time</p>
            </div>
            <button 
              onClick={() => onNavigate('analytics')} 
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
            >
              <span>Explore Analytics</span>
              <ArrowRight size={12} />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fontSize: 10, fill: '#E11D48' }} domain={[40, 70]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '4px', color: '#FFF', fontSize: '12px' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line yAxisId="left" type="monotone" dataKey="total_orders" name="Order Volume" stroke="#1E293B" strokeWidth={1.5} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="late_rate" name="Late Rate (%)" stroke="#E11D48" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shipping Mode Comparison */}
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Shipping Mode Late Rate vs SLA
              </h2>
              <p className="text-xs text-slate-500">Observed failure rates across fulfillment commitments</p>
            </div>
            <span className="text-xs font-mono text-slate-400">N = 180,519</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.shipping_modes} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="shipping_mode" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis unit="%" tick={{ fontSize: 10, fill: '#64748B' }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '4px', color: '#FFF', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Late Delivery Rate']}
                />
                <Bar 
                  dataKey="late_rate" 
                  name="Late Rate (%)" 
                  fill="#3B82F6" 
                  radius={[3, 3, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECOND ANALYTICS ROW - Regional Breakdown & Operations Highlight */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regional Risk Ranking */}
        <div className="lg:col-span-2 bg-white p-5 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Top Regional Late Delivery Risks
              </h2>
              <p className="text-xs text-slate-500">Highest observed risk rates by destination region</p>
            </div>
            <button 
              onClick={() => onNavigate('analytics')} 
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View all 23 regions
            </button>
          </div>

          <div className="space-y-3">
            {data.top_regional_risks.map((reg) => (
              <div key={reg.region} className="flex items-center justify-between text-xs">
                <div className="w-48 font-medium text-slate-700 truncate">{reg.region}</div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full" 
                      style={{ width: `${reg.late_rate}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-20 text-right font-semibold text-slate-900 tabular-nums">
                  {reg.late_rate}%
                </div>
                <div className="w-24 text-right text-slate-400 font-mono text-[11px]">
                  {reg.total_orders.toLocaleString()} ord
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operational Insight Highlight Card */}
        <div className="bg-slate-900 text-slate-200 p-5 rounded-md border border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Lightbulb size={14} />
              <span>Priority Operational Finding</span>
            </div>
            <h3 className="text-sm font-bold text-white mb-2 leading-snug">
              {data.top_operational_insight.headline}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {data.top_operational_insight.finding}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">
              Recommended Action
            </div>
            <p className="text-xs text-blue-300 font-medium leading-relaxed">
              {data.top_operational_insight.action}
            </p>
            <button
              onClick={() => onNavigate('operations')}
              className="mt-3 text-xs text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded inline-flex items-center space-x-1.5 transition-colors"
            >
              <span>View Full Operations Report</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Recent High-Risk Orders Requiring Attention */}
      <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Orders Requiring Attention (Live Assessment Preview)
            </h2>
            <p className="text-xs text-slate-500">
              Orders scored at order-placement with high delivery risk probability
            </p>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center space-x-1"
          >
            <span>Open Full Operational Queue ({data.kpis.high_risk_orders_queued.formatted})</span>
            <ArrowRight size={12} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Order ID</th>
                <th className="py-2.5 px-4">Shipping Mode</th>
                <th className="py-2.5 px-4">Product Category</th>
                <th className="py-2.5 px-4">Region</th>
                <th className="py-2.5 px-4 text-right">Order Value</th>
                <th className="py-2.5 px-4 text-center">Predicted Risk</th>
                <th className="py-2.5 px-4">Risk Tier</th>
                <th className="py-2.5 px-4">Primary Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recent_high_risk_preview.map((order) => (
                <tr key={order.order_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">
                    #{order.order_id}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {order.shipping_mode}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {order.category_name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {order.region}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-900 tabular-nums">
                    ${order.order_value.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums font-bold text-rose-600">
                    {(order.predicted_risk * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                      {order.risk_level}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-xs">
                    {order.risk_driver}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
