import React, { useEffect, useState } from 'react';
import { DeliveryAnalyticsData } from '../types';
import { api } from '../services/api';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { Filter, RotateCcw, AlertTriangle } from 'lucide-react';

export const DeliveryAnalyticsPage: React.FC = () => {
  const [data, setData] = useState<DeliveryAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [selectedMarket, setSelectedMarket] = useState<string>('All');
  const [selectedShippingMode, setSelectedShippingMode] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  const fetchAnalytics = () => {
    setLoading(true);
    const params: any = {};
    if (selectedMarket !== 'All') params.market = selectedMarket;
    if (selectedShippingMode !== 'All') params.shipping_mode = selectedShippingMode;
    if (selectedRegion !== 'All') params.region = selectedRegion;

    api.getAnalytics(params)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedMarket, selectedShippingMode, selectedRegion]);

  const handleResetFilters = () => {
    setSelectedMarket('All');
    setSelectedShippingMode('All');
    setSelectedRegion('All');
  };

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-2 text-slate-500 text-sm">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading delivery analytics...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
          Failed to load delivery analytics: {error}
        </div>
      </div>
    );
  }

  // Filtered Regional List
  const filteredRegions = selectedRegion === 'All' 
    ? data.regions 
    : data.regions.filter(r => r.region === selectedRegion);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Delivery Performance Analysis
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Empirical historical logistics data segmented by shipping modes, regions, product lines, and SLA tiers.
          </p>
        </div>
      </div>

      {/* FILTER CONTROL BAR */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 uppercase tracking-wider">
            <Filter size={14} className="text-blue-600" />
            <span>Interactive Segment Filters:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Market Filter */}
            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-0.5">Market</label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">All Markets (5)</option>
                {data.filter_options.markets.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Shipping Mode Filter */}
            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-0.5">Shipping Mode</label>
              <select
                value={selectedShippingMode}
                onChange={(e) => setSelectedShippingMode(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="All">All Shipping Modes (4)</option>
                {data.filter_options.shipping_modes.map(sm => (
                  <option key={sm} value={sm}>{sm}</option>
                ))}
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label className="text-[11px] font-medium text-slate-500 block mb-0.5">Destination Region</label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
              >
                <option value="All">All Regions (23)</option>
                {data.filter_options.regions.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Reset Button */}
            {(selectedMarket !== 'All' || selectedShippingMode !== 'All' || selectedRegion !== 'All') && (
              <div className="self-end">
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center space-x-1 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded transition-colors"
                >
                  <RotateCcw size={12} />
                  <span>Reset Filters</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 1: Shipping Mode Performance & SLA Commitment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shipping Mode Late Rate Bar Chart */}
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Shipping Mode Late Rate (%)
              </h2>
              <p className="text-xs text-slate-500">
                Comparison of actual late delivery rates across carriers
              </p>
            </div>
            <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-medium border border-rose-200">
              First Class = 95.3% Late
            </span>
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
                <Bar dataKey="late_rate" name="Late Rate (%)" fill="#E11D48" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Scheduled SLA Commitment Analysis */}
        <div className="bg-white p-5 rounded-md border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                SLA Promise vs Failure Rate
              </h2>
              <p className="text-xs text-slate-500">
                Performance by committed scheduled shipping days
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Critical Threshold: &le; 2 Days
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.scheduled_days} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="scheduled_days" unit=" Days" tick={{ fontSize: 10, fill: '#64748B' }} />
                <YAxis unit="%" tick={{ fontSize: 10, fill: '#64748B' }} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '4px', color: '#FFF', fontSize: '12px' }}
                  formatter={(val: any) => [`${val}%`, 'Late Rate']}
                />
                <Bar dataKey="late_rate" name="Late Rate (%)" fill="#3B82F6" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECTION 2: Regional Ranking (All 23 Global Regions) */}
      <div className="bg-white p-5 rounded-md border border-slate-200 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Regional Delivery Performance Matrix
            </h2>
            <p className="text-xs text-slate-500">
              Comprehensive ranking of all international logistics corridors sorted by failure frequency
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {filteredRegions.length} Regions Displayed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredRegions.map((r) => (
            <div 
              key={r.region} 
              className="p-3 bg-slate-50 rounded border border-slate-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-800 truncate mr-2">{r.region}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  r.late_rate >= 57 ? 'bg-rose-100 text-rose-700' :
                  r.late_rate >= 54 ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {r.late_rate}%
                </span>
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full rounded-full ${
                    r.late_rate >= 57 ? 'bg-rose-600' :
                    r.late_rate >= 54 ? 'bg-amber-500' :
                    'bg-emerald-600'
                  }`}
                  style={{ width: `${r.late_rate}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Total Consignments:</span>
                <span className="font-mono font-medium text-slate-700">{r.total_orders.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: Department Level Performance Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Product Department Risk & Commercial Profile
            </h2>
            <p className="text-xs text-slate-500">
              Failure rates alongside economic metrics across store departments
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">11 Departments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Department Name</th>
                <th className="py-2.5 px-4 text-right">Total Orders</th>
                <th className="py-2.5 px-4 text-right">Late Deliveries</th>
                <th className="py-2.5 px-4 text-center">Late Rate (%)</th>
                <th className="py-2.5 px-4 text-right">Avg Item Price</th>
                <th className="py-2.5 px-4 text-right">Avg Discount Rate</th>
                <th className="py-2.5 px-4">Risk Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.departments.map((dept) => (
                <tr key={dept.department} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-slate-900">
                    {dept.department}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                    {dept.total_orders.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                    {dept.late_orders.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center tabular-nums font-bold text-slate-900">
                    {dept.late_rate}%
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                    ${dept.avg_price.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                    {(dept.avg_discount_rate * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                      dept.late_rate >= 55 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {dept.late_rate >= 55 ? 'Elevated' : 'Nominal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: Combined Cross-Market & Shipping Mode Heatmap Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-2xs p-5">
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Combined Segment Matrix: Market &times; Shipping Mode Late Rate (%)
          </h2>
          <p className="text-xs text-slate-500">
            Empirical failure rates cross-tabulated across geographical market and carrier class
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border border-slate-200">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 text-left border-r border-slate-200">Destination Market</th>
                <th className="py-2.5 px-4">First Class</th>
                <th className="py-2.5 px-4">Same Day</th>
                <th className="py-2.5 px-4">Second Class</th>
                <th className="py-2.5 px-4">Standard Class</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {['Africa', 'Europe', 'LATAM', 'Pacific Asia', 'USCA'].map((mkt) => {
                const row = data.cross_market_shipping[mkt] || {};
                return (
                  <tr key={mkt} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-left font-semibold text-slate-900 border-r border-slate-200">
                      {mkt}
                    </td>
                    {['First Class', 'Same Day', 'Second Class', 'Standard Class'].map((mode) => {
                      const val = row[mode] || 0;
                      // Heatmap color shading
                      const bgClass = val >= 90 ? 'bg-rose-100 text-rose-800 font-bold' :
                                      val >= 70 ? 'bg-amber-100 text-amber-800 font-bold' :
                                      val >= 50 ? 'bg-orange-50 text-orange-800 font-medium' :
                                      'bg-emerald-50 text-emerald-800 font-medium';
                      return (
                        <td key={mode} className={`py-3 px-4 tabular-nums ${bgClass}`}>
                          {val.toFixed(1)}%
                        </td>
                      );
                    })}
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
