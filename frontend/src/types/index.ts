export type NavigationTab = 
  | 'overview' 
  | 'analytics' 
  | 'predict' 
  | 'orders' 
  | 'xai' 
  | 'operations' 
  | 'models' 
  | 'methodology';

export interface KPIItem {
  value: number;
  formatted: string;
  label: string;
  context: string;
}

export interface OverviewData {
  title: string;
  subtitle: string;
  data_period: string;
  last_analysis_timestamp: string;
  hackathon_metadata: {
    event: string;
    problem_statement_id: string;
    problem_statement: string;
    project_title: string;
  };
  kpis: {
    total_orders: KPIItem;
    late_delivery_rate: KPIItem;
    ontime_delivery_rate: KPIItem;
    high_risk_orders_queued: KPIItem;
    model_recall: KPIItem;
  };
  monthly_trend: Array<{
    month: string;
    total_orders: number;
    late_orders: number;
    late_rate: number;
  }>;
  delivery_distribution: Record<string, { count: number; percentage: number }>;
  shipping_modes: Array<{
    shipping_mode: string;
    total_orders: number;
    late_orders: number;
    late_rate: number;
    avg_scheduled_days: number;
  }>;
  top_regional_risks: Array<{
    region: string;
    total_orders: number;
    late_orders: number;
    late_rate: number;
  }>;
  recent_high_risk_preview: OrderItem[];
  top_operational_insight: {
    headline: string;
    finding: string;
    action: string;
  };
}

export interface OrderItem {
  order_id: number;
  order_date: string;
  shipping_mode: string;
  category_name: string;
  department_name: string;
  region: string;
  market: string;
  order_value: number;
  predicted_risk: number;
  risk_level: 'High' | 'Medium' | 'Low';
  risk_driver: string;
  scheduled_days: number;
}

export interface HighRiskOrdersResponse {
  total_items: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  items: OrderItem[];
}

export interface PredictionRequest {
  days_for_shipment_scheduled: number;
  shipping_mode: string;
  type: string;
  customer_segment: string;
  department_name: string;
  category_name: string;
  market: string;
  order_region: string;
  customer_country: string;
  order_item_quantity: number;
  order_item_product_price: number;
  order_item_discount_rate: number;
  order_item_discount: number;
  sales: number;
  order_item_total: number;
  order_month?: number;
  order_hour?: number;
  order_dayofweek?: string;
  is_weekend?: number;
  order_quarter?: number;
}

export interface ShapContribution {
  feature: string;
  impact: number;
  direction: string;
  description: string;
}

export interface PredictionResponse {
  predicted_probability: number;
  risk_level: 'High' | 'Medium' | 'Low';
  threshold_used: number;
  predicted_late: boolean;
  confidence_tier: string;
  risk_explanation: string;
  recommended_action: string;
  top_drivers: ShapContribution[];
}

export interface DeliveryAnalyticsData {
  shipping_modes: Array<{
    shipping_mode: string;
    total_orders: number;
    late_orders: number;
    late_rate: number;
    avg_scheduled_days: number;
  }>;
  markets: Array<{
    market: string;
    total_orders: number;
    late_orders: number;
    late_rate: number;
  }>;
  regions: Array<{
    region: string;
    total_orders: number;
    late_orders: number;
    late_rate: number;
  }>;
  departments: Array<{
    department: string;
    total_orders: number;
    late_orders: number;
    late_rate: number;
    avg_price: number;
    avg_discount_rate: number;
  }>;
  monthly_trend: Array<{
    month: string;
    total_orders: number;
    late_orders: number;
    late_rate: number;
  }>;
  scheduled_days: Array<{
    scheduled_days: number;
    total_orders: number;
    late_orders: number;
    late_rate: number;
  }>;
  cross_market_shipping: Record<string, Record<string, number>>;
  filter_options: {
    markets: string[];
    shipping_modes: string[];
    regions: string[];
    departments: string[];
  };
}

export interface OperationsRecommendation {
  id: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  finding: string;
  supporting_data: string;
  order_count: number;
  observed_risk_rate: number;
  recommended_action: string;
  business_relevance: string;
}

export interface ModelPerformanceData {
  model_comparison: Record<string, {
    validation: {
      accuracy: number;
      precision: number;
      recall: number;
      f1_score: number;
      roc_auc: number;
      pr_auc: number;
      confusion_matrix: number[][];
    };
    test: {
      accuracy: number;
      precision: number;
      recall: number;
      f1_score: number;
      roc_auc: number;
      pr_auc: number;
      confusion_matrix: number[][];
    };
  }>;
  threshold_analysis: Array<{
    threshold: number;
    recall: number;
    precision: number;
    f1_score: number;
    flagged_orders_count: number;
    flagged_orders_percentage: number;
  }>;
  best_model: string;
  optimal_threshold: number;
  curves: Record<string, {
    roc: Array<{ fpr: number; tpr: number }>;
    pr: Array<{ recall: number; precision: number }>;
  }>;
}

export interface DatasetInfoData {
  dataset_name: string;
  source: string;
  dimensions: {
    total_records: number;
    total_columns: number;
    unique_orders: number;
    unique_order_items: number;
    date_coverage: string;
  };
  target_distribution: {
    'Late Delivery (1)': number;
    'On-Time / Early (0)': number;
    late_percentage: number;
    ontime_percentage: number;
  };
  leakage_prevention: {
    critical_leakage_excluded: Record<string, string>;
    financial_reconciliation_excluded: Record<string, string>;
    identifiers_and_noise_excluded: Record<string, string>;
    retained_order_time_features: Record<string, string>;
  };
  chronological_split: {
    methodology: string;
    guarantee: string;
    train: { records: number; orders: number; percentage: number; date_range: string };
    validation: { records: number; orders: number; percentage: number; date_range: string };
    test: { records: number; orders: number; percentage: number; date_range: string };
  };
  limitations_and_assumptions: string[];
}
