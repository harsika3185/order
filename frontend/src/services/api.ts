import {
  OverviewData,
  DeliveryAnalyticsData,
  HighRiskOrdersResponse,
  PredictionRequest,
  PredictionResponse,
  OperationsRecommendation,
  ModelPerformanceData,
  DatasetInfoData
} from '../types';

const API_BASE = '/api';

export const api = {
  async getOverview(): Promise<OverviewData> {
    const res = await fetch(`${API_BASE}/overview`);
    if (!res.ok) throw new Error('Failed to fetch overview data');
    return res.json();
  },

  async getAnalytics(params?: { market?: string; shipping_mode?: string; region?: string }): Promise<DeliveryAnalyticsData> {
    const url = new URL(`${API_BASE}/analytics/delivery`, window.location.origin);
    if (params?.market) url.searchParams.append('market', params.market);
    if (params?.shipping_mode) url.searchParams.append('shipping_mode', params.shipping_mode);
    if (params?.region) url.searchParams.append('region', params.region);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch delivery analytics');
    return res.json();
  },

  async getHighRiskOrders(params: {
    search?: string;
    risk_level?: string;
    shipping_mode?: string;
    region?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    page_size?: number;
  }): Promise<HighRiskOrdersResponse> {
    const url = new URL(`${API_BASE}/orders/high-risk`, window.location.origin);
    if (params.search) url.searchParams.append('search', params.search);
    if (params.risk_level) url.searchParams.append('risk_level', params.risk_level);
    if (params.shipping_mode) url.searchParams.append('shipping_mode', params.shipping_mode);
    if (params.region) url.searchParams.append('region', params.region);
    if (params.sort_by) url.searchParams.append('sort_by', params.sort_by);
    if (params.sort_order) url.searchParams.append('sort_order', params.sort_order);
    if (params.page) url.searchParams.append('page', params.page.toString());
    if (params.page_size) url.searchParams.append('page_size', params.page_size.toString());
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch high-risk orders');
    return res.json();
  },

  exportCsvUrl(riskLevel: string = 'All'): string {
    return `${API_BASE}/orders/export-csv?risk_level=${encodeURIComponent(riskLevel)}`;
  },

  async predictOrderRisk(request: PredictionRequest): Promise<PredictionResponse> {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Prediction failed');
    }
    return res.json();
  },

  async getExplainability(): Promise<any> {
    const res = await fetch(`${API_BASE}/explainability`);
    if (!res.ok) throw new Error('Failed to fetch explainability data');
    return res.json();
  },

  async getOperationsIntelligence(): Promise<{ recommendations: OperationsRecommendation[] }> {
    const res = await fetch(`${API_BASE}/operations/recommendations`);
    if (!res.ok) throw new Error('Failed to fetch operations recommendations');
    return res.json();
  },

  async getModelPerformance(): Promise<ModelPerformanceData> {
    const res = await fetch(`${API_BASE}/model/performance`);
    if (!res.ok) throw new Error('Failed to fetch model performance');
    return res.json();
  },

  async getDatasetInfo(): Promise<DatasetInfoData> {
    const res = await fetch(`${API_BASE}/dataset-info`);
    if (!res.ok) throw new Error('Failed to fetch dataset info');
    return res.json();
  },

  async getFormOptions(): Promise<any> {
    const res = await fetch(`${API_BASE}/form-options`);
    if (!res.ok) throw new Error('Failed to fetch form options');
    return res.json();
  }
};
