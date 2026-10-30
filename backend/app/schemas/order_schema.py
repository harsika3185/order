from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class OrderPredictionRequest(BaseModel):
    days_for_shipment_scheduled: int = Field(default=4, ge=0, le=10, description="Scheduled shipping SLA days")
    shipping_mode: str = Field(default="Standard Class", description="Standard Class, First Class, Second Class, Same Day")
    type: str = Field(default="DEBIT", description="DEBIT, TRANSFER, PAYMENT, CASH")
    customer_segment: str = Field(default="Consumer", description="Consumer, Corporate, Home Office")
    department_name: str = Field(default="Fan Shop", description="Store Department")
    category_name: str = Field(default="Cleats", description="Product Category")
    market: str = Field(default="LATAM", description="LATAM, Europe, Pacific Asia, USCA, Africa")
    order_region: str = Field(default="Central America", description="Destination Region")
    customer_country: str = Field(default="EE. UU.", description="Origin Country")
    order_item_quantity: int = Field(default=1, ge=1, le=10)
    order_item_product_price: float = Field(default=59.99, ge=0.0)
    order_item_discount_rate: float = Field(default=0.05, ge=0.0, le=1.0)
    order_item_discount: float = Field(default=3.00, ge=0.0)
    sales: float = Field(default=59.99, ge=0.0)
    order_item_total: float = Field(default=56.99, ge=0.0)
    order_month: Optional[int] = Field(default=5, ge=1, le=12)
    order_hour: Optional[int] = Field(default=14, ge=0, le=23)
    order_dayofweek: Optional[str] = Field(default="Wednesday")
    is_weekend: Optional[int] = Field(default=0, ge=0, le=1)
    order_quarter: Optional[int] = Field(default=2, ge=1, le=4)

class ShapContribution(BaseModel):
    feature: str
    impact: float
    direction: str
    description: str

class OrderPredictionResponse(BaseModel):
    predicted_probability: float
    risk_level: str
    threshold_used: float
    predicted_late: bool
    confidence_tier: str
    risk_explanation: str
    recommended_action: str
    top_drivers: List[ShapContribution]

class BatchPredictionItem(BaseModel):
    order_id: Optional[int] = None
    data: OrderPredictionRequest

class BatchPredictionResponse(BaseModel):
    total_processed: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    results: List[Dict[str, Any]]
