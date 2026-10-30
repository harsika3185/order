# Data Leakage Prevention & Feature Audit Report
**Problem Statement ID:** DT-LSC-04  
**Project:** Order-Time Late Delivery Risk Prediction and Operations Review Framework  
**Dataset:** DataCo Global Supply Chain Intelligence Dataset (180,519 records, 53 columns)

---

## 1. Executive Summary & Policy

In predictive logistics intelligence, models that incorporate data produced during or after warehouse fulfillment, carrier handover, or transit suffer from **Data Leakage (Lookahead Bias)**. Such models appear artificially perfect in lab testing (often 99%+ accuracy) but collapse entirely in production because those variables do not exist at checkout time.

To ensure compliance with the DATA THIRAN 2026 hackathon standards, this framework enforces a **strict Order-Placement Time Boundary**:
> **Guiding Principle:** Only information known to the e-commerce system at the exact millisecond the customer places the order may be utilized as predictive input.

---

## 2. Leakage Categorization & Exclusions (5 Features)

| Column Name | Audit Verdict | Justification / Leakage Mechanism |
|---|---|---|
| `Days for shipping (real)` | **EXCLUDED (CRITICAL LEAKAGE)** | Direct post-delivery metric. Represents actual days taken to ship and deliver, which is known only after delivery completes. |
| `Delivery Status` | **EXCLUDED (CRITICAL LEAKAGE)** | Direct outcome target variable ('Late delivery', 'Advance shipping', 'Shipping on time', 'Shipping canceled'). Perfectly correlates with Late_delivery_risk. |
| `shipping date (DateOrders)` | **EXCLUDED (CRITICAL LEAKAGE)** | Timestamp of physical dispatch/shipment from warehouse. Occurs days after order placement. |
| `Order Status` | **EXCLUDED (CRITICAL LEAKAGE)** | Status of the order post-placement (e.g. COMPLETE, CLOSED, CANCELED, PROCESSING). Status updates occur during and after fulfillment lifecycle. |
| `Product Status` | **EXCLUDED (CRITICAL LEAKAGE)** | Static indicator (100% 0 in dataset) with potential fulfillment-state connotations. |

---

## 3. Financial Post-Reconciliation Exclusions (3 Features)

| Column Name | Audit Verdict | Justification / Leakage Mechanism |
|---|---|---|
| `Benefit per order` | **EXCLUDED (RECONCILIATION LEAKAGE)** | Financial profit calculated post-transaction/returns/chargebacks. |
| `Order Profit Per Order` | **EXCLUDED (RECONCILIATION LEAKAGE)** | Duplicate of benefit per order, known after delivery and reconciliation. |
| `Order Item Profit Ratio` | **EXCLUDED (RECONCILIATION LEAKAGE)** | Derived from actual profit which is post-fulfillment reconciled. |

---

## 4. Identifiers, PII & High-Cardinality Noise Excluded (17 Features)

| Column Name | Audit Verdict | Justification |
|---|---|---|
| `Customer Email` | **EXCLUDED (NOISE / PII)** | PII / Masked string, high cardinality, zero predictive generalization. |
| `Customer Password` | **EXCLUDED (NOISE / PII)** | PII / Masked password hash. |
| `Customer Fname` | **EXCLUDED (NOISE / PII)** | PII First Name. |
| `Customer Lname` | **EXCLUDED (NOISE / PII)** | PII Last Name. |
| `Customer Id` | **EXCLUDED (NOISE / PII)** | Arbitrary customer ID sequence. |
| `Order Customer Id` | **EXCLUDED (NOISE / PII)** | Redundant customer ID duplicate. |
| `Order Id` | **EXCLUDED (NOISE / PII)** | Unique order identifier. |
| `Order Item Id` | **EXCLUDED (NOISE / PII)** | Unique order item identifier. |
| `Order Item Cardprod Id` | **EXCLUDED (NOISE / PII)** | Internal RFID barcode artifact. |
| `Product Card Id` | **EXCLUDED (NOISE / PII)** | Internal database product key. |
| `Product Category Id` | **EXCLUDED (NOISE / PII)** | Redundant ID (Category Name is retained). |
| `Category Id` | **EXCLUDED (NOISE / PII)** | Redundant ID (Category Name is retained). |
| `Department Id` | **EXCLUDED (NOISE / PII)** | Redundant ID (Department Name is retained). |
| `Product Image` | **EXCLUDED (NOISE / PII)** | URL link to product image. |
| `Product Description` | **EXCLUDED (NOISE / PII)** | 100% missing values (all null). |
| `Order Zipcode` | **EXCLUDED (NOISE / PII)** | 86.2% missing values (155,679 missing out of 180,519). |
| `Customer Street` | **EXCLUDED (NOISE / PII)** | Freeform address text with extreme noise/cardinality. |

---

## 5. Approved Order-Time Feature Space (23 Features)

The following attributes are mathematically and operationally confirmed to be fully determined at checkout:

1. **Service Level Agreement (SLA):** `Days for shipment (scheduled)`
2. **Carrier Commitment:** `Shipping Mode` (Standard Class, First Class, Second Class, Same Day)
3. **Transaction Context:** `Type` (Payment method)
4. **Customer Profile:** `Customer Segment` (Consumer, Corporate, Home Office)
5. **Product Taxonomy:** `Department Name`, `Category Name`
6. **Order Economics:** `Order Item Quantity`, `Order Item Product Price`, `Order Item Discount Rate`, `Order Item Discount`, `Sales`, `Order Item Total`
7. **Geographic Origin:** `Customer Country`, `Customer State`, `Customer City`, `Latitude`, `Longitude`
8. **Geographic Destination:** `Market`, `Order Region`, `Order Country`, `Order State`, `Order City`
9. **Temporal Signatures (Engineered from order date):** `order_month`, `order_dayofweek`, `order_hour`, `is_weekend`, `order_quarter`

---

## 6. Audit Sign-Off
- **Total Excluded Features:** 25
- **Approved Feature Set:** 23 inputs + engineered temporal indicators
- **Target:** `Late_delivery_risk` (Binary: 0 = On-Time / Early, 1 = Late Delivery)
- **Status:** **PASS** (Zero lookahead features passed to ML pipeline)
