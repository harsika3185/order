import os
import sys

# Ensure project root is in sys.path
_current_dir = os.path.dirname(os.path.abspath(__file__))
_proj_root = os.path.abspath(os.path.join(_current_dir, "..", "..", ".."))
if _proj_root not in sys.path:
    sys.path.insert(0, _proj_root)

import json
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import (
    precision_score, recall_score, f1_score, accuracy_score,
    roc_auc_score, average_precision_score, confusion_matrix
)
from scipy.stats import spearmanr
from backend.app.utils.paths import resolve_path

def run_deep_audit():
    print("==================================================")
    print("STARTING TECHNICAL CONSISTENCY & ACCURACY AUDIT")
    print("==================================================")
    
    csv_path = resolve_path("data", "DataCoSupplyChainDataset.csv")
    df = pd.read_csv(csv_path, encoding='ISO-8859-1')
    
    # -------------------------------------------------------------
    # AUDIT 1: DATASET RECORD COUNTS & ORDER/ITEM CONSIGNMENT DISTINCTION
    # -------------------------------------------------------------
    total_records = len(df)
    unique_orders = df['Order Id'].nunique()
    unique_order_items = df['Order Item Id'].nunique()
    print(f"\n[AUDIT 1] Granularity Check:")
    print(f"  Total Rows: {total_records}")
    print(f"  Unique Order IDs: {unique_orders}")
    print(f"  Unique Order Item IDs: {unique_order_items}")
    assert total_records == 180519, f"Row count mismatch: {total_records}"
    assert unique_orders == 65752, f"Unique order count mismatch: {unique_orders}"
    assert unique_order_items == 180519, f"Unique order item count mismatch: {unique_order_items}"
    
    # Check consistency of Late_delivery_risk per Order Id
    risk_per_order = df.groupby('Order Id')['Late_delivery_risk'].nunique()
    multi_risk_orders = (risk_per_order > 1).sum()
    print(f"  Orders with differing item-level risk: {multi_risk_orders}")
    assert multi_risk_orders == 0, "Late_delivery_risk differs across items within same order!"
    
    # -------------------------------------------------------------
    # AUDIT 2: SHIPPING MODE LATE DELIVERY RATES
    # -------------------------------------------------------------
    print(f"\n[AUDIT 2] Shipping Mode Breakdown:")
    sm_df = df.groupby('Shipping Mode').agg(
        total=('Order Id', 'count'),
        late=('Late_delivery_risk', 'sum'),
        mean_late=('Late_delivery_risk', 'mean'),
        avg_scheduled=('Days for shipment (scheduled)', 'mean')
    ).reset_index()
    sm_df['late_rate_pct'] = (sm_df['mean_late'] * 100).round(2)
    for _, r in sm_df.iterrows():
        print(f"  {r['Shipping Mode']}: Total={r['total']:,}, Late={r['late']:,}, LateRate={r['late_rate_pct']}%, AvgScheduledDays={r['avg_scheduled']:.2f}")

    # -------------------------------------------------------------
    # AUDIT 3: SCHEDULED DAYS VS LATE DELIVERY RISK
    # -------------------------------------------------------------
    print(f"\n[AUDIT 3] Scheduled Days Breakdown:")
    sd_df = df.groupby('Days for shipment (scheduled)').agg(
        total=('Order Id', 'count'),
        late=('Late_delivery_risk', 'sum'),
        mean_late=('Late_delivery_risk', 'mean')
    ).reset_index()
    sd_df['late_rate_pct'] = (sd_df['mean_late'] * 100).round(2)
    for _, r in sd_df.iterrows():
        print(f"  {r['Days for shipment (scheduled)']} Days: Total={r['total']:,}, Late={r['late']:,}, LateRate={r['late_rate_pct']}%")

    # -------------------------------------------------------------
    # AUDIT 4: ALL 23 REGIONS
    # -------------------------------------------------------------
    print(f"\n[AUDIT 4] Regional Statistics (All 23 Regions):")
    reg_df = df.groupby('Order Region').agg(
        total=('Order Id', 'count'),
        late=('Late_delivery_risk', 'sum'),
        mean_late=('Late_delivery_risk', 'mean')
    ).reset_index()
    reg_df['late_rate_pct'] = (reg_df['mean_late'] * 100).round(2)
    print(f"  Total unique regions in dataset: {len(reg_df)}")
    assert len(reg_df) == 23, f"Expected 23 regions, found {len(reg_df)}"

    # -------------------------------------------------------------
    # AUDIT 5: CHRONOLOGICAL ORDER-GROUPED SPLIT & ZERO LEAKAGE
    # -------------------------------------------------------------
    print(f"\n[AUDIT 5] Chronological Split & Leakage Verification:")
    df['order_datetime'] = pd.to_datetime(df['order date (DateOrders)'])
    order_dates = df.groupby('Order Id')['order_datetime'].min().reset_index()
    order_dates = order_dates.sort_values(by=['order_datetime', 'Order Id']).reset_index(drop=True)
    
    total_unique_orders = len(order_dates)
    train_end_idx = int(total_unique_orders * 0.70)
    val_end_idx = int(total_unique_orders * 0.85)
    
    train_order_ids = set(order_dates.iloc[:train_end_idx]['Order Id'])
    val_order_ids = set(order_dates.iloc[train_end_idx:val_end_idx]['Order Id'])
    test_order_ids = set(order_dates.iloc[val_end_idx:]['Order Id'])
    
    # Check disjointness
    train_val_overlap = len(train_order_ids.intersection(val_order_ids))
    val_test_overlap = len(val_order_ids.intersection(test_order_ids))
    train_test_overlap = len(train_order_ids.intersection(test_order_ids))
    print(f"  Train Order IDs: {len(train_order_ids)}")
    print(f"  Val Order IDs: {len(val_order_ids)}")
    print(f"  Test Order IDs: {len(test_order_ids)}")
    print(f"  Train-Val Overlap: {train_val_overlap}")
    print(f"  Val-Test Overlap: {val_test_overlap}")
    print(f"  Train-Test Overlap: {train_test_overlap}")
    assert train_val_overlap == 0 and val_test_overlap == 0 and train_test_overlap == 0, "ORDER OVERLAP DETECTED!"
    
    df_train = df[df['Order Id'].isin(train_order_ids)].copy()
    df_val = df[df['Order Id'].isin(val_order_ids)].copy()
    df_test = df[df['Order Id'].isin(test_order_ids)].copy()
    
    print(f"  Train Date Range: {df_train['order_datetime'].min()} to {df_train['order_datetime'].max()} ({len(df_train)} rows)")
    print(f"  Val Date Range:   {df_val['order_datetime'].min()} to {df_val['order_datetime'].max()} ({len(df_val)} rows)")
    print(f"  Test Date Range:  {df_test['order_datetime'].min()} to {df_test['order_datetime'].max()} ({len(df_test)} rows)")
    assert df_train['order_datetime'].max() <= df_val['order_datetime'].min(), "Temporal order leak between train and val!"
    assert df_val['order_datetime'].max() <= df_test['order_datetime'].min(), "Temporal order leak between val and test!"

    # -------------------------------------------------------------
    # AUDIT 6: MODEL PREDICTION AUDIT WITH SAVED PIPELINES
    # -------------------------------------------------------------
    print(f"\n[AUDIT 6] Loading Trained Pipeline & Validating Predictions...")
    pipeline = joblib.load(resolve_path("models", "best_model.joblib"))
    preprocessor = joblib.load(resolve_path("models", "preprocessor.joblib"))
    classifier = joblib.load(resolve_path("models", "lgbm_classifier.joblib"))
    
    # Prepare features
    for split_df in [df_train, df_val, df_test]:
        split_df['order_month'] = split_df['order_datetime'].dt.month
        split_df['order_dayofweek'] = split_df['order_datetime'].dt.day_name()
        split_df['order_hour'] = split_df['order_datetime'].dt.hour
        split_df['is_weekend'] = split_df['order_datetime'].dt.dayofweek.isin([5, 6]).astype(int)
        split_df['order_quarter'] = split_df['order_datetime'].dt.quarter

    num_features = [
        'Days for shipment (scheduled)', 'Order Item Quantity', 'Order Item Product Price',
        'Order Item Discount Rate', 'Order Item Discount', 'Sales', 'Order Item Total',
        'order_month', 'order_hour', 'order_quarter', 'is_weekend'
    ]
    cat_features = [
        'Shipping Mode', 'Type', 'Customer Segment', 'Department Name',
        'Category Name', 'Market', 'Order Region', 'order_dayofweek', 'Customer Country'
    ]
    all_features = num_features + cat_features
    target_col = 'Late_delivery_risk'
    
    X_val = df_val[all_features]
    y_val = df_val[target_col]
    X_test = df_test[all_features]
    y_test = df_test[target_col]
    
    val_probs = pipeline.predict_proba(X_val)[:, 1]
    test_probs = pipeline.predict_proba(X_test)[:, 1]
    
    # -------------------------------------------------------------
    # AUDIT 7: THRESHOLD AUDIT (0.35, 0.40, 0.45, 0.50, 0.55)
    # -------------------------------------------------------------
    print(f"\n[AUDIT 7] Multi-Threshold Audit on Validation Set (Tuning) & Held-Out Test Set:")
    thresholds = [0.35, 0.40, 0.45, 0.50, 0.55]
    print(f"{'Split':<6} | {'Thresh':<6} | {'Recall':<8} | {'Precision':<10} | {'F1-Score':<8} | {'Flagged':<8} | {'Flagged %':<10}")
    print("-" * 65)
    for t in thresholds:
        v_pred = (val_probs >= t).astype(int)
        v_rec = recall_score(y_val, v_pred)
        v_prec = precision_score(y_val, v_pred, zero_division=0)
        v_f1 = f1_score(y_val, v_pred)
        v_cnt = v_pred.sum()
        v_pct = (v_pred.mean() * 100)
        print(f"VAL    | {t:<6.2f} | {v_rec:<8.4f} | {v_prec:<10.4f} | {v_f1:<8.4f} | {v_cnt:<8} | {v_pct:<10.2f}%")
        
    print("-" * 65)
    for t in thresholds:
        t_pred = (test_probs >= t).astype(int)
        t_rec = recall_score(y_test, t_pred)
        t_prec = precision_score(y_test, t_pred, zero_division=0)
        t_f1 = f1_score(y_test, t_pred)
        t_cnt = t_pred.sum()
        t_pct = (t_pred.mean() * 100)
        print(f"TEST   | {t:<6.2f} | {t_rec:<8.4f} | {t_prec:<10.4f} | {t_f1:<8.4f} | {t_cnt:<8} | {t_pct:<10.2f}%")

    # Test set confusion matrices at 0.50 and 0.45
    print("\n[AUDIT 8] Confusion Matrix Verification:")
    for t in [0.45, 0.50]:
        t_pred = (test_probs >= t).astype(int)
        cm = confusion_matrix(y_test, t_pred)
        print(f"  Test Confusion Matrix at Threshold {t}:")
        print(f"    TN={cm[0, 0]:,}, FP={cm[0, 1]:,}, FN={cm[1, 0]:,}, TP={cm[1, 1]:,}")
        print(f"    Accuracy: {accuracy_score(y_test, t_pred):.4f}, Precision: {precision_score(y_test, t_pred):.4f}, Recall: {recall_score(y_test, t_pred):.4f}")

    # -------------------------------------------------------------
    # AUDIT 9: SHAP VALUES DIRECTIONALITY AUDIT
    # -------------------------------------------------------------
    print("\n[AUDIT 9] SHAP Values & Directionality Audit:")
    import shap
    explainer = shap.TreeExplainer(classifier)
    X_val_proc = preprocessor.transform(X_val)
    encoded_cat_names = preprocessor.named_transformers_['cat'].get_feature_names_out(cat_features).tolist()
    feature_names = num_features + encoded_cat_names
    
    # Calculate SHAP on sample of validation
    np.random.seed(42)
    sample_idx = np.random.choice(X_val_proc.shape[0], size=1000, replace=False)
    X_sample = X_val_proc[sample_idx]
    
    shap_vals = explainer.shap_values(X_sample)
    if isinstance(shap_vals, list):
        shap_vals_late = shap_vals[1]
    else:
        shap_vals_late = shap_vals
        
    mean_abs_shap = np.mean(np.abs(shap_vals_late), axis=0)
    top_indices = np.argsort(mean_abs_shap)[::-1][:15]
    
    print(f"{'Feature':<35} | {'Mean |SHAP|':<12} | {'Mean SHAP':<10} | {'Spearmanr(X, SHAP)':<20} | {'True Effect on Risk'}")
    print("-" * 105)
    for idx in top_indices:
        fn = feature_names[idx]
        m_abs = mean_abs_shap[idx]
        m_val = np.mean(shap_vals_late[:, idx])
        
        # Calculate correlation between feature value and SHAP value
        feat_vals = X_sample[:, idx]
        corr, _ = spearmanr(feat_vals, shap_vals_late[:, idx])
        if np.isnan(corr):
            # For constant or binary where all same
            corr = 0.0
            
        if corr > 0.05:
            effect = "Higher Value -> Increases Risk"
        elif corr < -0.05:
            effect = "Higher Value -> Decreases Risk"
        else:
            # If binary indicator
            if m_val > 0:
                effect = "Active Flag -> Increases Risk"
            else:
                effect = "Active Flag -> Decreases Risk"
                
        print(f"{fn:<35} | {m_abs:<12.5f} | {m_val:<10.5f} | {corr:<20.4f} | {effect}")

    print("\nAUDIT SCRIPT EXECUTION COMPLETED.")

if __name__ == "__main__":
    run_deep_audit()
