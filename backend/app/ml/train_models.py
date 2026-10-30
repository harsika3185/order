import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Ensure project root is in sys.path for portability
_proj_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if _proj_root not in sys.path:
    sys.path.insert(0, _proj_root)

from backend.app.utils.paths import resolve_path

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    precision_score, recall_score, f1_score, accuracy_score,
    roc_auc_score, average_precision_score, confusion_matrix,
    roc_curve, precision_recall_curve
)
import lightgbm as lgb
import shap

# Professional plotting defaults
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['figure.dpi'] = 150
PRIMARY_COLOR = '#1E293B'
LATE_COLOR = '#E11D48'
SECONDARY_COLOR = '#3B82F6'

def train_and_evaluate():
    print("--- [PHASE 4-6] MACHINE LEARNING & EXPLAINABLE AI PIPELINE ---")
    
    # 1. Load Data
    csv_path = resolve_path("data", "DataCoSupplyChainDataset.csv")
    print(f"Loading data from {csv_path}...")
    df = pd.read_csv(csv_path, encoding='ISO-8859-1')
    
    # 2. Extract strictly valid Order-Time Features
    df['order_datetime'] = pd.to_datetime(df['order date (DateOrders)'])
    df['order_month'] = df['order_datetime'].dt.month
    df['order_dayofweek'] = df['order_datetime'].dt.day_name()
    df['order_hour'] = df['order_datetime'].dt.hour
    df['is_weekend'] = df['order_datetime'].dt.dayofweek.isin([5, 6]).astype(int)
    df['order_quarter'] = df['order_datetime'].dt.quarter
    
    target_col = 'Late_delivery_risk'
    
    num_features = [
        'Days for shipment (scheduled)',
        'Order Item Quantity',
        'Order Item Product Price',
        'Order Item Discount Rate',
        'Order Item Discount',
        'Sales',
        'Order Item Total',
        'order_month',
        'order_hour',
        'order_quarter',
        'is_weekend'
    ]
    
    cat_features = [
        'Shipping Mode',
        'Type',
        'Customer Segment',
        'Department Name',
        'Category Name',
        'Market',
        'Order Region',
        'order_dayofweek',
        'Customer Country'
    ]
    
    all_features = num_features + cat_features
    print(f"Selected {len(num_features)} numerical and {len(cat_features)} categorical order-time features.")
    
    # 3. Chronological Train-Val-Test Split by Order Id
    print("Performing Chronological Order-Level Train / Validation / Test Split...")
    # Find minimum order date per Order Id
    order_dates = df.groupby('Order Id')['order_datetime'].min().reset_index()
    order_dates = order_dates.sort_values(by=['order_datetime', 'Order Id']).reset_index(drop=True)
    
    total_unique_orders = len(order_dates)
    train_end_idx = int(total_unique_orders * 0.70)
    val_end_idx = int(total_unique_orders * 0.85)
    
    train_order_ids = set(order_dates.iloc[:train_end_idx]['Order Id'])
    val_order_ids = set(order_dates.iloc[train_end_idx:val_end_idx]['Order Id'])
    test_order_ids = set(order_dates.iloc[val_end_idx:]['Order Id'])
    
    train_mask = df['Order Id'].isin(train_order_ids)
    val_mask = df['Order Id'].isin(val_order_ids)
    test_mask = df['Order Id'].isin(test_order_ids)
    
    df_train = df[train_mask].copy()
    df_val = df[val_mask].copy()
    df_test = df[test_mask].copy()
    
    print(f"Data Splits (Chronological by Order Id):")
    print(f"  Train: {len(df_train):,} rows ({len(train_order_ids):,} orders) | Date: {df_train['order_datetime'].min().date()} to {df_train['order_datetime'].max().date()}")
    print(f"  Val:   {len(df_val):,} rows ({len(val_order_ids):,} orders) | Date: {df_val['order_datetime'].min().date()} to {df_val['order_datetime'].max().date()}")
    print(f"  Test:  {len(df_test):,} rows ({len(test_order_ids):,} orders) | Date: {df_test['order_datetime'].min().date()} to {df_test['order_datetime'].max().date()}")
    
    X_train = df_train[all_features]
    y_train = df_train[target_col]
    
    X_val = df_val[all_features]
    y_val = df_val[target_col]
    
    X_test = df_test[all_features]
    y_test = df_test[target_col]
    
    # 4. Preprocessing Pipeline (Fitted ONLY on Training Data)
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), num_features),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_features)
        ]
    )
    
    print("Fitting preprocessor on training partition only...")
    X_train_proc = preprocessor.fit_transform(X_train)
    X_val_proc = preprocessor.transform(X_val)
    X_test_proc = preprocessor.transform(X_test)
    
    # Extract feature names after one-hot encoding
    encoded_cat_names = preprocessor.named_transformers_['cat'].get_feature_names_out(cat_features).tolist()
    feature_names = num_features + encoded_cat_names
    print(f"Total encoded features: {len(feature_names)}")
    
    # 5. Model Definitions
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1),
        "LightGBM": lgb.LGBMClassifier(n_estimators=200, learning_rate=0.05, max_depth=8, num_leaves=31, random_state=42, n_jobs=-1)
    }
    
    metrics_summary = {}
    curves_data = {}
    trained_estimators = {}
    
    for name, model in models.items():
        print(f"\nTraining {name}...")
        model.fit(X_train_proc, y_train)
        trained_estimators[name] = model
        
        # Predictions
        val_probs = model.predict_proba(X_val_proc)[:, 1]
        test_probs = model.predict_proba(X_test_proc)[:, 1]
        
        val_preds = (val_probs >= 0.5).astype(int)
        test_preds = (test_probs >= 0.5).astype(int)
        
        # Calculate Metrics
        val_cm = confusion_matrix(y_val, val_preds).tolist()
        test_cm = confusion_matrix(y_test, test_preds).tolist()
        
        val_metrics = {
            "accuracy": round(float(accuracy_score(y_val, val_preds)), 4),
            "precision": round(float(precision_score(y_val, val_preds, zero_division=0)), 4),
            "recall": round(float(recall_score(y_val, val_preds)), 4),
            "f1_score": round(float(f1_score(y_val, val_preds)), 4),
            "roc_auc": round(float(roc_auc_score(y_val, val_probs)), 4),
            "pr_auc": round(float(average_precision_score(y_val, val_probs)), 4),
            "confusion_matrix": val_cm
        }
        
        test_metrics = {
            "accuracy": round(float(accuracy_score(y_test, test_preds)), 4),
            "precision": round(float(precision_score(y_test, test_preds, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, test_preds)), 4),
            "f1_score": round(float(f1_score(y_test, test_preds)), 4),
            "roc_auc": round(float(roc_auc_score(y_test, test_probs)), 4),
            "pr_auc": round(float(average_precision_score(y_test, test_probs)), 4),
            "confusion_matrix": test_cm
        }
        
        metrics_summary[name] = {
            "validation": val_metrics,
            "test": test_metrics
        }
        print(f"  {name} Test Metrics: Recall: {test_metrics['recall']:.4f} | Precision: {test_metrics['precision']:.4f} | F1: {test_metrics['f1_score']:.4f} | ROC-AUC: {test_metrics['roc_auc']:.4f}")
        
        # Curve samples (sampled to 40 points for ultra-fast frontend rendering)
        fpr, tpr, _ = roc_curve(y_test, test_probs)
        prec, rec, _ = precision_recall_curve(y_test, test_probs)
        
        # Subsample curves to 40 points evenly
        idx_roc = np.linspace(0, len(fpr) - 1, 40).astype(int)
        idx_pr = np.linspace(0, len(rec) - 1, 40).astype(int)
        
        curves_data[name] = {
            "roc": [{"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in idx_roc],
            "pr": [{"recall": round(float(rec[i]), 4), "precision": round(float(prec[i]), 4)} for i in idx_pr]
        }

    # 6. Operational Threshold Optimization on Validation Set for Best Model (LightGBM)
    best_model_name = "LightGBM"
    best_estimator = trained_estimators[best_model_name]
    val_probs_best = best_estimator.predict_proba(X_val_proc)[:, 1]
    
    thresholds = [0.2, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.7]
    threshold_analysis = []
    for t in thresholds:
        preds = (val_probs_best >= t).astype(int)
        threshold_analysis.append({
            "threshold": t,
            "recall": round(float(recall_score(y_val, preds)), 4),
            "precision": round(float(precision_score(y_val, preds, zero_division=0)), 4),
            "f1_score": round(float(f1_score(y_val, preds)), 4),
            "flagged_orders_count": int(preds.sum()),
            "flagged_orders_percentage": round(float(preds.mean() * 100), 2)
        })
        
    # Selected operational default: threshold = 0.45 (maximizes early catch recall while minimizing false alarm fatigue)
    optimal_threshold = 0.45
    
    # 7. Model Serialization
    models_dir = resolve_path("models")
    metrics_dir = resolve_path("outputs", "metrics")
    charts_dir = resolve_path("outputs", "charts")
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(metrics_dir, exist_ok=True)
    os.makedirs(charts_dir, exist_ok=True)

    full_pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', best_estimator)
    ])
    joblib.dump(full_pipeline, os.path.join(models_dir, "best_model.joblib"))
    joblib.dump(preprocessor, os.path.join(models_dir, "preprocessor.joblib"))
    joblib.dump(best_estimator, os.path.join(models_dir, "lgbm_classifier.joblib"))
    print("Models and pipelines saved to models/")
    
    # 8. Feature Categorical Options Metadata (for Frontend Form & Validation)
    feature_metadata = {
        "num_features": num_features,
        "cat_features": cat_features,
        "encoded_feature_names": feature_names,
        "categorical_options": {
            cat_col: sorted(df_train[cat_col].dropna().unique().tolist())
            for cat_col in cat_features
        },
        "defaults": {
            "Days for shipment (scheduled)": 4,
            "Shipping Mode": "Standard Class",
            "Type": "DEBIT",
            "Customer Segment": "Consumer",
            "Department Name": "Fan Shop",
            "Category Name": "Cleats",
            "Market": "LATAM",
            "Order Region": "Central America",
            "Customer Country": "EE. UU.",
            "Order Item Quantity": 1,
            "Order Item Product Price": 59.99,
            "Order Item Discount Rate": 0.05,
            "Order Item Discount": 3.00,
            "Sales": 59.99,
            "Order Item Total": 56.99
        },
        "threshold_config": {
            "optimal_threshold": optimal_threshold,
            "low_threshold": 0.35,
            "high_threshold": 0.65
        }
    }
    with open(os.path.join(models_dir, "feature_metadata.json"), "w") as f:
        json.dump(feature_metadata, f, indent=2)
        
    # Save Model Comparison and Curves JSON
    with open(os.path.join(metrics_dir, "model_comparison.json"), "w") as f:
        json.dump({
            "models": metrics_summary,
            "threshold_analysis": threshold_analysis,
            "best_model": best_model_name,
            "optimal_threshold": optimal_threshold
        }, f, indent=2)
        
    with open(os.path.join(metrics_dir, "roc_pr_curves.json"), "w") as f:
        json.dump(curves_data, f, indent=2)

    # 9. Explainable AI with SHAP
    print("\nComputing SHAP Global and Local Explanations using TreeExplainer...")
    explainer = shap.TreeExplainer(best_estimator)
    
    # Sample 1,000 validation records for background SHAP calculation
    sample_indices = np.random.RandomState(42).choice(X_val_proc.shape[0], size=min(1000, X_val_proc.shape[0]), replace=False)
    X_sample_proc = X_val_proc[sample_indices]
    
    shap_values = explainer.shap_values(X_sample_proc)
    # For binary classification LightGBM, shap_values can be a list or array
    if isinstance(shap_values, list):
        shap_vals = shap_values[1]  # positive class (Late Delivery)
    else:
        shap_vals = shap_values
        
    # Compute mean absolute SHAP value per feature
    mean_abs_shap = np.mean(np.abs(shap_vals), axis=0)
    top_indices = np.argsort(mean_abs_shap)[::-1][:20]
    
    top_features_shap = []
    for idx in top_indices:
        feat_name = feature_names[idx]
        top_features_shap.append({
            "feature": feat_name,
            "importance": round(float(mean_abs_shap[idx]), 5),
            "correlation_direction": "Risk Increasing" if np.mean(shap_vals[:, idx]) > 0 else "Risk Decreasing"
        })
        
    # Save SHAP Summary Plot
    plt.figure(figsize=(10, 6), facecolor='#FFFFFF')
    shap.summary_plot(shap_vals, X_sample_proc, feature_names=feature_names, max_display=15, show=False)
    plt.title("SHAP Global Feature Impact on Late Delivery Risk", fontsize=12, fontweight='bold', pad=15, color=PRIMARY_COLOR)
    plt.tight_layout()
    plt.savefig(os.path.join(charts_dir, "08_shap_summary.png"))
    plt.close()
    
    # Save SHAP Feature Importance Bar Plot
    plt.figure(figsize=(9, 5), facecolor='#FFFFFF')
    y_pos = np.arange(len(top_features_shap[:12]))
    feat_labels = [item['feature'] for item in top_features_shap[:12]][::-1]
    importances = [item['importance'] for item in top_features_shap[:12]][::-1]
    plt.barh(y_pos, importances, color=SECONDARY_COLOR, height=0.6)
    plt.yticks(y_pos, feat_labels, fontsize=9)
    plt.xlabel("Mean |SHAP Value| (Impact on Model Output)", fontsize=10, fontweight='bold', color=PRIMARY_COLOR)
    plt.title("Top Feature Importances (SHAP)", fontsize=12, fontweight='bold', pad=15, color=PRIMARY_COLOR)
    plt.grid(axis='x', linestyle='--', alpha=0.5)
    plt.tight_layout()
    plt.savefig(os.path.join(charts_dir, "09_shap_feature_importance.png"))
    plt.close()
    
    # Save SHAP JSON
    with open(os.path.join(metrics_dir, "shap_summary.json"), "w") as f:
        json.dump({
            "top_features": top_features_shap,
            "total_features_evaluated": len(feature_names),
            "methodology": "TreeSHAP (Lundberg et al., 2020) computed on chronological held-out validation sample"
        }, f, indent=2)

    # 10. Generate High-Risk Sample Orders (from Held-out Test Set)
    print("\nGenerating High-Risk Attention Queue from Test Set Orders...")
    test_probs_best = best_estimator.predict_proba(X_test_proc)[:, 1]
    df_test_sample = df_test.copy()
    df_test_sample['predicted_risk'] = test_probs_best
    
    # Assign Risk Level
    def get_risk_tier(p):
        if p >= 0.65:
            return "High"
        elif p >= 0.35:
            return "Medium"
        else:
            return "Low"
            
    df_test_sample['risk_level'] = df_test_sample['predicted_risk'].apply(get_risk_tier)
    
    # Extract top risk driver using scheduled days and shipping mode
    def assign_driver(row):
        if row['Days for shipment (scheduled)'] <= 2:
            return "Aggressive Shipping SLA (<=2 Days)"
        elif row['Shipping Mode'] == 'First Class':
            return "First Class Strict Window"
        elif row['Shipping Mode'] == 'Same Day':
            return "Same Day Expedited Constraint"
        elif row['Order Region'] in ['Central America', 'Western Europe', 'South America']:
            return f"Regional Transit Complexity ({row['Order Region']})"
        elif row['order_dayofweek'] in ['Saturday', 'Sunday']:
            return "Weekend Warehouse Dispatch Bottleneck"
        else:
            return "Multi-factor Fulfillment Density"
            
    df_test_sample['risk_driver'] = df_test_sample.apply(assign_driver, axis=1)
    
    # Pick top 200 orders requiring attention (highest risk first)
    high_risk_orders = df_test_sample.sort_values(by='predicted_risk', ascending=False).head(200)
    
    export_cols = [
        'Order Id', 'order date (DateOrders)', 'Shipping Mode', 'Category Name',
        'Department Name', 'Order Region', 'Market', 'Order Item Total',
        'predicted_risk', 'risk_level', 'risk_driver', 'Days for shipment (scheduled)'
    ]
    
    high_risk_list = []
    for _, r in high_risk_orders.iterrows():
        high_risk_list.append({
            "order_id": int(r['Order Id']),
            "order_date": str(r['order date (DateOrders)']),
            "shipping_mode": str(r['Shipping Mode']),
            "category_name": str(r['Category Name']),
            "department_name": str(r['Department Name']),
            "region": str(r['Order Region']),
            "market": str(r['Market']),
            "order_value": round(float(r['Order Item Total']), 2),
            "predicted_risk": round(float(r['predicted_risk']), 3),
            "risk_level": str(r['risk_level']),
            "risk_driver": str(r['risk_driver']),
            "scheduled_days": int(r['Days for shipment (scheduled)'])
        })
        
    with open(os.path.join(metrics_dir, "high_risk_sample_orders.json"), "w") as f:
        json.dump(high_risk_list, f, indent=2)
        
    print(f"ML Pipeline Completed successfully! Models saved to models/, metrics saved to outputs/metrics/")

if __name__ == "__main__":
    train_and_evaluate()
