import React, { useState, useEffect } from 'react';
import { PredictionRequest, PredictionResponse } from '../types';
import { api } from '../services/api';
import { 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  Zap, 
  Sparkles, 
  RotateCcw,
  Check,
  Compass
} from 'lucide-react';

export const RiskPredictionPage: React.FC = () => {
  const [formOptions, setFormOptions] = useState<any>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Form State
  const [formData, setFormData] = useState<PredictionRequest>({
    days_for_shipment_scheduled: 4,
    shipping_mode: 'Standard Class',
    type: 'DEBIT',
    customer_segment: 'Consumer',
    department_name: 'Fan Shop',
    category_name: 'Cleats',
    market: 'LATAM',
    order_region: 'Central America',
    customer_country: 'EE. UU.',
    order_item_quantity: 1,
    order_item_product_price: 59.99,
    order_item_discount_rate: 0.05,
    order_item_discount: 3.00,
    sales: 59.99,
    order_item_total: 56.99,
    order_month: 5,
    order_hour: 14,
    order_dayofweek: 'Wednesday',
    is_weekend: 0,
    order_quarter: 2
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getFormOptions()
      .then(res => {
        setFormOptions(res);
        setLoadingOptions(false);
      })
      .catch(err => {
        console.error('Failed to load form options:', err);
        setLoadingOptions(false);
      });
  }, []);

  const handleChange = (field: keyof PredictionRequest, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-recalculate economics if quantity/price/discount changes
      if (field === 'order_item_quantity' || field === 'order_item_product_price' || field === 'order_item_discount_rate') {
        const qty = field === 'order_item_quantity' ? Number(value) : prev.order_item_quantity;
        const price = field === 'order_item_product_price' ? Number(value) : prev.order_item_product_price;
        const rate = field === 'order_item_discount_rate' ? Number(value) : prev.order_item_discount_rate;
        
        const grossSales = Math.round(qty * price * 100) / 100;
        const discountAmt = Math.round(grossSales * rate * 100) / 100;
        const netTotal = Math.round((grossSales - discountAmt) * 100) / 100;
        
        updated.sales = grossSales;
        updated.order_item_discount = discountAmt;
        updated.order_item_total = netTotal;
      }

      if (field === 'order_dayofweek') {
        updated.is_weekend = (value === 'Saturday' || value === 'Sunday') ? 1 : 0;
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const pred = await api.predictOrderRisk(formData);
      setResult(pred);
    } catch (err: any) {
      setError(err.message || 'Prediction failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Scenario Presets
  const applyPreset = (presetType: 'high' | 'low' | 'moderate') => {
    if (presetType === 'high') {
      setFormData(prev => ({
        ...prev,
        days_for_shipment_scheduled: 1,
        shipping_mode: 'First Class',
        type: 'TRANSFER',
        customer_segment: 'Consumer',
        department_name: 'Apparel',
        category_name: "Women's Apparel",
        market: 'Europe',
        order_region: 'Western Europe',
        order_dayofweek: 'Monday',
        is_weekend: 0,
        order_hour: 9,
        order_item_quantity: 2,
        order_item_product_price: 120.00,
        order_item_discount_rate: 0.10,
        order_item_discount: 24.00,
        sales: 240.00,
        order_item_total: 216.00
      }));
    } else if (presetType === 'low') {
      setFormData(prev => ({
        ...prev,
        days_for_shipment_scheduled: 4,
        shipping_mode: 'Standard Class',
        type: 'DEBIT',
        customer_segment: 'Consumer',
        department_name: 'Fan Shop',
        category_name: 'Cleats',
        market: 'LATAM',
        order_region: 'Central America',
        order_dayofweek: 'Wednesday',
        is_weekend: 0,
        order_hour: 14,
        order_item_quantity: 1,
        order_item_product_price: 59.99,
        order_item_discount_rate: 0.05,
        order_item_discount: 3.00,
        sales: 59.99,
        order_item_total: 56.99
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        days_for_shipment_scheduled: 2,
        shipping_mode: 'Second Class',
        type: 'PAYMENT',
        customer_segment: 'Corporate',
        department_name: 'Golf',
        category_name: 'Indoor/Outdoor Games',
        market: 'Pacific Asia',
        order_region: 'Oceania',
        order_dayofweek: 'Saturday',
        is_weekend: 1,
        order_hour: 18,
        order_item_quantity: 3,
        order_item_product_price: 79.99,
        order_item_discount_rate: 0.15,
        order_item_discount: 35.99,
        sales: 239.97,
        order_item_total: 203.98
      }));
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Order Risk Assessment
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Predict late delivery risk at the exact moment of order placement using zero lookahead features.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Quick Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('high')}
            className="text-xs px-2.5 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-medium transition-colors"
          >
            High Risk (First Class 1-Day)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('low')}
            className="text-xs px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-medium transition-colors"
          >
            Low Risk (Standard 4-Day)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('moderate')}
            className="text-xs px-2.5 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 font-medium transition-colors"
          >
            Weekend Surge
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Input Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-md border border-slate-200 shadow-2xs">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Shipping Mode & Service Level Agreement */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 mb-4 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>1. Carrier Tier &amp; SLA Commitment</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Shipping Mode
                  </label>
                  <select
                    value={formData.shipping_mode}
                    onChange={(e) => handleChange('shipping_mode', e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Standard Class">Standard Class (Normal 4-6 Days)</option>
                    <option value="Second Class">Second Class (Medium 2-3 Days)</option>
                    <option value="First Class">First Class (Expedited 1-2 Days)</option>
                    <option value="Same Day">Same Day (Ultra Urgent 0-1 Day)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Scheduled Shipping Days (SLA Commitment)
                  </label>
                  <select
                    value={formData.days_for_shipment_scheduled}
                    onChange={(e) => handleChange('days_for_shipment_scheduled', Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={0}>0 Days (Same Day Immediate Dispatch)</option>
                    <option value={1}>1 Day (First Class Critical Window)</option>
                    <option value={2}>2 Days (Second Class Aggressive Window)</option>
                    <option value={4}>4 Days (Standard Class Fulfillment Window)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Destination & Market */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 mb-4 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>2. Geographic Route &amp; Customer</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Destination Market
                  </label>
                  <select
                    value={formData.market}
                    onChange={(e) => handleChange('market', e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="LATAM">LATAM</option>
                    <option value="Europe">Europe</option>
                    <option value="Pacific Asia">Pacific Asia</option>
                    <option value="USCA">USCA</option>
                    <option value="Africa">Africa</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Destination Region
                  </label>
                  <select
                    value={formData.order_region}
                    onChange={(e) => handleChange('order_region', e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Central America">Central America</option>
                    <option value="Western Europe">Western Europe</option>
                    <option value="South America">South America</option>
                    <option value="Oceania">Oceania</option>
                    <option value="Northern Europe">Northern Europe</option>
                    <option value="Southeast Asia">Southeast Asia</option>
                    <option value="Eastern Asia">Eastern Asia</option>
                    <option value="West of USA">West of USA</option>
                    <option value="US Center">US Center</option>
                    <option value="East of USA">East of USA</option>
                    <option value="South Asia">South Asia</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Customer Segment
                  </label>
                  <select
                    value={formData.customer_segment}
                    onChange={(e) => handleChange('customer_segment', e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Consumer">Consumer</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Home Office">Home Office</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="DEBIT">DEBIT</option>
                    <option value="TRANSFER">TRANSFER</option>
                    <option value="PAYMENT">PAYMENT</option>
                    <option value="CASH">CASH</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Product & Commercial Profile */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 mb-4 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>3. Product &amp; Commercial Attributes</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Department
                  </label>
                  <select
                    value={formData.department_name}
                    onChange={(e) => handleChange('department_name', e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Fan Shop">Fan Shop</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Golf">Golf</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Outdoors">Outdoors</option>
                    <option value="Fitness">Fitness</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.order_item_quantity}
                    onChange={(e) => handleChange('order_item_quantity', e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Unit Product Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={formData.order_item_product_price}
                    onChange={(e) => handleChange('order_item_product_price', e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Discount Rate
                  </label>
                  <select
                    value={formData.order_item_discount_rate}
                    onChange={(e) => handleChange('order_item_discount_rate', Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={0.0}>0% (No Discount)</option>
                    <option value={0.05}>5%</option>
                    <option value={0.10}>10%</option>
                    <option value={0.15}>15%</option>
                    <option value={0.20}>20%</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Gross Sales ($)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`$${formData.sales.toFixed(2)}`}
                    className="w-full text-xs bg-slate-100 border border-slate-200 rounded px-3 py-2 text-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Net Order Total ($)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`$${formData.order_item_total.toFixed(2)}`}
                    className="w-full text-xs bg-slate-100 border border-slate-200 rounded px-3 py-2 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Temporal Placement Timing */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 pb-2 border-b border-slate-100 mb-4 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <span>4. Order Placement Timing</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Day of Week
                  </label>
                  <select
                    value={formData.order_dayofweek}
                    onChange={(e) => handleChange('order_dayofweek', e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Monday">Monday (Peak Volume)</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday (Weekend Queue)</option>
                    <option value="Sunday">Sunday (Weekend Queue)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Order Hour (24-Hour)
                  </label>
                  <select
                    value={formData.order_hour}
                    onChange={(e) => handleChange('order_hour', Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={9}>09:00 AM (Morning Cutoff)</option>
                    <option value={14}>02:00 PM (Midday Window)</option>
                    <option value={18}>06:00 PM (Evening Batch)</option>
                    <option value={22}>10:00 PM (Night Batch)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Order Month
                  </label>
                  <select
                    value={formData.order_month}
                    onChange={(e) => handleChange('order_month', Number(e.target.value))}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-3 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={1}>January</option>
                    <option value={5}>May</option>
                    <option value={7}>July</option>
                    <option value={11}>November (Holiday Rush)</option>
                    <option value={12}>December (Peak Surge)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Evaluating Risk via LightGBM Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    <span>Assess Delivery Risk</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Real-Time Assessment Results (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-xs">
              {error}
            </div>
          )}

          {result ? (
            <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
              {/* Header Badge */}
              <div className={`p-4 text-white flex items-center justify-between ${
                result.risk_level === 'High' ? 'bg-rose-600' :
                result.risk_level === 'Medium' ? 'bg-amber-600' :
                'bg-emerald-600'
              }`}>
                <div className="flex items-center space-x-2">
                  {result.risk_level === 'High' ? <ShieldAlert size={20} /> :
                   result.risk_level === 'Medium' ? <AlertTriangle size={20} /> :
                   <CheckCircle size={20} />}
                  <span className="font-bold text-sm tracking-wide uppercase">
                    {result.risk_level} Risk Consignment
                  </span>
                </div>
                <span className="text-xs font-mono bg-black/20 px-2 py-0.5 rounded">
                  P = {(result.predicted_probability * 100).toFixed(1)}%
                </span>
              </div>

              <div className="p-5 space-y-5">
                {/* Probability Meter */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-slate-700">Late Delivery Probability</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums">
                      {(result.predicted_probability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        result.risk_level === 'High' ? 'bg-rose-600' :
                        result.risk_level === 'Medium' ? 'bg-amber-500' :
                        'bg-emerald-500'
                      }`}
                      style={{ width: `${result.predicted_probability * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>0% (Low)</span>
                    <span>Threshold: 45.0%</span>
                    <span>100% (High)</span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <div className="font-semibold text-slate-900 mb-1">Behavioral Explanation:</div>
                  {result.risk_explanation}
                </div>

                {/* SHAP Feature Contribution Waterfall */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center space-x-1">
                      <Sparkles size={13} className="text-blue-600" />
                      <span>Local SHAP Attribution</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Top Impact Factors</span>
                  </div>

                  <div className="space-y-2">
                    {result.top_drivers.map((drv, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                        <div className="flex items-center justify-between font-medium mb-1">
                          <span className="text-slate-800 font-mono text-[11px] truncate max-w-[200px]">
                            {drv.feature}
                          </span>
                          <span className={`text-[11px] font-bold ${
                            drv.impact > 0 ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {drv.impact > 0 ? `+${drv.impact.toFixed(3)}` : drv.impact.toFixed(3)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          {drv.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prescriptive Recommended Action */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-blue-900 font-bold uppercase tracking-wider text-[11px]">
                    <Compass size={14} className="text-blue-700" />
                    <span>Prescriptive Operational Intervention:</span>
                  </div>
                  <p className="text-blue-950 font-medium leading-relaxed">
                    {result.recommended_action}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-md border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                <ShieldAlert size={24} />
              </div>
              <h2 className="text-sm font-semibold text-slate-900">
                Awaiting Order Attributes
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Adjust order specifications on the left or select a preset to evaluate delivery risk using the trained LightGBM model with live SHAP attribution.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
