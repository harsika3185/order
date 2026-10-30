import os
import sys
import json
import pandas as pd
import numpy as np

# Ensure project root is in sys.path for portability
_proj_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _proj_root not in sys.path:
    sys.path.insert(0, _proj_root)

from backend.app.utils.paths import resolve_path

def run_profiling():
    csv_path = resolve_path("data", "DataCoSupplyChainDataset.csv")
    print(f"Loading dataset from: {csv_path}...")
    
    # Try different encodings as DataCo often has latin-1 / ISO-8859-1
    try:
        df = pd.read_csv(csv_path, encoding='utf-8')
    except UnicodeDecodeError:
        print("UTF-8 decoding failed, trying ISO-8859-1...")
        df = pd.read_csv(csv_path, encoding='ISO-8859-1')
        
    print(f"Dataset successfully loaded. Shape: {df.shape}")
    
    total_records, total_columns = df.shape
    columns = list(df.columns)
    
    # Missing values
    missing_counts = df.isnull().sum()
    missing_summary = {col: int(count) for col, count in missing_counts.items() if count > 0}
    
    # Duplicates
    duplicate_rows = int(df.duplicated().sum())
    
    # Order ID frequency
    unique_orders = int(df['Order Id'].nunique())
    unique_order_items = int(df['Order Item Id'].nunique()) if 'Order Item Id' in df.columns else None
    order_id_counts = df['Order Id'].value_counts()
    items_per_order = {
        "min": int(order_id_counts.min()),
        "max": int(order_id_counts.max()),
        "mean": float(order_id_counts.mean()),
        "median": float(order_id_counts.median()),
        "single_item_orders": int((order_id_counts == 1).sum()),
        "multi_item_orders": int((order_id_counts > 1).sum()),
    }
    
    # Target variable distribution
    target_col = 'Late_delivery_risk'
    if target_col in df.columns:
        target_counts = df[target_col].value_counts().to_dict()
        target_percentages = (df[target_col].value_counts(normalize=True) * 100).round(2).to_dict()
        target_summary = {
            "counts": {str(k): int(v) for k, v in target_counts.items()},
            "percentages": {str(k): float(v) for k, v in target_percentages.items()}
        }
    else:
        target_summary = "Target column not found"
        
    # Date ranges
    date_cols = [c for c in df.columns if 'date' in c.lower()]
    date_summary = {}
    for dc in date_cols:
        try:
            converted = pd.to_datetime(df[dc], errors='coerce')
            date_summary[dc] = {
                "min": str(converted.min()),
                "max": str(converted.max()),
                "missing_dates": int(converted.isnull().sum())
            }
        except Exception as e:
            date_summary[dc] = str(e)
            
    # Key categorical columns and their uniques
    cat_cols = ['Type', 'Delivery Status', 'Shipping Mode', 'Customer Segment', 
                'Department Name', 'Category Name', 'Order Region', 'Market', 'Order Country']
    cat_summary = {}
    for cc in cat_cols:
        if cc in df.columns:
            cat_summary[cc] = {
                "unique_count": int(df[cc].nunique()),
                "top_5": df[cc].value_counts().head(5).to_dict()
            }
            
    # Delivery Status vs Late_delivery_risk cross-tabulation
    cross_tab = {}
    if 'Delivery Status' in df.columns and target_col in df.columns:
        ct = pd.crosstab(df['Delivery Status'], df[target_col])
        cross_tab = ct.to_dict()
        
    # Order-level consistency of Late_delivery_risk across items within the same Order Id
    order_target_consistency = df.groupby('Order Id')[target_col].nunique()
    inconsistent_orders = int((order_target_consistency > 1).sum())
    
    report = {
        "dataset_name": "DataCoSupplyChainDataset",
        "total_records": total_records,
        "total_columns": total_columns,
        "columns": columns,
        "duplicate_rows": duplicate_rows,
        "unique_orders": unique_orders,
        "unique_order_items": unique_order_items,
        "items_per_order": items_per_order,
        "inconsistent_target_within_order": inconsistent_orders,
        "target_distribution": target_summary,
        "date_ranges": date_summary,
        "missing_values": missing_summary,
        "categorical_summary": cat_summary,
        "delivery_status_vs_target_crosstab": cross_tab
    }
    
    report_dir = resolve_path("outputs", "reports")
    os.makedirs(report_dir, exist_ok=True)
    report_file = resolve_path("outputs", "reports", "dataset_profile_report.json")
    with open(report_file, "w") as f:
        json.dump(report, f, indent=2)
        
    print(f"\n--- PROFILING SUMMARY ---")
    print(f"Total Rows: {total_records:,}")
    print(f"Total Columns: {total_columns}")
    print(f"Unique Orders: {unique_orders:,} | Unique Order Items: {unique_order_items:,}")
    print(f"Single item orders: {items_per_order['single_item_orders']:,} | Multi-item orders: {items_per_order['multi_item_orders']:,}")
    print(f"Target distribution: {target_summary}")
    print(f"Target inconsistency within same Order ID: {inconsistent_orders} orders")
    print(f"Missing values found in {len(missing_summary)} columns: {missing_summary}")
    print(f"Report written to {report_file}")

if __name__ == "__main__":
    run_profiling()
