import React from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  ShieldAlert, 
  AlertTriangle, 
  Sparkles, 
  Compass, 
  Activity, 
  Database,
  CheckCircle2,
  Box
} from 'lucide-react';
import { NavigationTab } from '../types';

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const navItems: Array<{ id: NavigationTab; label: string; icon: React.ReactNode }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { id: 'analytics', label: 'Delivery Analytics', icon: <BarChart3 size={18} /> },
    { id: 'predict', label: 'Risk Prediction', icon: <ShieldAlert size={18} /> },
    { id: 'orders', label: 'High-Risk Orders', icon: <AlertTriangle size={18} /> },
    { id: 'xai', label: 'Explainable AI', icon: <Sparkles size={18} /> },
    { id: 'operations', label: 'Operations Intelligence', icon: <Compass size={18} /> },
    { id: 'models', label: 'Model Performance', icon: <Activity size={18} /> },
    { id: 'methodology', label: 'Dataset & Methodology', icon: <Database size={18} /> },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none text-slate-300">
      <div>
        {/* Platform Identity */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm">
              <Box size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-white leading-tight">
                Logistics Control Tower
              </div>
              <div className="text-[11px] text-slate-400 font-mono tracking-wider mt-0.5 uppercase">
                Enterprise v1.0
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
            Navigation
          </div>
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors text-left font-medium ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {item.icon}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Metadata */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs">
        {/* Live Model Status Indicator */}
        <div className="flex items-center space-x-2 text-[11px] text-slate-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="truncate font-mono text-[10px]">Production LightGBM • Online</span>
        </div>
      </div>
    </aside>
  );
};
