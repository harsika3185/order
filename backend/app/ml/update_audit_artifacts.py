import os
import json
import joblib
import numpy as np
import pandas as pd
from scipy.stats import spearmanr
import shap

def update_verified_artifacts():
    print("Generating verified audit artifacts...")
    csv_path = os.path.join("data", "DataCoSupplyChainDataset.csv")
    df = pd.read_csv(csv_path, encoding='ISO-8859-1')
    
    # Dates and chronological splitting
    df['order_datetime'] = pd.to_datetime(df['order date (DateOrders)'])
    order_dates = df.groupby('Order Id')['order_datetime'].min().reset_index()
    order_dates = order_dates.sort_values(by=['order_datetime', 'Order Id']).reset_index(drop=True)
    
    total_unique_orders = len(order_dates)
    train_end_idx = int(total_unique_orders * 0.70)
    val_end_idx = int(total_unique_orders * 0.85)
    
    train_order_ids = set(order_dates.iloc[:train_end_idx]['Order Id'])
    val_order_ids = set(order_dates.iloc[train_end_idx:val_end_idx]['Order Id'])
    test_order_ids = set(order_dates.iloc[val_end_idx:]['Order Id'])
    
    df_val = df[df['Order Id'].isin(val_order_ids)].copy()
    df_test = df[df['Order Id'].isin(test_order_ids)].copy()
    
    # Feature engineering
    for split_df in [df_val, df_test]:
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
    
    preprocessor = joblib.load(os.path.join("models", "preprocessor.joblib"))
    classifier = joblib.load(os.path.join("models", "lgbm_classifier.joblib"))
    
    X_val_proc = preprocessor.transform(X_val)
    X_test_proc = preprocessor.transform(X_test)
    
    encoded_cat_names = preprocessor.named_transformers_['cat'].get_feature_names_out(cat_features).tolist()
    feature_names = num_features + encoded_cat_names
    
    # -------------------------------------------------------------
    # 1. VERIFIED SHAP RE-CALCULATION WITH TRUE DIRECTIONALITY
    # -------------------------------------------------------------
    print("Computing TreeSHAP and true feature-risk correlation direction...")
    explainer = shap.TreeExplainer(classifier)
    np.random.seed(42)
    sample_idx = np.random.choice(X_val_proc.shape[0], size=1000, replace=False)
    X_sample = X_val_proc[sample_idx]
    
    shap_vals = explainer.shap_values(X_sample)
    if isinstance(shap_vals, list):
        shap_vals_late = shap_vals[1]
    else:
        shap_vals_late = shap_vals
        
    mean_abs_shap = np.mean(np.abs(shap_vals_late), axis=0)
    top_indices = np.argsort(mean_abs_shap)[::-1][:20]
    
    top_features_shap = []
    for idx in top_indices:
        fn = feature_names[idx]
        m_abs = float(mean_abs_shap[idx])
        feat_vals = X_sample[:, idx]
        corr, _ = spearmanr(feat_vals, shap_vals_late[:, idx])
        if np.isnan(corr):
            corr = 0.0
            
        # Mathematical direction: does a higher feature value increase or decrease log-odds of delay?
        if corr > 0.05:
            direction = "Risk Increasing"
            interpretation = "Higher feature values are associated with elevated late-delivery log-odds."
        elif corr < -0.05:
            direction = "Risk Decreasing"
            interpretation = "Higher feature values provide operational buffer, reducing late-delivery log-odds."
        else:
            m_val = np.mean(shap_vals_late[:, idx])
            direction = "Risk Increasing" if m_val > 0 else "Risk Decreasing"
            interpretation = "Binary indicator presence associated with late-delivery outcome."

        top_features_shap.append({
            "feature": fn,
            "importance": round(m_abs, 5),
            "correlation_coefficient": round(float(corr), 4),
            "correlation_direction": direction,
            "interpretation": interpretation
        })
        
    shap_summary_path = os.path.join("outputs", "metrics", "shap_summary.json")
    with open(shap_summary_path, "w") as f:
        json.dump({
            "top_features": top_features_shap,
            "total_features_evaluated": len(feature_names),
            "methodology": "TreeSHAP (Lundberg et al., 2020) computed on chronological validation sample with verified Spearman rank directionality"
        }, f, indent=2)
    print(f"Verified SHAP summary saved to {shap_summary_path}")

    # -------------------------------------------------------------
    # 2. CONFUSION MATRICES AT 0.50 AND 0.45 FOR MODEL PERFORMANCE
    # -------------------------------------------------------------
    test_probs = classifier.predict_proba(X_test_proc)[:, 1]
    from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score, accuracy_score
    
    cm_50 = confusion_matrix(y_test, (test_probs >= 0.50).astype(int)).tolist()
    cm_45 = confusion_matrix(y_test, (test_probs >= 0.45).astype(int)).tolist()
    
    model_comparison_path = os.path.join("outputs", "metrics", "model_comparison.json")
    with open(model_comparison_path, "r") as f:
        comp_data = json.load(f)
        
    comp_data["models"]["LightGBM"]["test"]["confusion_matrix_threshold_0_50"] = cm_50
    comp_data["models"]["LightGBM"]["test"]["confusion_matrix_threshold_0_45"] = cm_45
    comp_data["models"]["LightGBM"]["test"]["metrics_at_threshold_0_45"] = {
        "accuracy": round(float(accuracy_score(y_test, (test_probs >= 0.45).astype(int))), 4),
        "precision": round(float(precision_score(y_test, (test_probs >= 0.45).astype(int))), 4),
        "recall": round(float(recall_score(y_test, (test_probs >= 0.45).astype(int))), 4),
        "f1_score": round(float(f1_score(y_test, (test_probs >= 0.45).astype(int))), 4),
        "confusion_matrix": cm_45
    }
    
    with open(model_comparison_path, "w") as f:
        json.dump(comp_data, f, indent=2)
    print(f"Updated {model_comparison_path} with dual-threshold confusion matrix data.")

if __name__ == "__main__":
    update_verified_artifacts()
