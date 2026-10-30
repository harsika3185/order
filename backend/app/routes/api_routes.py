from fastapi import APIRouter, Query, HTTPException, Response
from typing import Optional, List, Dict, Any
from backend.app.schemas.order_schema import (
    OrderPredictionRequest, OrderPredictionResponse,
    BatchPredictionItem, BatchPredictionResponse
)
from backend.app.services.ml_service import ml_service
from backend.app.services.data_service import data_service

router = APIRouter(prefix="/api")

@router.get("/overview")
def get_overview():
    """Returns Executive Overview KPI metrics, charts, and recent high-risk order preview."""
    return data_service.get_overview()

@router.get("/analytics/delivery")
def get_analytics(
    market: Optional[str] = Query(None),
    shipping_mode: Optional[str] = Query(None),
    region: Optional[str] = Query(None)
):
    """Returns detailed delivery performance analytics by shipping mode, region, department, and time."""
    return data_service.get_analytics(market=market, shipping_mode=shipping_mode, region=region)

@router.get("/orders/high-risk")
def get_high_risk_orders(
    search: Optional[str] = Query(None),
    risk_level: Optional[str] = Query("All"),
    shipping_mode: Optional[str] = Query("All"),
    region: Optional[str] = Query("All"),
    sort_by: Optional[str] = Query("predicted_risk"),
    sort_order: Optional[str] = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=1, le=100)
):
    """Returns paginated, searchable, sortable high-risk orders requiring attention."""
    return data_service.get_high_risk_orders(
        search=search,
        risk_level=risk_level,
        shipping_mode=shipping_mode,
        region=region,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        page_size=page_size
    )

@router.get("/orders/export-csv")
def export_orders_csv(risk_level: Optional[str] = Query("All")):
    """Exports high-risk attention orders as a downloadable CSV."""
    csv_content = data_service.export_orders_csv(risk_level=risk_level)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=high_risk_orders_attention.csv"}
    )

@router.post("/predict", response_model=OrderPredictionResponse)
def predict_order_risk(request: OrderPredictionRequest):
    """Predicts late delivery probability and risk category at checkout, returning local SHAP drivers and recommended action."""
    try:
        return ml_service.predict_single(request.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/predict-batch", response_model=BatchPredictionResponse)
def predict_batch_orders(items: List[BatchPredictionItem]):
    """Batch processes multiple orders for delivery risk assessment."""
    try:
        req_list = [{"order_id": item.order_id, "data": item.data.model_dump()} for item in items]
        return ml_service.predict_batch(req_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction error: {str(e)}")

@router.get("/explainability")
def get_explainability():
    """Returns SHAP global feature importances, directions, and methodologies."""
    return {
        "shap_summary": data_service.shap_data,
        "feature_count": data_service.shap_data.get("total_features_evaluated", 89),
        "methodology": data_service.shap_data.get("methodology", ""),
        "top_features": data_service.shap_data.get("top_features", [])
    }

@router.get("/operations/recommendations")
def get_recommendations():
    """Returns evidence-backed operational recommendations with observed rates and concrete actions."""
    return {
        "recommendations": data_service.get_operations_intelligence()
    }

@router.get("/model/performance")
def get_model_performance():
    """Returns full comparative evaluation across Logistic Regression, Random Forest, and LightGBM."""
    return {
        "model_comparison": data_service.metrics_data.get("models", {}),
        "threshold_analysis": data_service.metrics_data.get("threshold_analysis", []),
        "best_model": data_service.metrics_data.get("best_model", "LightGBM"),
        "optimal_threshold": data_service.metrics_data.get("optimal_threshold", 0.45),
        "curves": data_service.curves_data
    }

@router.get("/dataset-info")
def get_dataset_info():
    """Returns dataset documentation, dimensions, leakage audit findings, and chronological methodology."""
    return data_service.get_dataset_info()

@router.get("/form-options")
def get_form_options():
    """Returns valid categorical options and defaults for live prediction forms."""
    return {
        "categorical_options": data_service.feature_metadata.get("categorical_options", {}),
        "defaults": data_service.feature_metadata.get("defaults", {}),
        "threshold_config": data_service.feature_metadata.get("threshold_config", {})
    }
