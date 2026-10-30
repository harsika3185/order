import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import unittest
from fastapi.testclient import TestClient
from backend.app.main import app

class TestBackendEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_check(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "online")

    def test_overview_endpoint(self):
        res = self.client.get("/api/overview")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("kpis", data)
        self.assertIn("total_orders", data["kpis"])
        self.assertIn("late_delivery_rate", data["kpis"])

    def test_analytics_endpoint(self):
        res = self.client.get("/api/analytics/delivery")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("shipping_modes", data)
        self.assertIn("regions", data)

    def test_high_risk_orders_endpoint(self):
        res = self.client.get("/api/orders/high-risk?page=1&page_size=5")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("items", data)
        self.assertTrue(len(data["items"]) <= 5)

    def test_single_prediction_endpoint(self):
        payload = {
            "days_for_shipment_scheduled": 2,
            "shipping_mode": "First Class",
            "type": "DEBIT",
            "customer_segment": "Consumer",
            "department_name": "Fan Shop",
            "category_name": "Cleats",
            "market": "LATAM",
            "order_region": "Central America",
            "customer_country": "EE. UU.",
            "order_item_quantity": 1,
            "order_item_product_price": 59.99,
            "order_item_discount_rate": 0.05,
            "order_item_discount": 3.00,
            "sales": 59.99,
            "order_item_total": 56.99
        }
        res = self.client.post("/api/predict", json=payload)
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("predicted_probability", data)
        self.assertIn("risk_level", data)
        self.assertIn("top_drivers", data)
        self.assertIn("recommended_action", data)
        print(f"Test Prediction Output: Prob: {data['predicted_probability']} | Risk: {data['risk_level']}")

    def test_explainability_endpoint(self):
        res = self.client.get("/api/explainability")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("top_features", data)

    def test_model_performance_endpoint(self):
        res = self.client.get("/api/model/performance")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("model_comparison", data)
        self.assertIn("threshold_analysis", data)

    def test_dataset_info_endpoint(self):
        res = self.client.get("/api/dataset-info")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("dimensions", data)
        self.assertIn("leakage_prevention", data)

if __name__ == "__main__":
    unittest.main()
