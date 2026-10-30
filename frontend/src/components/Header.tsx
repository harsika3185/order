import React from 'react';
import { NavigationTab } from '../types';
import { ShieldCheck, Download, PlusCircle } from 'lucide-react';
import { api } from '../services/api';

interface HeaderProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange }) => {
  const titles: Record<NavigationTab, { title: string; subtitle: string }> = {
    overview: {
      title: 'Logistics Intelligence Overview',
      subtitle: 'Real-time order monitoring, late risk indicators, and operations queue.'
    },
    analytics: {
      title: 'Delivery Performance Analysis',
      subtitle: 'Multidimensional logistics analytics across carriers, markets, regions, and categories.'
    },
    predict: {
      title: 'Order Risk Assessment',
      subtitle: 'Order-time risk inference with local SHAP attribution and prescriptive operational guidance.'
    },
    orders: {
      title: 'Orders Requiring Attention',
      subtitle: 'Operational queue of high-risk consignments filtered for immediate intervention.'
    },
    xai: {
      title: 'Model Decision Intelligence',
      subtitle: 'Global SHAP feature importance, directionality, and behavioral interpretability.'
    },
    operations: {
      title: 'Operational Insights & Recommendations',
      subtitle: 'Empirical logistics findings and concrete preventative interventions.'
    },
    models: {
      title: 'Model Evaluation & Reliability',
      subtitle: 'Rigorous chronological benchmark comparing Logistic Regression, Random Forest, and LightGBM.'
    },
    methodology: {
      title: 'Dataset & Methodology',
      subtitle: 'Data governance, strict leakage prevention policy, and chronological splitting.'
    }
  };

  const current = titles[activeTab];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
      <div className="flex flex-col">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Logistics Control Tower
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-sm font-semibold text-slate-900">
            {current.title}
          </span>
        </div>
        <p className="text-xs text-slate-500 hidden md:block">
          {current.subtitle}
        </p>
      </div>

      <div className="flex items-center space-x-3">
        {/* Leakage Protection Badge */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Zero-Leakage Policy Active</span>
        </div>

        {/* Action Button: Download CSV */}
        <a
          href={api.exportCsvUrl()}
          download="high_risk_orders.csv"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <Download size={13} />
          <span>Export Queue CSV</span>
        </a>

        {/* Action Button: Simulate Risk */}
        {activeTab !== 'predict' && (
          <button
            onClick={() => onTabChange('predict')}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
          >
            <PlusCircle size={13} />
            <span>Assess New Order</span>
          </button>
        )}
      </div>
    </header>
  );
};
