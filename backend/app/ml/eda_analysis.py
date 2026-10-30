import os
import sys
import json
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# Ensure project root is in sys.path for portability
_proj_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _proj_root not in sys.path:
    sys.path.insert(0, _proj_root)

from backend.app.utils.paths import resolve_path

# Set publication/enterprise quality plotting styles
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['figure.dpi'] = 150
plt.rcParams['axes.edgecolor'] = '#CBD5E1'
plt.rcParams['axes.linewidth'] = 0.8
plt.rcParams['grid.color'] = '#F1F5F9'
plt.rcParams['grid.linestyle'] = '--'

# Professional Enterprise Palette
PRIMARY_COLOR = '#1E293B'      # Slate 800
SECONDARY_COLOR = '#3B82F6'    # Blue 500
ACCENT_COLOR = '#0EA5E9'       # Sky 500
LATE_COLOR = '#E11D48'         # Rose 600
ONTIME_COLOR = '#059669'       # Emerald 600
MUTED_COLOR = '#64748B'        # Slate 500
BG_COLOR = '#FFFFFF'

def run_eda():
    print("Starting Comprehensive Exploratory Data Analysis...")
    csv_path = resolve_path("data", "DataCoSupplyChainDataset.csv")
    df = pd.read_csv(csv_path, encoding='ISO-8859-1')
    
    charts_dir = resolve_path("outputs", "charts")
    metrics_dir = resolve_path("outputs", "metrics")
    reports_dir = resolve_path("outputs", "reports")
    os.makedirs(charts_dir, exist_ok=True)
    os.makedirs(metrics_dir, exist_ok=True)
    os.makedirs(reports_dir, exist_ok=True)
    
    # 1. Parse dates
    df['order_date'] = pd.to_datetime(df['order date (DateOrders)'])
    df['order_year_month'] = df['order_date'].dt.to_period('M').astype(str)
    df['order_month'] = df['order_date'].dt.month
    df['order_dayofweek'] = df['order_date'].dt.day_name()
    df['order_hour'] = df['order_date'].dt.hour
    
    # Target
    target = 'Late_delivery_risk'
    
    # Overall metrics
    total_records = len(df)
    total_orders = df['Order Id'].nunique()
    total_late = int(df[target].sum())
    total_ontime = total_records - total_late
    overall_late_rate = round(float(total_late / total_records) * 100, 2)
    
    print(f"Total rows: {total_records:,} | Late delivery rate: {overall_late_rate}%")
    
    # -------------------------------------------------------------
    # A. OVERALL DELIVERY PERFORMANCE
    # -------------------------------------------------------------
    delivery_status_counts = df['Delivery Status'].value_counts().to_dict()
    delivery_status_pcts = (df['Delivery Status'].value_counts(normalize=True) * 100).round(2).to_dict()
    
    fig, ax = plt.subplots(figsize=(8, 4.5), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    statuses = list(delivery_status_counts.keys())
    counts = list(delivery_status_counts.values())
    colors = [LATE_COLOR if s == 'Late delivery' else ONTIME_COLOR if 'time' in s.lower() else SECONDARY_COLOR for s in statuses]
    
    bars = ax.barh(statuses, counts, color=colors, height=0.55)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.xaxis.grid(True)
    ax.set_xlabel('Number of Shipments', fontsize=10, color=PRIMARY_COLOR, fontweight='bold')
    ax.set_title('Overall Delivery Status Distribution', fontsize=12, color=PRIMARY_COLOR, fontweight='bold', pad=15)
    for bar in bars:
        w = bar.get_width()
        pct = (w / total_records) * 100
        ax.text(w + 1200, bar.get_y() + bar.get_height()/2, f'{w:,} ({pct:.1f}%)', 
                va='center', fontsize=9, color=PRIMARY_COLOR)
    plt.tight_layout()
    plt.savefig(os.path.join(charts_dir, "01_overall_delivery_distribution.png"))
    plt.close()
    
    # -------------------------------------------------------------
    # B. SHIPPING MODE ANALYSIS
    # -------------------------------------------------------------
    ship_agg = df.groupby('Shipping Mode').agg(
        total_orders=('Order Id', 'count'),
        late_orders=(target, 'sum'),
        avg_scheduled_days=('Days for shipment (scheduled)', 'mean')
    ).reset_index()
    ship_agg['late_rate'] = (ship_agg['late_orders'] / ship_agg['total_orders'] * 100).round(2)
    ship_agg = ship_agg.sort_values(by='late_rate', ascending=False)
    
    fig, ax1 = plt.subplots(figsize=(8, 4.5), facecolor=BG_COLOR)
    ax1.set_facecolor(BG_COLOR)
    ax2 = ax1.twinx()
    
    x = np.arange(len(ship_agg))
    width = 0.38
    
    bars1 = ax1.bar(x - width/2, ship_agg['total_orders'], width, label='Order Volume', color=PRIMARY_COLOR, alpha=0.85)
    bars2 = ax2.bar(x + width/2, ship_agg['late_rate'], width, label='Late Rate (%)', color=LATE_COLOR, alpha=0.9)
    
    ax1.set_xticks(x)
    ax1.set_xticklabels(ship_agg['Shipping Mode'], fontsize=9, fontweight='bold', color=PRIMARY_COLOR)
    ax1.set_ylabel('Total Volume', color=PRIMARY_COLOR, fontsize=10, fontweight='bold')
    ax2.set_ylabel('Late Delivery Rate (%)', color=LATE_COLOR, fontsize=10, fontweight='bold')
    ax1.spines['top'].set_visible(False)
    ax2.spines['top'].set_visible(False)
    ax1.yaxis.grid(True)
    ax1.set_title('Late Delivery Rate & Volume by Shipping Mode', fontsize=12, color=PRIMARY_COLOR, fontweight='bold', pad=15)
    
    for bar in bars2:
        h = bar.get_height()
        ax2.text(bar.get_x() + bar.get_width()/2, h + 1, f'{h:.1f}%', ha='center', va='bottom', fontsize=9, color=LATE_COLOR, fontweight='bold')
        
    plt.tight_layout()
    plt.savefig(os.path.join(charts_dir, "02_shipping_mode_analysis.png"))
    plt.close()
    
    # -------------------------------------------------------------
    # C. REGIONAL AND MARKET ANALYSIS
    # -------------------------------------------------------------
    market_agg = df.groupby('Market').agg(
        total_orders=('Order Id', 'count'),
        late_orders=(target, 'sum')
    ).reset_index()
    market_agg['late_rate'] = (market_agg['late_orders'] / market_agg['total_orders'] * 100).round(2)
    market_agg = market_agg.sort_values(by='late_rate', ascending=False)
    
    region_agg = df.groupby('Order Region').agg(
        total_orders=('Order Id', 'count'),
        late_orders=(target, 'sum')
    ).reset_index()
    region_agg['late_rate'] = (region_agg['late_orders'] / region_agg['total_orders'] * 100).round(2)
    region_agg = region_agg.sort_values(by='late_rate', ascending=True) # for horizontal bar
    
    fig, ax = plt.subplots(figsize=(10, 7), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    bars = ax.barh(region_agg['Order Region'], region_agg['late_rate'], color=SECONDARY_COLOR, height=0.6)
    ax.axvline(overall_late_rate, color=LATE_COLOR, linestyle='--', linewidth=1.5, label=f'Global Benchmark ({overall_late_rate}%)')
    ax.set_xlabel('Late Delivery Rate (%)', fontsize=10, color=PRIMARY_COLOR, fontweight='bold')
    ax.set_title('Regional Late Delivery Risk Ranking (All 23 Global Regions)', fontsize=12, color=PRIMARY_COLOR, fontweight='bold', pad=15)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.xaxis.grid(True)
    ax.legend(frameon=False, loc='lower right')
    
    for bar in bars:
        w = bar.get_width()
        ax.text(w + 0.3, bar.get_y() + bar.get_height()/2, f'{w:.1f}%', va='center', fontsize=8, color=PRIMARY_COLOR)
        
    plt.tight_layout()
    plt.savefig(os.path.join(charts_dir, "03_regional_risk_ranking.png"))
    plt.close()
    
    # -------------------------------------------------------------
    # D. PRODUCT CATEGORY & DEPARTMENT ANALYSIS
    # -------------------------------------------------------------
    dept_agg = df.groupby('Department Name').agg(
        total_orders=('Order Id', 'count'),
        late_orders=(target, 'sum'),
        avg_item_price=('Order Item Product Price', 'mean'),
        avg_discount_rate=('Order Item Discount Rate', 'mean')
    ).reset_index()
    dept_agg['late_rate'] = (dept_agg['late_orders'] / dept_agg['total_orders'] * 100).round(2)
    dept_agg = dept_agg.sort_values(by='late_rate', ascending=False)
    
    fig, ax = plt.subplots(figsize=(9, 5), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    bars = ax.barh(dept_agg['Department Name'], dept_agg['late_rate'], color=PRIMARY_COLOR, height=0.55)
    ax.axvline(overall_late_rate, color=LATE_COLOR, linestyle='--', linewidth=1.5, label=f'Global Benchmark ({overall_late_rate}%)')
    ax.set_xlabel('Late Delivery Rate (%)', fontsize=10, color=PRIMARY_COLOR, fontweight='bold')
    ax.set_title('Department-Level Late Delivery Risk Distribution', fontsize=12, color=PRIMARY_COLOR, fontweight='bold', pad=15)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.xaxis.grid(True)
    ax.legend(frameon=False, loc='lower right')
    
    for bar in bars:
        w = bar.get_width()
        ax.text(w + 0.3, bar.get_y() + bar.get_height()/2, f'{w:.1f}%', va='center', fontsize=8, color=PRIMARY_COLOR)
        
    plt.tight_layout()
    plt.savefig(os.path.join(charts_dir, "04_department_risk_analysis.png"))
    plt.close()
    
    # -------------------------------------------------------------
    # E. TEMPORAL TRENDS (Monthly and Day of Week)
    # -------------------------------------------------------------
    monthly_agg = df.groupby('order_year_month').agg(
        total_orders=('Order Id', 'count'),
        late_orders=(target, 'sum')
    ).reset_index()
    monthly_agg['late_rate'] = (monthly_agg['late_orders'] / monthly_agg['total_orders'] * 100).round(2)
    # Filter out partial trailing month if extremely small (e.g. 2018-01 vs 2018-02)
    monthly_agg = monthly_agg.sort_values(by='order_year_month')
    
    fig, ax1 = plt.subplots(figsize=(11, 4.5), facecolor=BG_COLOR)
    ax1.set_facecolor(BG_COLOR)
    ax2 = ax1.twinx()
    
    x_labels = monthly_agg['order_year_month'].tolist()
    x_indices = range(len(x_labels))
    
    ax1.plot(x_indices, monthly_agg['total_orders'], color=PRIMARY_COLOR, marker='o', markersize=3, linewidth=1.5, label='Order Volume')
    ax2.plot(x_indices, monthly_agg['late_rate'], color=LATE_COLOR, marker='s', markersize=3, linewidth=1.8, linestyle='-', label='Late Delivery Rate (%)')
    
    ax1.set_xticks(x_indices[::2])
    ax1.set_xticklabels(x_labels[::2], rotation=45, ha='right', fontsize=8)
    ax1.set_ylabel('Monthly Order Volume', color=PRIMARY_COLOR, fontsize=10, fontweight='bold')
    ax2.set_ylabel('Late Delivery Rate (%)', color=LATE_COLOR, fontsize=10, fontweight='bold')
    ax1.spines['top'].set_visible(False)
    ax2.spines['top'].set_visible(False)
    ax1.yaxis.grid(True)
    ax1.set_title('Chronological Order Volume & Late Delivery Rate Trend (2015 - 2018)', fontsize=12, color=PRIMARY_COLOR, fontweight='bold', pad=15)
    
    plt.tight_layout()
    plt.savefig(os.path.join(charts_dir, "05_monthly_trends.png"))
    plt.close()
    
    # -------------------------------------------------------------
    # F. COMBINED ANALYSIS: Shipping Mode x Market Heatmap
    # -------------------------------------------------------------
    pivot_risk = df.pivot_table(index='Market', columns='Shipping Mode', values=target, aggfunc='mean') * 100
    pivot_volume = df.pivot_table(index='Market', columns='Shipping Mode', values='Order Id', aggfunc='count')
    
    fig, ax = plt.subplots(figsize=(8, 4.5), facecolor=BG_COLOR)
    sns.heatmap(pivot_risk, annot=True, fmt='.1f', cmap='YlOrRd', cbar_kws={'label': 'Late Rate (%)'}, 
                linewidths=1, linecolor='#CBD5E1', ax=ax)
    ax.set_title('Late Delivery Rate (%) by Market and Shipping Mode', fontsize=12, color=PRIMARY_COLOR, fontweight='bold', pad=15)
    ax.set_ylabel('Market', fontsize=10, fontweight='bold', color=PRIMARY_COLOR)
    ax.set_xlabel('Shipping Mode', fontsize=10, fontweight='bold', color=PRIMARY_COLOR)
    plt.tight_layout()
    plt.savefig(os.path.join(charts_dir, "06_market_shipping_heatmap.png"))
    plt.close()
    
    # -------------------------------------------------------------
    # G. SCHEDULED DAYS VS LATE RATE ANALYSIS
    # -------------------------------------------------------------
    sched_agg = df.groupby('Days for shipment (scheduled)').agg(
        total_orders=('Order Id', 'count'),
        late_orders=(target, 'sum')
    ).reset_index()
    sched_agg['late_rate'] = (sched_agg['late_orders'] / sched_agg['total_orders'] * 100).round(2)
    
    fig, ax = plt.subplots(figsize=(7, 4), facecolor=BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    bars = ax.bar(sched_agg['Days for shipment (scheduled)'].astype(str), sched_agg['late_rate'], color=SECONDARY_COLOR, width=0.5)
    ax.set_xlabel('Scheduled Shipping SLA Days', fontsize=10, color=PRIMARY_COLOR, fontweight='bold')
    ax.set_ylabel('Late Delivery Rate (%)', fontsize=10, color=PRIMARY_COLOR, fontweight='bold')
    ax.set_title('Late Delivery Rate by Scheduled Shipping Commitment', fontsize=12, color=PRIMARY_COLOR, fontweight='bold', pad=15)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.yaxis.grid(True)
    for bar in bars:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width()/2, h + 1, f'{h:.1f}%', ha='center', va='bottom', fontsize=9, color=PRIMARY_COLOR, fontweight='bold')
    plt.tight_layout()
    plt.savefig(os.path.join(charts_dir, "07_scheduled_days_risk.png"))
    plt.close()
    
    # -------------------------------------------------------------
    # Export comprehensive JSON summary for API and Frontend
    # -------------------------------------------------------------
    eda_summary = {
        "overall": {
            "total_records": int(total_records),
            "total_orders": int(total_orders),
            "total_late": int(total_late),
            "total_ontime": int(total_ontime),
            "late_delivery_rate": overall_late_rate,
            "delivery_status_distribution": {
                k: {"count": int(v), "percentage": float(delivery_status_pcts[k])}
                for k, v in delivery_status_counts.items()
            }
        },
        "shipping_modes": [
            {
                "shipping_mode": str(row['Shipping Mode']),
                "total_orders": int(row['total_orders']),
                "late_orders": int(row['late_orders']),
                "late_rate": float(row['late_rate']),
                "avg_scheduled_days": round(float(row['avg_scheduled_days']), 1)
            } for _, row in ship_agg.iterrows()
        ],
        "markets": [
            {
                "market": str(row['Market']),
                "total_orders": int(row['total_orders']),
                "late_orders": int(row['late_orders']),
                "late_rate": float(row['late_rate'])
            } for _, row in market_agg.iterrows()
        ],
        "regions": [
            {
                "region": str(row['Order Region']),
                "total_orders": int(row['total_orders']),
                "late_orders": int(row['late_orders']),
                "late_rate": float(row['late_rate'])
            } for _, row in region_agg.sort_values(by='late_rate', ascending=False).iterrows()
        ],
        "departments": [
            {
                "department": str(row['Department Name']),
                "total_orders": int(row['total_orders']),
                "late_orders": int(row['late_orders']),
                "late_rate": float(row['late_rate']),
                "avg_price": round(float(row['avg_item_price']), 2),
                "avg_discount_rate": round(float(row['avg_discount_rate']), 3)
            } for _, row in dept_agg.iterrows()
        ],
        "monthly_trend": [
            {
                "month": str(row['order_year_month']),
                "total_orders": int(row['total_orders']),
                "late_orders": int(row['late_orders']),
                "late_rate": float(row['late_rate'])
            } for _, row in monthly_agg.iterrows()
        ],
        "scheduled_days": [
            {
                "scheduled_days": int(row['Days for shipment (scheduled)']),
                "total_orders": int(row['total_orders']),
                "late_orders": int(row['late_orders']),
                "late_rate": float(row['late_rate'])
            } for _, row in sched_agg.iterrows()
        ],
        "cross_market_shipping": pivot_risk.round(2).to_dict()
    }
    
    with open(os.path.join(reports_dir, "eda_summary.json"), "w") as f:
        json.dump(eda_summary, f, indent=2)
        
    print("EDA completed successfully! Visualizations saved to outputs/charts/ and data to outputs/reports/eda_summary.json")

if __name__ == "__main__":
    run_eda()
