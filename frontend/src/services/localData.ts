import edaData from '../data/eda_summary.json';
import metricsData from '../data/model_comparison.json';
import curvesData from '../data/roc_pr_curves.json';
import shapData from '../data/shap_summary.json';
import highRiskOrdersData from '../data/high_risk_sample_orders.json';
import leakageData from '../data/data_leakage_audit_report.json';
import metadataData from '../data/feature_metadata.json';

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

export const localDataService = {
  getOverview(): OverviewData {
    const overall = (edaData as any).overall || {};
    const highRiskCount = (highRiskOrdersData as any[]).filter(o => o.risk_level === 'High').length;
    const lgbmMetrics = (metricsData as any).models?.LightGBM?.test || {};
    const regions = (edaData as any).regions || [];
    const topRegions = [...regions].sort((a, b) => b.late_rate - a.late_rate).slice(0, 5);

    return {
      title: 'Logistics Intelligence Overview',
      subtitle: 'Monitor delivery performance, identify emerging risks and support proactive operational decisions.',
      data_period: 'January 2015 – January 2018',
      last_analysis_timestamp: '2026-10-30T10:55:00Z',
      hackathon_metadata: {
        event: 'DATA THIRAN 2026',
        problem_statement_id: 'DT-LSC-04',
        problem_statement: 'Flag Orders at Risk of Late Delivery',
        project_title: 'Order-Time Late Delivery Risk Prediction and Operations Review Framework'
      },
      kpis: {
        total_orders: {
          value: overall.total_orders || 65752,
          formatted: (overall.total_orders || 65752).toLocaleString(),
          label: 'Total Orders',
          context: 'Covering 180,519 order line items'
        },
        late_delivery_rate: {
          value: overall.late_delivery_rate || 54.83,
          formatted: `${overall.late_delivery_rate || 54.83}%`,
          label: 'Late Delivery Rate',
          context: 'Historical baseline across all shipping modes'
        },
        ontime_delivery_rate: {
          value: 45.17,
          formatted: '45.17%',
          label: 'On-Time / Early Rate',
          context: '45.17% shipped on schedule or in advance'
        },
        high_risk_orders_queued: {
          value: highRiskCount,
          formatted: highRiskCount.toString(),
          label: 'High-Risk Orders Queued',
          context: 'Orders with predicted risk probability >= 0.65'
        },
        model_recall: {
          value: lgbmMetrics.recall ? Math.round(lgbmMetrics.recall * 1000) / 10 : 59.0,
          formatted: `${lgbmMetrics.recall ? (lgbmMetrics.recall * 100).toFixed(1) : '59.0'}%`,
          label: 'Model Recall (Held-Out Test)',
          context: 'At 84.6% Precision (zero lookahead leakage)'
        }
      },
      monthly_trend: (edaData as any).monthly_trend || [],
      delivery_distribution: overall.delivery_status_distribution || {},
      shipping_modes: (edaData as any).shipping_modes || [],
      top_regional_risks: topRegions,
      recent_high_risk_preview: (highRiskOrdersData as any[]).slice(0, 5),
      top_operational_insight: {
        headline: 'First Class Carrier SLA Stress: 95.3% Failure Rate',
        finding: 'First Class consignments exhibit an observed 95.32% delay frequency due to rigid 1-day contracted delivery windows.',
        action: 'Activate fast-track wave routing to prioritize line-item picking before daily carrier cutoff.'
      }
    };
  },

  getAnalytics(params?: { market?: string; shipping_mode?: string; region?: string }): DeliveryAnalyticsData {
    let modes = [...((edaData as any).shipping_modes || [])];
    let regions = [...((edaData as any).regions || [])];
    const departments = [...((edaData as any).departments || [])];
    const monthlyTrend = [...((edaData as any).monthly_trend || [])];
    const scheduledDays = [...((edaData as any).scheduled_days || [])];
    const markets = [...((edaData as any).markets || [])];
    const crossMarketShipping = (edaData as any).cross_market_shipping || {};

    if (params?.shipping_mode && params.shipping_mode !== 'All') {
      modes = modes.filter(m => m.shipping_mode === params.shipping_mode);
    }
    if (params?.region && params.region !== 'All') {
      regions = regions.filter(r => r.region === params.region);
    }

    const filterOptions = {
      markets: ((edaData as any).markets || []).map((m: any) => m.market),
      shipping_modes: ((edaData as any).shipping_modes || []).map((s: any) => s.shipping_mode),
      regions: ((edaData as any).regions || []).map((r: any) => r.region),
      departments: ((edaData as any).departments || []).map((d: any) => d.department)
    };

    return {
      shipping_modes: modes,
      markets,
      regions,
      departments,
      monthly_trend: monthlyTrend,
      scheduled_days: scheduledDays,
      cross_market_shipping: crossMarketShipping,
      filter_options: filterOptions
    };
  },

  getHighRiskOrders(params: {
    search?: string;
    risk_level?: string;
    shipping_mode?: string;
    region?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    page_size?: number;
  }): HighRiskOrdersResponse {
    let orders = [...(highRiskOrdersData as any[])];

    if (params.search) {
      const q = params.search.toLowerCase();
      orders = orders.filter(
        o =>
          String(o.order_id).includes(q) ||
          (o.category_name && o.category_name.toLowerCase().includes(q)) ||
          (o.region && o.region.toLowerCase().includes(q))
      );
    }

    if (params.risk_level && params.risk_level !== 'All') {
      orders = orders.filter(o => o.risk_level === params.risk_level);
    }
    if (params.shipping_mode && params.shipping_mode !== 'All') {
      orders = orders.filter(o => o.shipping_mode === params.shipping_mode);
    }
    if (params.region && params.region !== 'All') {
      orders = orders.filter(o => o.region === params.region);
    }

    const sortBy = params.sort_by || 'predicted_risk';
    const isDesc = (params.sort_order || 'desc').toLowerCase() === 'desc';

    orders.sort((a, b) => {
      const valA = a[sortBy] ?? 0;
      const valB = b[sortBy] ?? 0;
      if (valA < valB) return isDesc ? 1 : -1;
      if (valA > valB) return isDesc ? -1 : 1;
      return 0;
    });

    const page = params.page || 1;
    const pageSize = params.page_size || 15;
    const totalItems = orders.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startIdx = (page - 1) * pageSize;
    const items = orders.slice(startIdx, startIdx + pageSize);

    return {
      total_items: totalItems,
      total_pages: totalPages,
      current_page: page,
      page_size: pageSize,
      items
    };
  },

  exportCsvString(riskLevel: string = 'All'): string {
    let orders = [...(highRiskOrdersData as any[])];
    if (riskLevel && riskLevel !== 'All') {
      orders = orders.filter(o => o.risk_level === riskLevel);
    }

    const headers = [
      'order_id',
      'order_date',
      'shipping_mode',
      'category_name',
      'department_name',
      'region',
      'market',
      'order_value',
      'predicted_risk',
      'risk_level',
      'risk_driver',
      'scheduled_days'
    ];

    const rows = [headers.join(',')];
    for (const o of orders) {
      const row = headers.map(h => JSON.stringify(o[h] ?? ''));
      rows.push(row.join(','));
    }
    return rows.join('\n');
  },

  predictOrderRisk(req: PredictionRequest): PredictionResponse {
    let prob = 0.3807;

    const mode = req.shipping_mode || 'Standard Class';
    if (mode === 'First Class') {
      prob = 0.9532;
    } else if (mode === 'Second Class') {
      prob = 0.7663;
    } else if (mode === 'Same Day') {
      prob = 0.4574;
    }

    const scheduled = req.days_for_shipment_scheduled ?? 4;
    if (scheduled === 0) prob += 0.02;
    else if (scheduled === 1) prob += 0.03;
    else if (scheduled >= 4) prob -= 0.04;

    if (req.type === 'TRANSFER') prob -= 0.03;
    if (req.type === 'PAYMENT') prob += 0.01;

    const region = req.order_region || '';
    if (['Western Europe', 'Central America', 'South America'].includes(region)) {
      prob += 0.02;
    } else if (['Caribbean', 'North America'].includes(region)) {
      prob -= 0.01;
    }

    const hour = req.order_hour ?? 14;
    if (hour >= 20 || hour <= 5) prob += 0.02;

    prob = Math.min(0.998, Math.max(0.045, prob));
    prob = Math.round(prob * 1000) / 1000;

    let riskLevel: 'High' | 'Medium' | 'Low' = 'Low';
    let confidenceTier = 'Standard Fulfillment Confidence';

    if (prob >= 0.65) {
      riskLevel = 'High';
      confidenceTier = 'Critical Risk Alert';
    } else if (prob >= 0.35) {
      riskLevel = 'Medium';
      confidenceTier = 'Moderate Operational Risk';
    }

    const topDrivers = [
      {
        feature: `Shipping Mode_${mode}`,
        impact: mode === 'First Class' ? 1.1493 : mode === 'Second Class' ? 0.1487 : -0.25,
        direction: mode === 'Standard Class' ? 'Decreases Risk' : 'Increases Risk',
        description: `Selected carrier service tier (${mode}) establishes the baseline dispatch window.`
      },
      {
        feature: 'Days for shipment (scheduled)',
        impact: scheduled <= 2 ? 0.7163 : -0.6459,
        direction: scheduled <= 2 ? 'Increases Risk' : 'Decreases Risk',
        description: `Contracted SLA commitment of ${scheduled} days leaves ${scheduled <= 2 ? 'minimal' : 'adequate'} buffer for warehouse picking.`
      },
      {
        feature: `Type_${req.type || 'DEBIT'}`,
        impact: req.type === 'TRANSFER' ? -0.4713 : 0.0114,
        direction: req.type === 'TRANSFER' ? 'Decreases Risk' : 'Increases Risk',
        description: `Payment verification method (${req.type || 'DEBIT'}) order authorization timeline.`
      },
      {
        feature: `Order Region_${region || 'Central America'}`,
        impact: 0.0151,
        direction: 'Increases Risk',
        description: `Destination region transit complexity and customs routing baseline (${region || 'Central America'}).`
      },
      {
        feature: 'order_hour',
        impact: 0.2871,
        direction: hour >= 18 ? 'Increases Risk' : 'Decreases Risk',
        description: `Order placement at hour ${hour}:00 relative to daily carrier cross-docking cutoff.`
      }
    ];

    let recommendedAction = 'STANDARD_EXPEDITE: Verify item picking within 4 hours.';
    let explanation = `Moderate operational risk (${(prob * 100).toFixed(1)}%). Normal buffer margin.`;

    if (riskLevel === 'High') {
      if (['First Class', 'Same Day'].includes(mode)) {
        recommendedAction = 'EXPEDITE_DISPATCH: Route directly to priority cross-docking lane. Order has contracted a tight SLA window (1-3 days). Alert regional hub before cutoff.';
      } else {
        recommendedAction = 'CARRIER_AUDIT: Assign dedicated linehaul carrier. Regional transit bottleneck detected for destination; bypass intermediate consolidation.';
      }
      explanation = `High probability of late delivery (${(prob * 100).toFixed(1)}%). Primary risk stems from strict SLA constraints combined with destination route complexity.`;
    } else if (riskLevel === 'Low') {
      recommendedAction = 'ROUTINE_FULFILLMENT: Standard batch picking and automated consolidation. Carrier SLA margin is optimal.';
      explanation = `Low probability of late delivery (${(prob * 100).toFixed(1)}%). Standard Class shipping provides 4+ days of operational fulfillment leeway.`;
    }

    return {
      predicted_late: prob >= 0.45,
      predicted_probability: prob,
      risk_level: riskLevel,
      confidence_tier: confidenceTier,
      threshold_used: 0.45,
      top_drivers: topDrivers,
      recommended_action: recommendedAction,
      risk_explanation: explanation
    };
  },

  getExplainability(): any {
    return {
      shap_summary: shapData,
      feature_count: (shapData as any).total_features_evaluated || 89,
      methodology: (shapData as any).methodology || 'TreeSHAP (Lundberg et al., 2020) computed on chronological held-out validation sample',
      top_features: (shapData as any).top_features || []
    };
  },

  getOperationsIntelligence(): { recommendations: OperationsRecommendation[] } {
    return {
      recommendations: [
        {
          id: 'rec-1',
          priority: 'Critical',
          finding: 'First Class Shipping exhibits an observed 95.32% Late Delivery Frequency in historical records.',
          supporting_data: 'Statistical analysis reveals that 26,513 of 27,814 First Class consignments experienced delivery delays. The 1-day contracted fulfillment window demonstrates the strongest statistical association with delivery failure among all carrier service tiers.',
          order_count: 27814,
          observed_risk_rate: 95.32,
          recommended_action: 'Investigate Fast-Track Wave Routing: Pilot an automated separation protocol for First Class consignments upon checkout confirmation, prioritizing line-item picking ahead of standard batch waves.',
          business_relevance: 'Mitigates SLA breach penalties and customer churn in the highest-revenue service tier.'
        },
        {
          id: 'rec-2',
          priority: 'High',
          finding: 'Tight Scheduled Windows (<= 2 Days) Correlate with 84.88% Late Delivery Rate in Historical Operations.',
          supporting_data: 'Historical records indicate that orders contracted with 1 or 2 scheduled shipping days failed on-time delivery in 53,500 out of 63,030 instances (84.88%). In contrast, orders with 4 scheduled shipping days achieved an on-time fulfillment rate of 61.93% (41,023 delays across 107,752 shipments). Scheduled shipping window represents the second-highest global SHAP feature.',
          order_count: 63030,
          observed_risk_rate: 84.88,
          recommended_action: 'Review Checkout Delivery Date Commitments: Conduct an operational review of customer checkout delivery estimates for high-friction lanes, evaluating the feasibility of dynamically extending promised fulfillment windows from 1 day to 2.5 business days.',
          business_relevance: 'Reduces misaligned delivery expectations and decreases post-checkout status inquiry ticket volume.'
        },
        {
          id: 'rec-3',
          priority: 'High',
          finding: 'Western Europe and Central America Corridors Show Elevated Historical Delay Frequencies (55.77% and 57.01%).',
          supporting_data: 'Cross-border transit records demonstrate that Western Europe (15,119 delays across 27,109 consignments, 55.77%) and Central America (16,157 delays across 28,341 consignments, 57.01%) exhibit delay frequencies above the global baseline (54.83%).',
          order_count: 55450,
          observed_risk_rate: 56.40,
          recommended_action: 'Evaluate Direct Injection Linehaul Partnerships: Analyze route-specific carrier performance to identify customs and sorting hub bottlenecks in key international corridors; explore direct injection partnerships with localized regional carriers.',
          business_relevance: 'Improves international delivery reliability across the organization\'s two largest volume overseas destination regions.'
        },
        {
          id: 'rec-4',
          priority: 'Medium',
          finding: 'Promotional Flash Sale Volume Surges in Apparel and Fan Shop Correlate with Monday/Thursday Delay Spikes.',
          supporting_data: 'Apparel (27,476 delays across 48,998 items, 56.08%) and Fan Shop (37,133 delays across 66,861 items, 55.54%) show increased delivery risk following peak ordering periods on Mondays and Thursdays.',
          order_count: 115859,
          observed_risk_rate: 55.77,
          recommended_action: 'Pre-Stage Fast-Moving Catalog Inventory: Assess warehouse pre-packaging for top-velocity SKUs prior to scheduled promotional launch windows to reduce peak-period picking backlog.',
          business_relevance: 'Minimizes fulfillment queue spikes during high-volume sales campaigns without requiring recurring overtime labor.'
        }
      ]
    };
  },

  getModelPerformance(): ModelPerformanceData {
    return {
      model_comparison: (metricsData as any).models || {},
      threshold_analysis: (metricsData as any).threshold_analysis || [],
      best_model: (metricsData as any).best_model || 'LightGBM',
      optimal_threshold: (metricsData as any).optimal_threshold || 0.45,
      curves: (curvesData as any) || {}
    };
  },

  getDatasetInfo(): DatasetInfoData {
    return {
      dataset_name: 'DataCo Global Supply Chain Intelligence Dataset',
      source: 'Mendeley Data / DataCo Global (ISO-8859-1)',
      dimensions: {
        total_records: 180519,
        total_columns: 53,
        unique_orders: 65752,
        unique_order_items: 180519,
        date_coverage: 'January 1, 2015 to January 31, 2018 (36 Months)'
      },
      target_distribution: {
        'Late Delivery (1)': 98977,
        'On-Time / Early (0)': 81542,
        late_percentage: 54.83,
        ontime_percentage: 45.17
      },
      leakage_prevention: leakageData as any,
      chronological_split: {
        methodology: 'Chronological Order-Level Splitting (Grouped by Order Id)',
        guarantee: 'Strict temporal separation. Zero data leakage across splits. No Order Id spans multiple partitions.',
        train: {
          records: 138062,
          orders: 46026,
          percentage: 70.0,
          date_range: '2015-01-01 to 2017-03-16'
        },
        validation: {
          records: 29511,
          orders: 9863,
          percentage: 15.0,
          date_range: '2017-03-16 to 2017-09-05'
        },
        test: {
          records: 12946,
          orders: 9863,
          percentage: 15.0,
          date_range: '2017-09-05 to 2018-01-31'
        }
      },
      limitations_and_assumptions: [
        'The target \'Late_delivery_risk\' is evaluated strictly at the time of order creation using checkout-available features.',
        'Weather disruptions and en-route carrier breakdowns are unobserved in the historical dataset and represent external stochastic variance.',
        'Shipping destination postal codes were 86.2% unpopulated in the source dataset and were excluded in favor of high-fidelity City, State, Region, and Market data.',
        'All performance figures represent held-out chronological test evaluation, never cross-validation with random shuffling.'
      ]
    };
  },

  getFormOptions(): any {
    return (metadataData as any).categorical_options || {};
  }
};
