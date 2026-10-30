import os
import json
import joblib
import numpy as np
import pandas as pd
import shap
from typing import Dict, Any, List
from backend.app.utils.paths import resolve_path

class MLService:
    def __init__(self):
        self.pipeline_path = resolve_path("models", "best_model.joblib")
        self.preprocessor_path = resolve_path("models", "preprocessor.joblib")
        self.classifier_path = resolve_path("models", "lgbm_classifier.joblib")
        self.metadata_path = resolve_path("models", "feature_metadata.json")
        
        self.pipeline = None
        self.preprocessor = None
        self.classifier = None
        self.metadata = {}
        self.explainer = None
        self.feature_names = []
        
        self.load_models()

    def load_models(self):
        print("MLService: Loading trained model artifacts...")
        if os.path.exists(self.pipeline_path):
            self.pipeline = joblib.load(self.pipeline_path)
            self.preprocessor = joblib.load(self.preprocessor_path)
            self.classifier = joblib.load(self.classifier_path)
            
            with open(self.metadata_path, "r") as f:
                self.metadata = json.load(f)
                
            self.feature_names = self.metadata.get("encoded_feature_names", [])
            
            # Initialize TreeExplainer for live inference
            try:
                self.explainer = shap.TreeExplainer(self.classifier)
                print("MLService: TreeExplainer initialized successfully.")
            except Exception as e:
                print(f"MLService: Warning initializing TreeExplainer: {e}")
        else:
            print("MLService: Warning - Model files not found on initial load.")

    def _prepare_df(self, req: Dict[str, Any]) -> pd.DataFrame:
        data = {
            'Days for shipment (scheduled)': [req.get('days_for_shipment_scheduled', 4)],
            'Order Item Quantity': [req.get('order_item_quantity', 1)],
            'Order Item Product Price': [req.get('order_item_product_price', 59.99)],
            'Order Item Discount Rate': [req.get('order_item_discount_rate', 0.05)],
            'Order Item Discount': [req.get('order_item_discount', 3.00)],
            'Sales': [req.get('sales', 59.99)],
            'Order Item Total': [req.get('order_item_total', 56.99)],
            'order_month': [req.get('order_month', 5)],
            'order_hour': [req.get('order_hour', 14)],
            'order_quarter': [req.get('order_quarter', 2)],
            'is_weekend': [req.get('is_weekend', 0)],
            'Shipping Mode': [req.get('shipping_mode', 'Standard Class')],
            'Type': [req.get('type', 'DEBIT')],
            'Customer Segment': [req.get('customer_segment', 'Consumer')],
            'Department Name': [req.get('department_name', 'Fan Shop')],
            'Category Name': [req.get('category_name', 'Cleats')],
            'Market': [req.get('market', 'LATAM')],
            'Order Region': [req.get('order_region', 'Central America')],
            'order_dayofweek': [req.get('order_dayofweek', 'Wednesday')],
            'Customer Country': [req.get('customer_country', 'EE. UU.')]
        }
        return pd.DataFrame(data)

    def predict_single(self, req_dict: Dict[str, Any]) -> Dict[str, Any]:
        if not self.pipeline:
            self.load_models()
            
        df_input = self._prepare_df(req_dict)
        X_proc = self.preprocessor.transform(df_input)
        
        # Predict probability
        prob = float(self.classifier.predict_proba(X_proc)[0, 1])
        optimal_threshold = self.metadata.get("threshold_config", {}).get("optimal_threshold", 0.45)
        
        # Risk classification
        if prob >= 0.65:
            risk_level = "High"
            confidence_tier = "Critical Risk Alert"
        elif prob >= 0.35:
            risk_level = "Medium"
            confidence_tier = "Moderate Operational Risk"
        else:
            risk_level = "Low"
            confidence_tier = "Standard Fulfillment Confidence"
            
        predicted_late = bool(prob >= optimal_threshold)
        
        # Local SHAP Explanation
        top_drivers = []
        if self.explainer:
            try:
                shap_vals = self.explainer.shap_values(X_proc)
                if isinstance(shap_vals, list):
                    vals = shap_vals[1][0]
                else:
                    vals = shap_vals[0]
                    
                top_indices = np.argsort(np.abs(vals))[::-1][:5]
                for idx in top_indices:
                    impact = float(vals[idx])
                    feat = self.feature_names[idx] if idx < len(self.feature_names) else f"Feature {idx}"
                    direction = "Increases Risk" if impact > 0 else "Decreases Risk"
                    
                    # Human readable description
                    if "Shipping Mode" in feat:
                        desc = f"Selected carrier tier ({req_dict.get('shipping_mode')}) shifts SLA margin."
                    elif "Days for shipment" in feat:
                        desc = f"Scheduled window of {req_dict.get('days_for_shipment_scheduled')} days tightens fulfillment leeway."
                    elif "Order Region" in feat:
                        desc = f"Destination geography ({req_dict.get('order_region')}) transit time baseline."
                    elif "order_hour" in feat:
                        desc = f"Order placement time (Hour {req_dict.get('order_hour')}) relative to carrier cutoff."
                    elif "Type_" in feat:
                        desc = f"Payment settlement method ({req_dict.get('type')}) verification lag."
                    else:
                        desc = f"Order profile characteristic ({feat.replace('_', ' ')})."
                        
                    top_drivers.append({
                        "feature": feat,
                        "impact": round(impact, 4),
                        "direction": direction,
                        "description": desc
                    })
            except Exception as e:
                print(f"Error calculating local SHAP: {e}")

        # Evidence-based Operational Recommendation
        if risk_level == "High":
            if req_dict.get('shipping_mode') in ['First Class', 'Same Day']:
                recommended_action = "EXPEDITE_DISPATCH: Route directly to priority cross-docking lane. Order has contracted a tight SLA window (1-3 days). Alert regional hub before cutoff."
            elif req_dict.get('order_region') in ['Central America', 'Western Europe', 'South America']:
                recommended_action = "CARRIER_AUDIT: Assign dedicated linehaul carrier. Regional transit bottleneck detected for destination; bypass intermediate consolidation."
            else:
                recommended_action = "ACTIVE_MONITORING: Flag for Tier-1 fulfillment oversight. Escalate packing queue position to pre-empt carrier pickup window."
            explanation = f"High probability of late delivery ({prob*100:.1f}%). Primary risk stems from strict SLA constraints combined with destination route complexity."
        elif risk_level == "Medium":
            recommended_action = "STANDARD_EXPEDITE: Verify item picking within 4 hours. No immediate carrier change required unless warehouse queue exceeds normal threshold."
            explanation = f"Moderate risk ({prob*100:.1f}%). Order sits within achievable operational bounds but has limited buffer against unexpected customs or carrier delays."
        else:
            recommended_action = "ROUTINE_PROCESSING: Standard automated batch sorting and scheduled carrier handoff. No manual intervention required."
            explanation = f"Low risk profile ({prob*100:.1f}%). Ample scheduled fulfillment days ({req_dict.get('days_for_shipment_scheduled')} days) provide strong operational safety margin."
            
        return {
            "predicted_probability": round(prob, 3),
            "risk_level": risk_level,
            "threshold_used": optimal_threshold,
            "predicted_late": predicted_late,
            "confidence_tier": confidence_tier,
            "risk_explanation": explanation,
            "recommended_action": recommended_action,
            "top_drivers": top_drivers
        }

    def predict_batch(self, items: List[Dict[str, Any]]) -> Dict[str, Any]:
        results = []
        high_cnt, med_cnt, low_cnt = 0, 0, 0
        for it in items:
            order_id = it.get('order_id')
            data = it.get('data', it)
            pred = self.predict_single(data)
            if pred['risk_level'] == 'High':
                high_cnt += 1
            elif pred['risk_level'] == 'Medium':
                med_cnt += 1
            else:
                low_cnt += 1
            results.append({
                "order_id": order_id,
                **pred
            })
            
        return {
            "total_processed": len(items),
            "high_risk_count": high_cnt,
            "medium_risk_count": med_cnt,
            "low_risk_count": low_cnt,
            "results": results
        }

ml_service = MLService()
