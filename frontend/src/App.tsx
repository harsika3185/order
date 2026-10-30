import React, { useState } from 'react';
import { NavigationTab } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewPage } from './pages/OverviewPage';
import { DeliveryAnalyticsPage } from './pages/DeliveryAnalyticsPage';
import { RiskPredictionPage } from './pages/RiskPredictionPage';
import { HighRiskOrdersPage } from './pages/HighRiskOrdersPage';
import { ExplainableAIPage } from './pages/ExplainableAIPage';
import { OperationsIntelligencePage } from './pages/OperationsIntelligencePage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { DatasetMethodologyPage } from './pages/DatasetMethodologyPage';

export function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('overview');

  const renderActivePage = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPage onNavigate={(tab) => setActiveTab(tab)} />;
      case 'analytics':
        return <DeliveryAnalyticsPage />;
      case 'predict':
        return <RiskPredictionPage />;
      case 'orders':
        return <HighRiskOrdersPage />;
      case 'xai':
        return <ExplainableAIPage />;
      case 'operations':
        return <OperationsIntelligencePage />;
      case 'models':
        return <ModelPerformancePage />;
      case 'methodology':
        return <DatasetMethodologyPage />;
      default:
        return <OverviewPage onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 antialiased font-sans">
      {/* Persistent Left Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Persistent Top Header */}
        <Header activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}

export default App;
