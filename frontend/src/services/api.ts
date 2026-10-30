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
import { localDataService } from './localData';

const RAW_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '';
const API_BASE = RAW_BASE ? RAW_BASE.replace(/\/$/, '') + '/api' : '/api';

/**
 * Helper to attempt network fetch and fallback to precomputed data on failure or non-JSON response.
 */
async function safeFetchJson<T>(url: string, options?: RequestInit, fallback?: () => T): Promise<T> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`[Logistics Intelligence] Live backend unreachable at ${url}. Utilizing bundled analytical model fallback.`, err);
  }

  if (fallback) {
    return fallback();
  }
  throw new Error(`Endpoint unavailable: ${url}`);
}

export const api = {
  async getOverview(): Promise<OverviewData> {
    return safeFetchJson<OverviewData>(
      `${API_BASE}/overview`,
      undefined,
      () => localDataService.getOverview()
    );
  },

  async getAnalytics(params?: { market?: string; shipping_mode?: string; region?: string }): Promise<DeliveryAnalyticsData> {
    const url = new URL(`${API_BASE}/analytics/delivery`, window.location.origin);
    if (params?.market) url.searchParams.append('market', params.market);
    if (params?.shipping_mode) url.searchParams.append('shipping_mode', params.shipping_mode);
    if (params?.region) url.searchParams.append('region', params.region);

    return safeFetchJson<DeliveryAnalyticsData>(
      url.toString(),
      undefined,
      () => localDataService.getAnalytics(params)
    );
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

    return safeFetchJson<HighRiskOrdersResponse>(
      url.toString(),
      undefined,
      () => localDataService.getHighRiskOrders(params)
    );
  },

  exportCsvUrl(riskLevel: string = 'All'): string {
    // If backend is running locally, use backend endpoint; otherwise generate direct browser CSV Data URL
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `${API_BASE}/orders/export-csv?risk_level=${encodeURIComponent(riskLevel)}`;
    }
    const csvContent = localDataService.exportCsvString(riskLevel);
    return `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
  },

  async predictOrderRisk(request: PredictionRequest): Promise<PredictionResponse> {
    return safeFetchJson<PredictionResponse>(
      `${API_BASE}/predict`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      },
      () => localDataService.predictOrderRisk(request)
    );
  },

  async getExplainability(): Promise<any> {
    return safeFetchJson<any>(
      `${API_BASE}/explainability`,
      undefined,
      () => localDataService.getExplainability()
    );
  },

  async getOperationsIntelligence(): Promise<{ recommendations: OperationsRecommendation[] }> {
    return safeFetchJson<{ recommendations: OperationsRecommendation[] }>(
      `${API_BASE}/operations/recommendations`,
      undefined,
      () => localDataService.getOperationsIntelligence()
    );
  },

  async getModelPerformance(): Promise<ModelPerformanceData> {
    return safeFetchJson<ModelPerformanceData>(
      `${API_BASE}/model/performance`,
      undefined,
      () => localDataService.getModelPerformance()
    );
  },

  async getDatasetInfo(): Promise<DatasetInfoData> {
    return safeFetchJson<DatasetInfoData>(
      `${API_BASE}/dataset-info`,
      undefined,
      () => localDataService.getDatasetInfo()
    );
  },

  async getFormOptions(): Promise<any> {
    return safeFetchJson<any>(
      `${API_BASE}/form-options`,
      undefined,
      () => localDataService.getFormOptions()
    );
  }
};
