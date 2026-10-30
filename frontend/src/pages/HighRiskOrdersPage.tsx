import React, { useEffect, useState } from 'react';
import { OrderItem, HighRiskOrdersResponse } from '../types';
import { api } from '../services/api';
import { 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  RotateCcw,
  AlertTriangle,
  ArrowUpDown,
  X,
  ShieldAlert,
  Compass
} from 'lucide-react';

export const HighRiskOrdersPage: React.FC = () => {
  const [data, setData] = useState<HighRiskOrdersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [riskLevel, setRiskLevel] = useState('All');
  const [shippingMode, setShippingMode] = useState('All');
  const [region, setRegion] = useState('All');
  const [sortBy, setSortBy] = useState('predicted_risk');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Selected Order for Modal / Drawer
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    api.getHighRiskOrders({
      search: search.trim() || undefined,
      risk_level: riskLevel,
      shipping_mode: shippingMode,
      region: region,
      sort_by: sortBy,
      sort_order: sortOrder,
      page: currentPage,
      page_size: pageSize
    })
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
  }, [search, riskLevel, shippingMode, region, sortBy, sortOrder, currentPage]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearch('');
    setRiskLevel('All');
    setShippingMode('All');
    setRegion('All');
    setSortBy('predicted_risk');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Orders Requiring Attention
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Operational triage queue of consignments flagged for late delivery risk at order placement.
          </p>
        </div>

        {/* CSV Export Button */}
        <a
          href={api.exportCsvUrl(riskLevel)}
          download="orders_requiring_attention.csv"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <Download size={13} />
          <span>Export Filtered CSV</span>
        </a>
      </div>

      {/* FILTER AND SEARCH CONTROLS */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID, Category, Region, Driver..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Risk Level Filter */}
          <div className="md:col-span-2">
            <select
              value={riskLevel}
              onChange={(e) => { setRiskLevel(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Risk Tiers</option>
              <option value="High">High Risk (&ge; 65%)</option>
              <option value="Medium">Medium Risk (35-65%)</option>
              <option value="Low">Low Risk (&lt; 35%)</option>
            </select>
          </div>

          {/* Shipping Mode Filter */}
          <div className="md:col-span-3">
            <select
              value={shippingMode}
              onChange={(e) => { setShippingMode(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Shipping Modes</option>
              <option value="First Class">First Class</option>
              <option value="Same Day">Same Day</option>
              <option value="Second Class">Second Class</option>
              <option value="Standard Class">Standard Class</option>
            </select>
          </div>

          {/* Region Filter */}
          <div className="md:col-span-2">
            <select
              value={region}
              onChange={(e) => { setRegion(e.target.value); setCurrentPage(1); }}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">All Regions</option>
              <option value="Central America">Central America</option>
              <option value="Western Europe">Western Europe</option>
              <option value="South America">South America</option>
              <option value="Oceania">Oceania</option>
              <option value="Northern Europe">Northern Europe</option>
              <option value="Southeast Asia">Southeast Asia</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="md:col-span-1 flex justify-end">
            <button
              onClick={resetFilters}
              title="Reset Filters"
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ORDERS DATA TABLE */}
      <div className="bg-white rounded-md border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span>Updating operational queue...</span>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 text-xs">{error}</div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <AlertTriangle size={24} className="mx-auto text-amber-500" />
            <p className="font-medium text-slate-800">No orders match the current filter criteria</p>
            <p className="text-slate-400">Try broadening your search or resetting active filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('order_id')}>
                    <div className="flex items-center space-x-1">
                      <span>Order ID</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th className="py-2.5 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('order_date')}>
                    <div className="flex items-center space-x-1">
                      <span>Placement Date</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th className="py-2.5 px-4">Shipping Mode</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Destination Region</th>
                  <th className="py-2.5 px-4 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('order_value')}>
                    <div className="flex items-center justify-end space-x-1">
                      <span>Order Value</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th className="py-2.5 px-4 text-center cursor-pointer hover:bg-slate-100" onClick={() => handleSort('predicted_risk')}>
                    <div className="flex items-center justify-center space-x-1 text-rose-700">
                      <span>Predicted Risk</span>
                      <ArrowUpDown size={11} />
                    </div>
                  </th>
                  <th className="py-2.5 px-4">Risk Level</th>
                  <th className="py-2.5 px-4">Primary Risk Driver</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((order) => (
                  <tr 
                    key={order.order_id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      #{order.order_id}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {order.shipping_mode}
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[130px]">
                      {order.category_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {order.region}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-900 tabular-nums">
                      ${order.order_value.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums font-bold text-rose-600">
                      {(order.predicted_risk * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                        order.risk_level === 'High' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        order.risk_level === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {order.risk_level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-xs">
                      {order.risk_driver}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Intervene
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {data && data.total_pages > 1 && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Showing Page <span className="font-bold text-slate-800">{data.current_page}</span> of{' '}
              <span className="font-bold text-slate-800">{data.total_pages}</span> ({data.total_items} total orders)
            </span>

            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors inline-flex items-center space-x-1"
              >
                <ChevronLeft size={13} />
                <span>Previous</span>
              </button>
              <button
                disabled={currentPage >= data.total_pages}
                onClick={() => setCurrentPage(prev => Math.min(data.total_pages, prev + 1))}
                className="px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors inline-flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* DETAIL DRAWER / MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-md border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in duration-150">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldAlert size={18} className="text-rose-400" />
                <span className="font-bold text-sm">
                  Order #{selectedOrder.order_id} Triage Details
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Shipping Mode</span>
                  <span className="font-bold text-slate-800">{selectedOrder.shipping_mode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Committed SLA</span>
                  <span className="font-bold text-slate-800">{selectedOrder.scheduled_days} Days</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Destination Region</span>
                  <span className="font-bold text-slate-800">{selectedOrder.region} ({selectedOrder.market})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Net Order Value</span>
                  <span className="font-bold text-slate-800">${selectedOrder.order_value.toFixed(2)}</span>
                </div>
              </div>

              {/* Risk Score */}
              <div className="p-3 bg-rose-50 border border-rose-200 rounded space-y-1">
                <div className="flex justify-between items-center text-rose-900 font-bold">
                  <span>Assessed Delivery Risk:</span>
                  <span className="text-sm">{(selectedOrder.predicted_risk * 100).toFixed(1)}%</span>
                </div>
                <p className="text-rose-800 text-[11px]">
                  Primary Bottleneck Driver: {selectedOrder.risk_driver}
                </p>
              </div>

              {/* Prescriptive Action */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-1.5">
                <div className="flex items-center space-x-1.5 text-blue-900 font-bold">
                  <Compass size={14} className="text-blue-700" />
                  <span>Immediate Warehouse Protocol:</span>
                </div>
                <p className="text-blue-950 leading-relaxed">
                  Route item to Express Cross-Docking Bay B. Tag with Priority Neon Bag. Handover directly to regional carrier linehaul prior to the 17:00 cutoff window.
                </p>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    alert(`Intervention ticket dispatched for Order #${selectedOrder.order_id}. Assigned to Expedited Fulfillment Queue.`);
                    setSelectedOrder(null);
                  }}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  Trigger Warehouse Expedite
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
