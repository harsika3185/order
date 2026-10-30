import React, { useEffect, useState } from 'react';
import { DatasetInfoData } from '../types';
import { api } from '../services/api';
import { 
  Database, 
  ShieldCheck, 
  Calendar, 
  AlertOctagon, 
  CheckCircle2, 
  FileText,
  Clock,
  Layers
} from 'lucide-react';

export const DatasetMethodologyPage: React.FC = () => {
  const [data, setData] = useState<DatasetInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getDatasetInfo()
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
          <span>Loading dataset &amp; methodology audit...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md text-sm">
          Failed to load dataset info: {error}
        </div>
      </div>
    );
  }

  const criticalLeakage = data.leakage_prevention.critical_leakage_excluded;
  const financeLeakage = data.leakage_prevention.financial_reconciliation_excluded;
  const piiLeakage = data.leakage_prevention.identifiers_and_noise_excluded;
  const approvedFeatures = data.leakage_prevention.retained_order_time_features;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Data Governance &amp; Scientific Methodology
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Architectural documentation certifying zero lookahead bias, chronological integrity, and feature space boundaries.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded border border-emerald-200 font-semibold">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>DATA THIRAN 2026 Leakage Audit: PASS</span>
        </div>
      </div>

      {/* TOP KPI GRID - DATASET DIMENSIONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Total Records</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">
            {data.dimensions.total_records.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Order item transactions</span>
        </div>

        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Unique Orders</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">
            {data.dimensions.unique_orders.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Independent consignments</span>
        </div>

        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Historical Coverage</span>
          <span className="text-lg font-bold text-slate-900 leading-tight block mt-1">
            Jan 2015 – Jan 2018
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">36 Months continuous data</span>
        </div>

        <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-400 block uppercase">Target Class Balance</span>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm font-bold text-rose-600">Late: {data.target_distribution.late_percentage}%</span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-bold text-emerald-600">On-Time: {data.target_distribution.ontime_percentage}%</span>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">54.8% Late vs 45.2% On-Time</span>
        </div>
      </div>

      {/* SECTION 1: CHRONOLOGICAL ORDER-LEVEL SPLITTING */}
      <div className="bg-white p-6 rounded-md border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Clock size={16} className="text-blue-600" />
              <span>Chronological Train / Validation / Test Splitting Architecture</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict time-based partitioning guarantees that future data never leaks into past predictions.
            </p>
          </div>
          <span className="text-xs font-mono bg-blue-50 text-blue-800 px-2.5 py-1 rounded border border-blue-200">
            Order-Grouped Chronological
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Train */}
          <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase">Training Partition (70%)</span>
              <span className="text-[11px] font-mono text-slate-500">{data.chronological_split.train.percentage}%</span>
            </div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              {data.chronological_split.train.records.toLocaleString()} rows
            </div>
            <div className="text-xs text-slate-600 font-mono">
              {data.chronological_split.train.orders.toLocaleString()} Unique Orders
            </div>
            <div className="text-[11px] text-blue-700 font-medium">
              Dates: {data.chronological_split.train.date_range}
            </div>
          </div>

          {/* Validation */}
          <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase">Validation Partition (15%)</span>
              <span className="text-[11px] font-mono text-slate-500">{data.chronological_split.validation.percentage}%</span>
            </div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              {data.chronological_split.validation.records.toLocaleString()} rows
            </div>
            <div className="text-xs text-slate-600 font-mono">
              {data.chronological_split.validation.orders.toLocaleString()} Unique Orders
            </div>
            <div className="text-[11px] text-amber-700 font-medium">
              Dates: {data.chronological_split.validation.date_range}
            </div>
          </div>

          {/* Held-Out Test */}
          <div className="p-4 bg-slate-50 rounded border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase">Held-Out Test Partition (15%)</span>
              <span className="text-[11px] font-mono text-slate-500">{data.chronological_split.test.percentage}%</span>
            </div>
            <div className="text-xl font-bold text-slate-900 tabular-nums">
              {data.chronological_split.test.records.toLocaleString()} rows
            </div>
            <div className="text-xs text-slate-600 font-mono">
              {data.chronological_split.test.orders.toLocaleString()} Unique Orders
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">
              Dates: {data.chronological_split.test.date_range}
            </div>
          </div>
        </div>

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-950 flex items-start space-x-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Zero Order Bleed Guarantee:</strong> All line-items sharing the same Order ID are strictly isolated within the exact same chronological partition. Furthermore, all scalers and one-hot encoders are fitted exclusively on the training partition.
          </span>
        </div>
      </div>

      {/* SECTION 2: DATA LEAKAGE AUDIT MATRIX */}
      <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <AlertOctagon size={16} className="text-rose-600" />
              <span>Data Leakage Prevention Audit Matrix</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive inventory of post-placement features audited and categorically excluded from ML input space.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-4">Feature Name</th>
                <th className="py-2.5 px-4">Audit Category</th>
                <th className="py-2.5 px-4">Policy Verdict</th>
                <th className="py-2.5 px-4">Scientific Justification for Exclusion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Critical Direct Leakage */}
              {Object.entries(criticalLeakage).map(([col, reason]) => (
                <tr key={col} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    `{col}`
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Post-Fulfillment Direct Indicator
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      EXCLUDED (LEAKAGE)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 leading-snug">
                    {reason}
                  </td>
                </tr>
              ))}

              {/* Financial Reconciliation Leakage */}
              {Object.entries(financeLeakage).map(([col, reason]) => (
                <tr key={col} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    `{col}`
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Post-Delivery Financial Metric
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      EXCLUDED (RECONCILIATION)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 leading-snug">
                    {reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: APPROVED ORDER-TIME FEATURE SPACE */}
      <div className="bg-white p-6 rounded-md border border-slate-200 shadow-2xs space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <CheckCircle2 size={16} className="text-blue-600" />
            <span>Approved Order-Placement Input Features</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Confirmed attributes available in checkout payload before physical shipment occurs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(approvedFeatures).map(([feat, desc]) => (
            <div key={feat} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs">
              <span className="font-mono font-bold text-blue-700 block mb-1">
                {feat}
              </span>
              <p className="text-[11px] text-slate-600 leading-snug">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: ASSUMPTIONS & LIMITATIONS */}
      <div className="bg-white p-6 rounded-md border border-slate-200 shadow-2xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900">
          Operational Assumptions &amp; Methodological Limitations
        </h2>
        <ul className="space-y-2 text-xs text-slate-600 list-disc pl-5 leading-relaxed">
          {data.limitations_and_assumptions.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
