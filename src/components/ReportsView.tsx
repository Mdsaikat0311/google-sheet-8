// Helper to ensure clean rate percentage format e.g. 100.0% or 0.0%
const cleanRate = (rate?: string) => {
  if (!rate || rate.trim() === '' || rate === '0') return '0.0%';
  const trimmed = rate.trim();
  return trimmed.endsWith('%') ? trimmed : `${trimmed}%`;
};

import React, { useState, useEffect, useMemo } from 'react';
import {
  Truck,
  RotateCcw,
  Hourglass,
  Ban,
  Calendar,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Layers,
  ShoppingBag,
  ExternalLink,
  Search,
  CheckCircle2,
  Phone,
  Globe,
  MessageCircle,
  Video,
  Share2,
  Package,
  Clock,
  Filter,
  ArrowUpRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { Order, Sheet1ProductReport, ProductReportSource } from '../types';
import { fetchSheet1Reports, DEFAULT_SPREADSHEET_ID } from '../services/sheets';
import { INITIAL_CUSTOMER_ANALYTICS } from '../data/initialOrders';

interface ReportsViewProps {
  spreadsheetId?: string;
  orders?: Order[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  spreadsheetId = DEFAULT_SPREADSHEET_ID,
  orders = [],
}) => {
  const [sheetProducts, setSheetProducts] = useState<Sheet1ProductReport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Selected product ID for full dedicated source detail page (when card is clicked)
  const [selectedDetailProductId, setSelectedDetailProductId] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'products' | 'sources' | 'customers'>('products');
  
  // Date Filtering State
  const [dateFilter, setDateFilter] = useState<string>('all'); // 'all', 'today', 'yesterday', 'week', 'month', or specific date
  const [customDate, setCustomDate] = useState<string>('');
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);

  // Load Sheet 1 Report Data (supports background real-time sync)
  const loadSheet1Data = async (isManual: boolean = false, isBackground: boolean = false) => {
    if (isManual) setRefreshing(true);
    else if (!isBackground) setLoading(true);

    try {
      const result = await fetchSheet1Reports(spreadsheetId);
      if (result.products && result.products.length > 0) {
        setSheetProducts(result.products);
        setLastUpdated(
          new Date().toLocaleTimeString('bn-BD', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        );
      }
    } catch (err) {
      console.error('Failed to load Sheet 1 reports:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSheet1Data();
    // Real-time automatic polling every 15 seconds to sync Google Sheet 1
    const interval = setInterval(() => {
      loadSheet1Data(false, true);
    }, 15000);
    return () => clearInterval(interval);
  }, [spreadsheetId]);

  // Extract all distinct dates from orders
  const availableDates = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.date && o.date.trim()) {
        set.add(o.date.trim());
      }
    });
    return Array.from(set);
  }, [orders]);

  // Normalize and match date filter
  const matchesDate = (orderDateStr?: string): boolean => {
    if (dateFilter === 'all') return true;
    if (!orderDateStr) return false;
    const cleanDate = orderDateStr.trim();

    if (dateFilter === 'custom' && customDate) {
      // Compare customDate (YYYY-MM-DD) with cleanDate (e.g. 08/09/26, 2026-09-08, 08/09/2026)
      if (cleanDate.includes(customDate)) return true;
      const parts = customDate.split('-');
      if (parts.length === 3) {
        const [y, m, d] = parts;
        const shortY = y.slice(-2);
        const format1 = `${d}/${m}/${shortY}`;
        const format2 = `${d}/${m}/${y}`;
        const format3 = `${m}/${d}/${shortY}`;
        if (cleanDate === format1 || cleanDate === format2 || cleanDate === format3) return true;
      }
    }

    if (dateFilter === 'today') {
      const now = new Date();
      const d = String(now.getDate()).padStart(2, '0');
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const y = String(now.getFullYear()).slice(-2);
      const todayStr = `${d}/${m}/${y}`;
      if (cleanDate === todayStr || cleanDate.includes(todayStr)) return true;
      // Fallback: If orders have a single recent date like 08/09/26 and it's active in demo
      if (availableDates.length > 0 && cleanDate === availableDates[0]) return true;
      return false;
    }

    if (dateFilter === 'yesterday') {
      const now = new Date();
      now.setDate(now.getDate() - 1);
      const d = String(now.getDate()).padStart(2, '0');
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const y = String(now.getFullYear()).slice(-2);
      const yesterdayStr = `${d}/${m}/${y}`;
      return cleanDate === yesterdayStr || cleanDate.includes(yesterdayStr);
    }

    // Specific date selected directly from available dates
    return cleanDate === dateFilter;
  };

  // Filtered orders matching selected date
  const dateFilteredOrders = useMemo(() => {
    if (dateFilter === 'all') return orders;
    return orders.filter((o) => matchesDate(o.date));
  }, [orders, dateFilter, customDate, availableDates]);

  // Order status helper functions
  const isConfirmed = (status?: string) => {
    const s = (status || '').toLowerCase();
    return (
      s.includes('confirm') ||
      s.includes('complete') ||
      s.includes('deliv') ||
      s.includes('proc') ||
      s.includes('প্রসেসিং') ||
      s.includes('কমপ্লিট')
    );
  };

  const isDelivered = (status?: string, courierStatus?: string) => {
    const s = (status || '').toLowerCase();
    const c = (courierStatus || '').toLowerCase();
    return s.includes('deliv') || c === 'delivered' || s.includes('ডেলিভার্ড');
  };

  const isPending = (status?: string, courierStatus?: string) => {
    const s = (status || '').toLowerCase();
    const c = (courierStatus || '').toLowerCase();
    return (
      s.includes('pend') ||
      s.includes('hold') ||
      c === 'in_review' ||
      c === 'pending' ||
      s.includes('পেন্ডিং') ||
      s.includes('হোল্ড')
    );
  };

  const isCancelled = (status?: string, courierStatus?: string) => {
    const s = (status || '').toLowerCase();
    const c = (courierStatus || '').toLowerCase();
    return (
      s.includes('cancel') ||
      c === 'cancelled' ||
      s.includes('বাতিল') ||
      s.includes('ক্যান্সেল')
    );
  };

  const isPartial = (status?: string, courierStatus?: string) => {
    const s = (status || '').toLowerCase();
    const c = (courierStatus || '').toLowerCase();
    return s.includes('part') || c === 'partial_delivered';
  };

  // Helper to match an order to a product name
  const matchesProductName = (order: Order, prodName: string): boolean => {
    const pLow = prodName.toLowerCase().trim();
    const vLow = (order.variant || '').toLowerCase().trim();
    const oProdLow = (order.product || '').toLowerCase().trim();

    if (vLow === pLow || oProdLow === pLow) return true;
    if (vLow && vLow !== 'no sellect' && (vLow.includes(pLow) || pLow.includes(vLow))) return true;
    if (oProdLow && (oProdLow.includes(pLow) || pLow.includes(oProdLow))) return true;
    return false;
  };

  // Master unified products list: combines Sheet 1 products with any products in orders
  const unifiedProducts = useMemo(() => {
    const list: {
      id: string;
      productName: string;
      rawHeader: string;
      sheetReport?: Sheet1ProductReport;
    }[] = [];

    // Add products from Sheet 1
    sheetProducts.forEach((sp) => {
      list.push({
        id: sp.id,
        productName: sp.productName,
        rawHeader: sp.rawHeader,
        sheetReport: sp,
      });
    });

    // Also check orders for any unique variants or products not in Sheet 1
    orders.forEach((o) => {
      const candidates = [o.variant, o.product].filter(
        (v) => v && v.trim() && v.trim().toLowerCase() !== 'no sellect'
      ) as string[];

      candidates.forEach((cand) => {
        const cleanCand = cand.trim();
        const exists = list.some(
          (p) =>
            p.productName.toLowerCase().trim() === cleanCand.toLowerCase().trim() ||
            p.productName.toLowerCase().includes(cleanCand.toLowerCase()) ||
            cleanCand.toLowerCase().includes(p.productName.toLowerCase())
        );
        if (!exists) {
          list.push({
            id: `ORD-PROD-${cleanCand.replace(/\s+/g, '-').toLowerCase()}`,
            productName: cleanCand,
            rawHeader: cleanCand,
          });
        }
      });
    });

    return list;
  }, [sheetProducts, orders]);

  // Aggregate stats across all products according to selected date
  const aggregatedStats = useMemo(() => {
    // If a specific date is chosen, calculate directly from dateFilteredOrders
    if (dateFilter !== 'all') {
      let filtered = dateFilteredOrders;
      if (selectedProduct !== 'all') {
        filtered = filtered.filter((o) => matchesProductName(o, selectedProduct));
      }

      const totalLead = filtered.length;
      const totalConfirm = filtered.filter((o) => isConfirmed(o.status)).length;
      const totalDelivery = filtered.filter((o) => isDelivered(o.status, o.courierStatus)).length;
      const totalPending = filtered.filter((o) => isPending(o.status, o.courierStatus)).length;
      const totalPartial = filtered.filter((o) => isPartial(o.status, o.courierStatus)).length;
      const totalCancel = filtered.filter((o) => isCancelled(o.status, o.courierStatus)).length;
      const totalQuantity = filtered.reduce((sum, o) => sum + (o.quantity || 1), 0);
      const totalAmount = filtered.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);

      return {
        totalLead,
        totalConfirm,
        confirmRate: totalLead > 0 ? `${((totalConfirm / totalLead) * 100).toFixed(1)}%` : '0%',
        totalDelivery,
        deliveryRate: totalConfirm > 0 ? `${((totalDelivery / totalConfirm) * 100).toFixed(1)}%` : '0%',
        totalPending,
        totalPartial,
        totalQuantity,
        totalCancel,
        cancelRate: totalLead > 0 ? `${((totalCancel / totalLead) * 100).toFixed(1)}%` : '0%',
        totalAmount,
      };
    }

    // When date is 'all'
    if (sheetProducts.length > 0) {
      if (selectedProduct !== 'all') {
        const p = sheetProducts.find((item) => item.productName === selectedProduct);
        if (p) {
          const matchingOrders = orders.filter((o) => matchesProductName(o, selectedProduct));
          const totalAmount = matchingOrders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);
          return {
            totalLead: p.overall.lead || matchingOrders.length,
            totalConfirm: p.overall.confirm,
            confirmRate: p.overall.confirmRate,
            totalDelivery: p.overall.delivery,
            deliveryRate: p.overall.deliveryRate,
            totalPending: p.overall.pending,
            totalPartial: p.overall.partial,
            totalQuantity: p.overall.quantity,
            totalCancel: p.overall.cancel,
            cancelRate: p.overall.cancelRate,
            totalAmount,
          };
        }
      }

      const lead = sheetProducts.reduce((sum, p) => sum + p.overall.lead, 0);
      const confirm = sheetProducts.reduce((sum, p) => sum + p.overall.confirm, 0);
      const delivery = sheetProducts.reduce((sum, p) => sum + p.overall.delivery, 0);
      const pending = sheetProducts.reduce((sum, p) => sum + p.overall.pending, 0);
      const partial = sheetProducts.reduce((sum, p) => sum + p.overall.partial, 0);
      const quantity = sheetProducts.reduce((sum, p) => sum + p.overall.quantity, 0);
      const cancel = sheetProducts.reduce((sum, p) => sum + p.overall.cancel, 0);
      const totalAmount = orders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);

      return {
        totalLead: lead,
        totalConfirm: confirm,
        confirmRate: lead > 0 ? `${((confirm / lead) * 100).toFixed(1)}%` : '0%',
        totalDelivery: delivery,
        deliveryRate: confirm > 0 ? `${((delivery / confirm) * 100).toFixed(1)}%` : '0%',
        totalPending: pending,
        totalPartial: partial,
        totalQuantity: quantity,
        totalCancel: cancel,
        cancelRate: confirm > 0 ? `${((cancel / confirm) * 100).toFixed(1)}%` : '0%',
        totalAmount,
      };
    }

    // Fallback directly from orders if Sheet 1 not yet loaded
    const totalLead = orders.length;
    const totalConfirm = orders.filter((o) => isConfirmed(o.status)).length;
    const totalDelivery = orders.filter((o) => isDelivered(o.status, o.courierStatus)).length;
    const totalPending = orders.filter((o) => isPending(o.status, o.courierStatus)).length;
    const totalPartial = orders.filter((o) => isPartial(o.status, o.courierStatus)).length;
    const totalCancel = orders.filter((o) => isCancelled(o.status, o.courierStatus)).length;
    const totalQuantity = orders.reduce((sum, o) => sum + (o.quantity || 1), 0);
    const totalAmount = orders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);

    return {
      totalLead,
      totalConfirm,
      confirmRate: totalLead > 0 ? `${((totalConfirm / totalLead) * 100).toFixed(1)}%` : '0%',
      totalDelivery,
      deliveryRate: totalConfirm > 0 ? `${((totalDelivery / totalConfirm) * 100).toFixed(1)}%` : '0%',
      totalPending,
      totalPartial,
      totalQuantity,
      totalCancel,
      cancelRate: totalLead > 0 ? `${((totalCancel / totalLead) * 100).toFixed(1)}%` : '0%',
      totalAmount,
    };
  }, [sheetProducts, selectedProduct, dateFilter, dateFilteredOrders, orders]);

  // Filtered products list based on search and pill filter
  const filteredProducts = useMemo(() => {
    return unifiedProducts.filter((p) => {
      const matchesSearch =
        p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sheetReport &&
          p.sheetReport.sources.some((s) => s.source.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchesFilter = selectedProduct === 'all' || p.productName === selectedProduct;
      return matchesSearch && matchesFilter;
    });
  }, [unifiedProducts, searchTerm, selectedProduct]);

  // Aggregate sources across all products for Sources tab
  const sourceAnalytics = useMemo(() => {
    const sourceMap: {
      [key: string]: {
        name: string;
        lead: number;
        confirm: number;
        delivery: number;
        partial: number;
        pending: number;
        quantity: number;
        cancel: number;
      };
    } = {};

    sheetProducts.forEach((p) => {
      p.sources.forEach((s) => {
        const cleanName = s.sourceName || 'Unknown';
        if (!sourceMap[cleanName]) {
          sourceMap[cleanName] = {
            name: cleanName,
            lead: 0,
            confirm: 0,
            delivery: 0,
            partial: 0,
            pending: 0,
            quantity: 0,
            cancel: 0,
          };
        }
        sourceMap[cleanName].lead += s.lead;
        sourceMap[cleanName].confirm += s.confirm;
        sourceMap[cleanName].delivery += s.delivery;
        sourceMap[cleanName].partial += s.partial;
        sourceMap[cleanName].pending += s.pending;
        sourceMap[cleanName].quantity += s.quantity;
        sourceMap[cleanName].cancel += s.cancel;
      });
    });

    const list = Object.values(sourceMap);
    const totalLead = list.reduce((sum, item) => sum + item.lead, 0);

    const colors: { [key: string]: string } = {
      Website: '#3b82f6',
      Messenger: '#8b5cf6',
      Whatsapp: '#10b981',
      Tiktok: '#ec4899',
      'Call Direct': '#f59e0b',
      INCOMPLETE: '#ef4444',
      Youtube: '#dc2626',
    };

    return list.map((item) => ({
      ...item,
      percentage: totalLead > 0 ? Math.round((item.lead / totalLead) * 100) : 0,
      color: colors[item.name] || '#6b7280',
    }));
  }, [sheetProducts]);

  // Customer Analytics
  const derivedCustomerAnalytics = useMemo(() => {
    if (!orders || orders.length === 0) return INITIAL_CUSTOMER_ANALYTICS;

    const customerMap: {
      [key: string]: {
        name: string;
        phone: string;
        address: string;
        totalOrders: number;
        totalSpend: number;
        lastOrder: string;
      };
    } = {};

    orders.forEach((o) => {
      const phoneKey = o.customerPhone ? o.customerPhone.trim() : o.customerName;
      if (!customerMap[phoneKey]) {
        customerMap[phoneKey] = {
          name: o.customerName,
          phone: o.customerPhone,
          address: o.customerAddress,
          totalOrders: 0,
          totalSpend: 0,
          lastOrder: o.date || '08/09/26',
        };
      }
      customerMap[phoneKey].totalOrders += 1;
      customerMap[phoneKey].totalSpend += o.amount || o.total || 0;
    });

    return Object.values(customerMap)
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 10)
      .map((c) => ({
        name: c.name,
        phone: c.phone,
        address: c.address,
        totalOrders: c.totalOrders,
        avgOrderValue: Math.round(c.totalSpend / (c.totalOrders || 1)),
        lastOrder: c.lastOrder,
        status: 'Active' as 'Active' | 'Inactive',
      }));
  }, [orders]);

  // Source Icon Helper
  const getSourceIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('website')) return <Globe className="w-4 h-4 text-blue-400 shrink-0" />;
    if (n.includes('messenger')) return <MessageCircle className="w-4 h-4 text-purple-400 shrink-0" />;
    if (n.includes('whatsapp') || n.includes('what')) return <Phone className="w-4 h-4 text-emerald-400 shrink-0" />;
    if (n.includes('tiktok')) return <Video className="w-4 h-4 text-pink-400 shrink-0" />;
    if (n.includes('call') || n.includes('phone')) return <Phone className="w-4 h-4 text-amber-400 shrink-0" />;
    if (n.includes('youtube') || n.includes('you')) return <Video className="w-4 h-4 text-rose-400 shrink-0" />;
    return <Share2 className="w-4 h-4 text-gray-400 shrink-0" />;
  };

  // Selected product detail object
  const selectedProductDetail = useMemo(() => {
    if (!selectedDetailProductId) return null;
    return unifiedProducts.find((p) => p.id === selectedDetailProductId) || null;
  }, [selectedDetailProductId, unifiedProducts]);

  // Compute analytics for a given product
  const getProductAnalytics = (prod: {
    id: string;
    productName: string;
    rawHeader: string;
    sheetReport?: Sheet1ProductReport;
  }) => {
    // Orders matching this product under the selected date filter
    const relatedDateOrders = dateFilteredOrders.filter((o) =>
      matchesProductName(o, prod.productName)
    );

    // Orders matching this product across all dates
    const allRelatedOrders = orders.filter((o) =>
      matchesProductName(o, prod.productName)
    );

    // Compute stats
    let prodStats = {
      lead: 0,
      confirm: 0,
      confirmRate: '0.0%',
      delivery: 0,
      deliveryRate: '0.0%',
      pending: 0,
      pendingRate: '0.0%',
      partial: 0,
      partialRate: '0.0%',
      quantity: 0,
      cancel: 0,
      cancelRate: '0.0%',
      amount: 0,
    };

    if (dateFilter !== 'all') {
      const lead = relatedDateOrders.length;
      const confirm = relatedDateOrders.filter((o) => isConfirmed(o.status)).length;
      const delivery = relatedDateOrders.filter((o) => isDelivered(o.status, o.courierStatus)).length;
      const pending = relatedDateOrders.filter((o) => isPending(o.status, o.courierStatus)).length;
      const partial = relatedDateOrders.filter((o) => isPartial(o.status, o.courierStatus)).length;
      const cancel = relatedDateOrders.filter((o) => isCancelled(o.status, o.courierStatus)).length;
      const quantity = relatedDateOrders.reduce((sum, o) => sum + (o.quantity || 1), 0);
      const amount = relatedDateOrders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);

      prodStats = {
        lead,
        confirm,
        confirmRate: lead > 0 ? `${((confirm / lead) * 100).toFixed(1)}%` : '0.0%',
        delivery,
        deliveryRate: confirm > 0 ? `${((delivery / confirm) * 100).toFixed(1)}%` : '0.0%',
        pending,
        pendingRate: lead > 0 ? `${((pending / lead) * 100).toFixed(1)}%` : '0.0%',
        partial,
        partialRate: lead > 0 ? `${((partial / lead) * 100).toFixed(1)}%` : '0.0%',
        quantity,
        cancel,
        cancelRate: lead > 0 ? `${((cancel / lead) * 100).toFixed(1)}%` : '0.0%',
        amount,
      };
    } else if (prod.sheetReport) {
      const lead = prod.sheetReport.overall.lead || allRelatedOrders.length;
      const confirm = prod.sheetReport.overall.confirm;
      const delivery = prod.sheetReport.overall.delivery;
      const pending = prod.sheetReport.overall.pending;
      const partial = prod.sheetReport.overall.partial;
      const quantity = prod.sheetReport.overall.quantity || allRelatedOrders.reduce((sum, o) => sum + (o.quantity || 1), 0);
      const cancel = prod.sheetReport.overall.cancel;
      const amount = allRelatedOrders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);

      prodStats = {
        lead,
        confirm,
        confirmRate: prod.sheetReport.overall.confirmRate || (lead > 0 ? `${((confirm / lead) * 100).toFixed(1)}%` : '0.0%'),
        delivery,
        deliveryRate: prod.sheetReport.overall.deliveryRate || (confirm > 0 ? `${((delivery / confirm) * 100).toFixed(1)}%` : '0.0%'),
        pending,
        pendingRate: prod.sheetReport.overall.pendingRate || (lead > 0 ? `${((pending / lead) * 100).toFixed(1)}%` : '0.0%'),
        partial,
        partialRate: prod.sheetReport.overall.partialRate || (lead > 0 ? `${((partial / lead) * 100).toFixed(1)}%` : '0.0%'),
        quantity,
        cancel,
        cancelRate: prod.sheetReport.overall.cancelRate || (lead > 0 ? `${((cancel / lead) * 100).toFixed(1)}%` : '0.0%'),
        amount,
      };
    } else {
      const lead = allRelatedOrders.length;
      const confirm = allRelatedOrders.filter((o) => isConfirmed(o.status)).length;
      const delivery = allRelatedOrders.filter((o) => isDelivered(o.status, o.courierStatus)).length;
      const pending = allRelatedOrders.filter((o) => isPending(o.status, o.courierStatus)).length;
      const partial = allRelatedOrders.filter((o) => isPartial(o.status, o.courierStatus)).length;
      const cancel = allRelatedOrders.filter((o) => isCancelled(o.status, o.courierStatus)).length;
      const quantity = allRelatedOrders.reduce((sum, o) => sum + (o.quantity || 1), 0);
      const amount = allRelatedOrders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);

      prodStats = {
        lead,
        confirm,
        confirmRate: lead > 0 ? `${((confirm / lead) * 100).toFixed(1)}%` : '0.0%',
        delivery,
        deliveryRate: confirm > 0 ? `${((delivery / confirm) * 100).toFixed(1)}%` : '0.0%',
        pending,
        pendingRate: lead > 0 ? `${((pending / lead) * 100).toFixed(1)}%` : '0.0%',
        partial,
        partialRate: lead > 0 ? `${((partial / lead) * 100).toFixed(1)}%` : '0.0%',
        quantity,
        cancel,
        cancelRate: lead > 0 ? `${((cancel / lead) * 100).toFixed(1)}%` : '0.0%',
        amount,
      };
    }

    // Per-source stats
    const sourcesList: {
      name: string;
      lead: number;
      confirm: number;
      confirmRate: string;
      delivery: number;
      deliveryRate: string;
      cancel: number;
      cancelRate: string;
      pending: number;
      pendingRate: string;
      partial: number;
      partialRate: string;
      quantity: number;
      amount: number;
      sharePercent: string;
    }[] = [];

    if (dateFilter !== 'all' || !prod.sheetReport) {
      const activeOrders = dateFilter !== 'all' ? relatedDateOrders : allRelatedOrders;
      const map: Record<string, Order[]> = {};
      activeOrders.forEach((o) => {
        const src = (o.source && o.source.trim()) ? o.source.trim() : 'Website';
        if (!map[src]) map[src] = [];
        map[src].push(o);
      });

      if (prod.sheetReport) {
        prod.sheetReport.sources.forEach((s) => {
          if (!map[s.sourceName]) map[s.sourceName] = [];
        });
      }

      const totalSourceLeads = activeOrders.length || 1;

      Object.entries(map).forEach(([srcName, ords]) => {
        const sLead = ords.length;
        const sConfirm = ords.filter((o) => isConfirmed(o.status)).length;
        const sDel = ords.filter((o) => isDelivered(o.status, o.courierStatus)).length;
        const sCan = ords.filter((o) => isCancelled(o.status, o.courierStatus)).length;
        const sPen = ords.filter((o) => isPending(o.status, o.courierStatus)).length;
        const sPart = ords.filter((o) => isPartial(o.status, o.courierStatus)).length;
        const sQty = ords.reduce((sum, o) => sum + (o.quantity || 1), 0);
        const sAmt = ords.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);

        sourcesList.push({
          name: srcName,
          lead: sLead,
          confirm: sConfirm,
          confirmRate: sLead > 0 ? `${((sConfirm / sLead) * 100).toFixed(1)}%` : '0.0%',
          delivery: sDel,
          deliveryRate: sConfirm > 0 ? `${((sDel / sConfirm) * 100).toFixed(1)}%` : '0.0%',
          cancel: sCan,
          cancelRate: sLead > 0 ? `${((sCan / sLead) * 100).toFixed(1)}%` : '0.0%',
          pending: sPen,
          pendingRate: sLead > 0 ? `${((sPen / sLead) * 100).toFixed(1)}%` : '0.0%',
          partial: sPart,
          partialRate: sLead > 0 ? `${((sPart / sLead) * 100).toFixed(1)}%` : '0.0%',
          quantity: sQty,
          amount: sAmt,
          sharePercent: `${Math.round((sLead / totalSourceLeads) * 100)}%`,
        });
      });
    } else {
      prod.sheetReport.sources.forEach((s) => {
        const sOrders = allRelatedOrders.filter(
          (o) => (o.source || '').toLowerCase().trim() === s.sourceName.toLowerCase().trim()
        );
        const sAmt = sOrders.reduce((sum, o) => sum + (o.amount || o.total || 0), 0);

        sourcesList.push({
          name: s.sourceName,
          lead: s.lead,
          confirm: s.confirm,
          confirmRate: s.confirmRate || (s.lead > 0 ? `${((s.confirm / s.lead) * 100).toFixed(1)}%` : '0.0%'),
          delivery: s.delivery,
          deliveryRate: s.deliveryRate || (s.confirm > 0 ? `${((s.delivery / s.confirm) * 100).toFixed(1)}%` : '0.0%'),
          cancel: s.cancel,
          cancelRate: s.cancelRate || (s.lead > 0 ? `${((s.cancel / s.lead) * 100).toFixed(1)}%` : '0.0%'),
          pending: s.pending,
          pendingRate: s.pendingRate || (s.lead > 0 ? `${((s.pending / s.lead) * 100).toFixed(1)}%` : '0.0%'),
          partial: s.partial,
          partialRate: s.partialRate || (s.lead > 0 ? `${((s.partial / s.lead) * 100).toFixed(1)}%` : '0.0%'),
          quantity: s.quantity,
          amount: sAmt,
          sharePercent: s.sharePercent,
        });
      });
    }

    sourcesList.sort((a, b) => b.lead - a.lead);

    return {
      relatedDateOrders,
      allRelatedOrders,
      prodStats,
      sourcesList,
    };
  };

  // Get readable label for current date filter
  const getDateFilterLabel = () => {
    if (dateFilter === 'all') return 'সব তারিখ (All Dates)';
    if (dateFilter === 'today') return 'আজ (Today)';
    if (dateFilter === 'yesterday') return 'গতকাল (Yesterday)';
    if (dateFilter === 'custom') return customDate ? `তারিখ: ${customDate}` : 'কাস্টম তারিখ';
    return `তারিখ: ${dateFilter}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#12151f] border border-[#1e2436] p-4 sm:p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
              শীট ১ রিলেশন ও প্রোডাক্ট পারফরম্যান্স রিপোর্ট
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
              Live Relation Sync
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            প্রতিটি প্রোডাক্ট ও সেলস সোর্সের লিড, কনফার্ম, ডেলিভারি ও ক্যান্সেল বিশ্লেষণ
            {lastUpdated && ` • শেষ আপডেট: ${lastUpdated}`}
          </p>
        </div>

        {/* Action Controls & Date Selector */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Refresh Button */}
          <button
            onClick={() => loadSheet1Data(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1a2030] hover:bg-[#232c42] border border-[#2d3852] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            title="শীট ১ থেকে পুনরায় ডেটা রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-pink-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'রিফ্রেশ হচ্ছে...' : 'রিয়েলটাইম রিফ্রেশ'}</span>
          </button>

          {/* Direct Sheet 1 link */}
          <a
            href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit#gid=0`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141824] hover:bg-[#1c2234] border border-[#222a3d] text-gray-300 text-xs font-medium transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">গুগল শীট ১</span>
          </a>

          {/* Date Range & Specific Date Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#161a26] hover:bg-[#1f2536] border border-pink-500/30 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Calendar className="w-3.5 h-3.5 text-pink-400" />
              <span>{getDateFilterLabel()}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {isDateMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#161a26] border border-[#273046] rounded-xl shadow-2xl py-2 z-40 animate-fadeIn">
                <div className="px-3 py-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-[#20273a] mb-1">
                  তারিখ নির্বাচন করুন
                </div>

                <button
                  onClick={() => {
                    setDateFilter('all');
                    setIsDateMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between hover:bg-[#20273a] ${
                    dateFilter === 'all' ? 'text-pink-400 font-bold bg-pink-500/10' : 'text-gray-300'
                  }`}
                >
                  <span>সব তারিখ (All Dates)</span>
                  <span className="text-[10px] text-gray-500 font-mono">{orders.length}</span>
                </button>

                <button
                  onClick={() => {
                    setDateFilter('today');
                    setIsDateMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between hover:bg-[#20273a] ${
                    dateFilter === 'today' ? 'text-pink-400 font-bold bg-pink-500/10' : 'text-gray-300'
                  }`}
                >
                  <span>আজ (Today)</span>
                  <span className="text-[10px] text-gray-500 font-mono">লাইভ</span>
                </button>

                <button
                  onClick={() => {
                    setDateFilter('yesterday');
                    setIsDateMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between hover:bg-[#20273a] ${
                    dateFilter === 'yesterday' ? 'text-pink-400 font-bold bg-pink-500/10' : 'text-gray-300'
                  }`}
                >
                  <span>গতকাল (Yesterday)</span>
                </button>

                {availableDates.length > 0 && (
                  <>
                    <div className="px-3 py-1 mt-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-t border-[#20273a]">
                      শীট থেকে প্রাপ্ত তারিখ:
                    </div>
                    {availableDates.map((dt) => {
                      const count = orders.filter((o) => o.date?.trim() === dt).length;
                      return (
                        <button
                          key={dt}
                          onClick={() => {
                            setDateFilter(dt);
                            setIsDateMenuOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-1.5 text-xs flex items-center justify-between hover:bg-[#20273a] ${
                            dateFilter === dt ? 'text-pink-400 font-bold bg-pink-500/10' : 'text-gray-300'
                          }`}
                        >
                          <span>তারিখ: {dt}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1e2434] text-purple-300 font-mono">
                            {count} টি
                          </span>
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Custom Date Input */}
                <div className="px-3 pt-2 mt-1 border-t border-[#20273a]">
                  <label className="text-[10px] text-gray-400 block mb-1">কাস্টম নির্দিষ্ট তারিখ:</label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => {
                      setCustomDate(e.target.value);
                      setDateFilter('custom');
                      setIsDateMenuOpen(false);
                    }}
                    className="w-full bg-[#10131c] border border-[#273046] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4 Main KPI Cards: সব অর্ডারের মূল ডাটা বক্স (All Orders Summary Box for Selected Date) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">
              📊 সব অর্ডারের ডাটা বক্স ({getDateFilterLabel()})
            </span>
            {dateFilter !== 'all' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                ফিল্টার সক্রিয়
              </span>
            )}
          </div>
          {dateFilter !== 'all' && (
            <button
              onClick={() => setDateFilter('all')}
              className="text-xs text-pink-400 hover:text-pink-300 underline font-medium"
            >
              সব তারিখের ডাটা দেখুন
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1: মোট অর্ডার লিড */}
          <div className="bg-[#12151f] border border-[#1e2436] rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-purple-500/40 transition-all shadow-md">
            <div className="flex items-center justify-between text-xs font-medium text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                মোট লিড এসেছে
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {aggregatedStats.totalLead} <span className="text-sm font-semibold text-gray-400">টি</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1 flex items-center justify-between">
                <span>কনফার্ম: <strong className="text-purple-300">{aggregatedStats.totalConfirm}</strong> টি</span>
                <span>পেন্ডিং: <strong className="text-amber-400">{aggregatedStats.totalPending}</strong></span>
              </div>
            </div>
          </div>

          {/* Card 2: কনফার্মেশন সংখ্যা ও রেট */}
          <div className="bg-[#12151f] border border-[#1e2436] rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-pink-500/40 transition-all shadow-md">
            <div className="flex items-center justify-between text-xs font-medium text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                কনফার্ম হয়েছে
              </span>
              <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl sm:text-3xl font-black text-pink-400 tracking-tight">
                {aggregatedStats.totalConfirm} <span className="text-sm font-semibold text-gray-400">টি</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1 flex items-center justify-between">
                <span>কনফার্ম রেট: <strong className="text-pink-300">{aggregatedStats.confirmRate}</strong></span>
                <span>ডেলিভারি: <strong className="text-emerald-400">{aggregatedStats.totalDelivery}</strong></span>
              </div>
            </div>
          </div>

          {/* Card 3: ডেলিভারি সংখ্যা ও রেট */}
          <div className="bg-[#12151f] border border-[#1e2436] rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-all shadow-md">
            <div className="flex items-center justify-between text-xs font-medium text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                ডেলিভারি সম্পন্ন
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
                {aggregatedStats.totalDelivery} <span className="text-sm font-semibold text-gray-400">টি</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1 flex items-center justify-between">
                <span>সাকসেস রেট: <strong className="text-emerald-300">{aggregatedStats.deliveryRate}</strong></span>
                <span>পার্শিয়াল: <strong className="text-amber-400">{aggregatedStats.totalPartial}</strong></span>
              </div>
            </div>
          </div>

          {/* Card 4: কোয়ান্টিটি ও ক্যান্সেল */}
          <div className="bg-[#12151f] border border-[#1e2436] rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-rose-500/40 transition-all shadow-md">
            <div className="flex items-center justify-between text-xs font-medium text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                ক্যান্সেল ও কোয়ান্টিটি
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Ban className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
                {aggregatedStats.totalCancel} <span className="text-sm font-semibold text-gray-400">টি</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1 flex items-center justify-between">
                <span>ক্যান্সেল রেট: <strong className="text-rose-300">{aggregatedStats.cancelRate}</strong></span>
                <span>কোয়ান্টিটি: <strong className="text-white">{aggregatedStats.totalQuantity}</strong> টি</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Filter Pills & Search Bar */}
      <div className="bg-[#12151f] border border-[#1e2436] p-3.5 sm:p-4 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 bg-[#0e1017] p-1 rounded-xl border border-[#1e2436]">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'products'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              প্রোডাক্ট কার্ড বক্স ({filteredProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'sources'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              সামগ্রিক সোর্স এনালিটিক্স
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'customers'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              কাস্টমার ডাটা
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="প্রোডাক্ট বা সোর্স খুঁজুন..."
              className="w-full bg-[#161a26] border border-[#242c40] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Main Tab View 1: প্রতিটা প্রোডাক্ট এর জন্য আলাদা কার্ড বক্স ও সোর্স ডাটা পেজ */}
      {activeTab === 'products' && (
        selectedDetailProductId && selectedProductDetail ? (
          /* ========================================================
             NEW PAGE: সোর্স ডাটা পেজ (কার্ডে ক্লিক করলেই এই পেজ ওপেন হবে)
             ======================================================== */
          (() => {
            const { relatedDateOrders, prodStats, sourcesList } = getProductAnalytics(selectedProductDetail);

            return (
              <div className="space-y-4">
                {/* Dedicated Page Header with Back Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#12151f] border border-[#1e2436] p-3 sm:p-4 rounded-xl shadow-lg">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedDetailProductId(null)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1a2133] hover:bg-pink-600 border border-[#27324c] hover:border-pink-500 text-white text-xs font-bold shadow-sm transition-all group"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
                      <span>← সব প্রোডাক্টে ফিরে যান</span>
                    </button>
                    <div className="h-5 w-px bg-[#262f44]" />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-600/20 via-purple-600/20 to-blue-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold text-xs shadow-inner">
                        {selectedProductDetail.productName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                          {selectedProductDetail.productName}
                        </h3>
                        <p className="text-[10px] text-gray-400">
                          সোর্স ডাটা ও সেলস পারফরম্যান্স বিস্তারিত বিবরণ
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2.5 py-1 rounded-lg bg-pink-500/15 text-pink-300 border border-pink-500/30 font-semibold font-mono">
                      {getDateFilterLabel()}
                    </span>
                    <button
                      onClick={() => loadSheet1Data(true)}
                      disabled={refreshing}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1a2030] hover:bg-[#232c42] border border-[#2d3852] text-white text-[11px] font-semibold shadow-sm transition-all disabled:opacity-50"
                      title="শীট ১ থেকে পুনরায় ডেটা রিফ্রেশ করুন"
                    >
                      <RefreshCw className={`w-3 h-3 text-pink-400 ${refreshing ? 'animate-spin' : ''}`} />
                      <span>{refreshing ? 'রিফ্রেশ হচ্ছে...' : 'রিয়েলটাইম রিফ্রেশ'}</span>
                    </button>
                  </div>
                </div>

                {/* Product Overall Summary 7-Box Performance */}
                <div className="bg-[#12151f] border border-[#1e2436] rounded-xl p-3 sm:p-3.5 shadow-md space-y-2">
                  <div className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-purple-400" />
                      {selectedProductDetail.productName} এর সামগ্রিক পারফরম্যান্স ({getDateFilterLabel()}):
                    </span>
                    {prodStats.amount > 0 && (
                      <span className="text-emerald-400 font-mono text-[11px] font-semibold">
                        মোট বিক্রয়: ৳{prodStats.amount.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2">
                    {/* 1. Order Lead */}
                    <div className="bg-[#141824] border border-[#20283c] rounded-lg py-1 px-1.5 text-center flex flex-col justify-center min-h-[42px]">
                      <span className="text-[10px] text-gray-400 font-medium block truncate">Order Lead</span>
                      <span className="text-xs sm:text-[13px] font-bold text-white mt-0.5 font-mono">{prodStats.lead}</span>
                    </div>

                    {/* 2. Confirm */}
                    <div className="bg-[#141824] border border-[#20283c] rounded-lg py-1 px-1.5 text-center flex flex-col justify-center min-h-[42px]">
                      <span className="text-[10px] text-gray-400 font-medium block truncate">Confirm</span>
                      <span className="text-xs sm:text-[13px] font-bold text-pink-400 mt-0.5 font-mono whitespace-nowrap">
                        {prodStats.confirm} <span className="text-[10px] font-normal text-pink-300/80">({cleanRate(prodStats.confirmRate)})</span>
                      </span>
                    </div>

                    {/* 3. Delivery */}
                    <div className="bg-[#141824] border border-[#20283c] rounded-lg py-1 px-1.5 text-center flex flex-col justify-center min-h-[42px]">
                      <span className="text-[10px] text-gray-400 font-medium block truncate">Delivery</span>
                      <span className="text-xs sm:text-[13px] font-bold text-emerald-400 mt-0.5 font-mono whitespace-nowrap">
                        {prodStats.delivery} <span className="text-[10px] font-normal text-emerald-300/80">({cleanRate(prodStats.deliveryRate)})</span>
                      </span>
                    </div>

                    {/* 4. Pending */}
                    <div className="bg-[#141824] border border-[#20283c] rounded-lg py-1 px-1.5 text-center flex flex-col justify-center min-h-[42px]">
                      <span className="text-[10px] text-gray-400 font-medium block truncate">Pending</span>
                      <span className="text-xs sm:text-[13px] font-bold text-amber-400 mt-0.5 font-mono whitespace-nowrap">
                        {prodStats.pending} <span className="text-[10px] font-normal text-amber-300/80">({cleanRate(prodStats.pendingRate)})</span>
                      </span>
                    </div>

                    {/* 5. Partial */}
                    <div className="bg-[#141824] border border-[#20283c] rounded-lg py-1 px-1.5 text-center flex flex-col justify-center min-h-[42px]">
                      <span className="text-[10px] text-gray-400 font-medium block truncate">Partial</span>
                      <span className="text-xs sm:text-[13px] font-bold text-orange-400 mt-0.5 font-mono whitespace-nowrap">
                        {prodStats.partial} <span className="text-[10px] font-normal text-orange-300/80">({cleanRate(prodStats.partialRate)})</span>
                      </span>
                    </div>

                    {/* 6. Quantity */}
                    <div className="bg-[#141824] border border-[#20283c] rounded-lg py-1 px-1.5 text-center flex flex-col justify-center min-h-[42px]">
                      <span className="text-[10px] text-gray-400 font-medium block truncate">Quantity</span>
                      <span className="text-xs sm:text-[13px] font-bold text-cyan-300 mt-0.5 font-mono">{prodStats.quantity}</span>
                    </div>

                    {/* 7. Cancel */}
                    <div className="bg-[#141824] border border-[#20283c] rounded-lg py-1 px-1.5 text-center flex flex-col justify-center min-h-[42px]">
                      <span className="text-[10px] text-gray-400 font-medium block truncate">Cancel</span>
                      <span className="text-xs sm:text-[13px] font-bold text-rose-400 mt-0.5 font-mono whitespace-nowrap">
                        {prodStats.cancel} <span className="text-[10px] font-normal text-rose-300/80">({cleanRate(prodStats.cancelRate)})</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* INDIVIDUAL SOURCE DATA BOXES (প্রত্যেকটা সোর্সের জন্য আলাদা আলাদা চিকন ডাটা বক্স) */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-1 border-b border-[#1e2436]">
                    <div className="flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5 text-pink-400" />
                      <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight">
                        সোর্স ভিত্তিক আলাদা আলাদা ডাটা ({selectedProductDetail.productName}):
                      </h4>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">
                      মোট {sourcesList.length} টি সোর্স থেকে প্রাপ্ত ডাটা
                    </span>
                  </div>

                  {sourcesList.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 text-xs bg-[#10131d] border border-[#1b2234] rounded-xl">
                      সিলেক্টেড ডেটে এই প্রোডাক্টের কোনো সোর্স ডাটা পাওয়া যায়নি।
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {sourcesList.map((src, srcIdx) => (
                        <div
                          key={srcIdx}
                          className="bg-[#121622] border border-[#20293d] hover:border-pink-500/40 rounded-xl p-2.5 sm:p-3 transition-all shadow-sm space-y-2"
                        >
                          {/* Source Header */}
                          <div className="flex items-center justify-between pb-1.5 border-b border-[#1a2133]">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-md bg-[#1a2133] border border-[#2a3754] flex items-center justify-center">
                                {getSourceIcon(src.name)}
                              </div>
                              <div className="flex items-center gap-2">
                                <h6 className="text-xs sm:text-sm font-bold text-white">
                                  {src.name}
                                </h6>
                                <span className="text-[10px] text-gray-400 font-mono">
                                  • শেয়ার: {src.sharePercent} {src.amount > 0 && `• ৳${src.amount.toLocaleString()}`}
                                </span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30 font-mono">
                              {src.lead} Leads
                            </span>
                          </div>

                          {/* 7 Sleek Source Metric Boxes */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2">
                            {/* 1. Order Lead */}
                            <div className="bg-[#0b0e16] border border-[#1a2236] rounded-lg py-1 px-1.5 text-center flex flex-col justify-center min-h-[40px]">
                              <span className="text-[10px] text-gray-400 font-medium block truncate">Order Lead</span>
                              <span className="text-xs sm:text-[13px] font-bold text-white mt-0.5 font-mono">{src.lead}</span>
                            </div>

                            {/* 2. Confirm */}
                            <div className="bg-[#0b0e16] border border-[#1a2236] rounded-lg py-1 px-1.5 text-center flex flex-col justify-center min-h-[40px]">
                              <span className="text-[10px] text-gray-400 font-medium block truncate">Confirm</span>
                              <span className="text-xs sm:text-[13px] font-bold text-pink-400 mt-0.5 font-mono whitespace-nowrap">
                                {src.confirm} <span className="text-[10px] font-normal text-pink-300/80">({cleanRate(src.confirmRate)})</span>
                              </span>
                            </div>

                            {/* 3. Delivery */}
                            <div className="bg-[#0b0e16] border border-[#1a2236] rounded-lg py-1 px-1.5 text-center flex flex-col justify-center min-h-[40px]">
                              <span className="text-[10px] text-gray-400 font-medium block truncate">Delivery</span>
                              <span className="text-xs sm:text-[13px] font-bold text-emerald-400 mt-0.5 font-mono whitespace-nowrap">
                                {src.delivery} <span className="text-[10px] font-normal text-emerald-300/80">({cleanRate(src.deliveryRate)})</span>
                              </span>
                            </div>

                            {/* 4. Pending */}
                            <div className="bg-[#0b0e16] border border-[#1a2236] rounded-lg py-1 px-1.5 text-center flex flex-col justify-center min-h-[40px]">
                              <span className="text-[10px] text-gray-400 font-medium block truncate">Pending</span>
                              <span className="text-xs sm:text-[13px] font-bold text-amber-400 mt-0.5 font-mono whitespace-nowrap">
                                {src.pending} <span className="text-[10px] font-normal text-amber-300/80">({cleanRate(src.pendingRate)})</span>
                              </span>
                            </div>

                            {/* 5. Partial */}
                            <div className="bg-[#0b0e16] border border-[#1a2236] rounded-lg py-1 px-1.5 text-center flex flex-col justify-center min-h-[40px]">
                              <span className="text-[10px] text-gray-400 font-medium block truncate">Partial</span>
                              <span className="text-xs sm:text-[13px] font-bold text-orange-400 mt-0.5 font-mono whitespace-nowrap">
                                {src.partial} <span className="text-[10px] font-normal text-orange-300/80">({cleanRate(src.partialRate)})</span>
                              </span>
                            </div>

                            {/* 6. Quantity */}
                            <div className="bg-[#0b0e16] border border-[#1a2236] rounded-lg py-1 px-1.5 text-center flex flex-col justify-center min-h-[40px]">
                              <span className="text-[10px] text-gray-400 font-medium block truncate">Quantity</span>
                              <span className="text-xs sm:text-[13px] font-bold text-cyan-300 mt-0.5 font-mono">{src.quantity}</span>
                            </div>

                            {/* 7. Cancel */}
                            <div className="bg-[#0b0e16] border border-[#1a2236] rounded-lg py-1 px-1.5 text-center flex flex-col justify-center min-h-[40px]">
                              <span className="text-[10px] text-gray-400 font-medium block truncate">Cancel</span>
                              <span className="text-xs sm:text-[13px] font-bold text-rose-400 mt-0.5 font-mono whitespace-nowrap">
                                {src.cancel} <span className="text-[10px] font-normal text-rose-300/80">({cleanRate(src.cancelRate)})</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Related Live Orders List from Sheet 2 */}
                <div className="bg-[#12151f] border border-[#1e2436] rounded-xl p-3 sm:p-4 shadow-md space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h6 className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                      {selectedProductDetail.productName} এর রিলেটেড লাইভ অর্ডার ({relatedDateOrders.length} টি)
                    </h6>
                    <span className="text-[10px] text-gray-400 font-mono">
                      তারিখ: {getDateFilterLabel()}
                    </span>
                  </div>

                  {relatedDateOrders.length === 0 ? (
                    <div className="bg-[#0d1017] border border-[#1f2638] rounded-lg p-3 text-center text-gray-500 text-xs">
                      সিলেক্টেড ডেটে এই প্রোডাক্টের সাথে মিলে যাওয়া কোনো লাইভ অর্ডার Sheet 2 তে নেই।
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-[#1f2638] bg-[#0d1017]">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#1c2336] bg-[#141926] text-gray-400">
                            <th className="py-2 px-2.5 font-semibold">ইনভয়েস</th>
                            <th className="py-2 px-2.5 font-semibold">গ্রাহক</th>
                            <th className="py-2 px-2.5 font-semibold">ফোন</th>
                            <th className="py-2 px-2.5 font-semibold">ঠিকানা</th>
                            <th className="py-2 px-2.5 font-semibold">সোর্স</th>
                            <th className="py-2 px-2.5 font-semibold">মূল্য</th>
                            <th className="py-2 px-2.5 font-semibold">স্ট্যাটাস</th>
                            <th className="py-2 px-2.5 font-semibold">তারিখ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#181f2f]">
                          {relatedDateOrders.slice(0, 15).map((o, oIdx) => (
                            <tr key={oIdx} className="hover:bg-[#131722] transition-colors">
                              <td className="py-2 px-2.5 font-mono text-pink-400 font-bold">
                                #{o.id}
                              </td>
                              <td className="py-2 px-2.5 font-medium text-white">
                                {o.customerName}
                              </td>
                              <td className="py-2 px-2.5 text-gray-300 font-mono text-[11px]">
                                {o.customerPhone || '—'}
                              </td>
                              <td className="py-2 px-2.5 text-gray-400 truncate max-w-[130px] text-[11px]">
                                {o.customerAddress || '—'}
                              </td>
                              <td className="py-2 px-2.5 text-gray-300 font-semibold text-[11px]">
                                {o.source}
                              </td>
                              <td className="py-2 px-2.5 text-emerald-400 font-mono font-semibold">
                                ৳{o.amount || o.total}
                              </td>
                              <td className="py-2 px-2.5">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                  {o.status}
                                </span>
                              </td>
                              <td className="py-2 px-2.5 text-[10px] text-gray-400 font-mono">
                                {o.date || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Bottom Back Button */}
                <div className="flex justify-center pt-1">
                  <button
                    onClick={() => setSelectedDetailProductId(null)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1a2133] hover:bg-pink-600 border border-[#27324c] hover:border-pink-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>← সব প্রোডাক্টের তালিকায় ফিরে যান</span>
                  </button>
                </div>
              </div>
            );
          })()
        ) : (
          /* ========================================================
             PRODUCT CARDS LIST (৭টি চিকন বক্স সহ স্লিম ও কমপ্যাক্ট কার্ড)
             ======================================================== */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <Package className="w-4 h-4 text-purple-400" />
                প্রোডাক্ট ভিত্তিক আলাদা কার্ড বক্স ({filteredProducts.length} টি)
              </h3>
              <span className="text-[11px] text-pink-400 font-medium hidden sm:inline-block">
                💡 যে কোনো কার্ডে ক্লিক করলে সোর্স ডাটা পেজ দেখতে পাবেন
              </span>
            </div>

            {loading ? (
              <div className="bg-[#12151f] border border-[#1e2436] rounded-xl p-10 text-center">
                <RefreshCw className="w-7 h-7 text-purple-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-300 font-medium">প্রোডাক্ট ও শিট রিপোর্ট ডাটা লোড হচ্ছে...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-[#12151f] border border-[#1e2436] rounded-xl p-6 text-center text-gray-400 text-xs">
                কোনো প্রোডাক্ট পাওয়া যায়নি।
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {filteredProducts.map((prod) => {
                  const { prodStats } = getProductAnalytics(prod);

                  return (
                    <div
                      key={prod.id}
                      onClick={() => setSelectedDetailProductId(prod.id)}
                      className="bg-[#12151f] border border-[#1e2436] hover:border-pink-500/60 rounded-xl p-2.5 sm:p-3 transition-all shadow-md hover:shadow-xl hover:shadow-pink-500/10 cursor-pointer group space-y-2"
                    >
                      {/* কার্ড হেডার: মিনিমাল ও কমপ্যাক্ট, কোনো ছোট বাটন ছাড়া */}
                      <div className="flex items-center justify-between gap-2 border-b border-[#1c2232] pb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-600/20 via-purple-600/20 to-blue-600/20 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold text-xs shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform">
                            {prod.productName.slice(0, 2).toUpperCase()}
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight group-hover:text-pink-300 transition-colors truncate">
                            {prod.productName}
                          </h4>
                          <span className="text-[10px] text-gray-400 hidden sm:inline-block font-mono">
                            • {getDateFilterLabel()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[11px] font-semibold group-hover:bg-pink-500 group-hover:text-white transition-all flex-shrink-0">
                          <span>সোর্স ডাটা</span>
                          <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>

                      {/* কার্ডের ৭টি চিকন ডাটা বক্স (Order Lead | Confirm | Delivery | Pending | Partial | Quantity | Cancel) */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 sm:gap-2">
                        {/* 1. Order Lead */}
                        <div className="bg-[#141824] border border-[#20283c] group-hover:border-purple-500/30 rounded-lg py-1 px-1.5 text-center flex flex-col justify-center transition-all min-h-[42px]">
                          <span className="text-[10px] text-gray-400 font-medium block truncate">Order Lead</span>
                          <span className="text-xs sm:text-[13px] font-bold text-white mt-0.5 font-mono">
                            {prodStats.lead}
                          </span>
                        </div>

                        {/* 2. Confirm */}
                        <div className="bg-[#141824] border border-[#20283c] group-hover:border-pink-500/30 rounded-lg py-1 px-1.5 text-center flex flex-col justify-center transition-all min-h-[42px]">
                          <span className="text-[10px] text-gray-400 font-medium block truncate">Confirm</span>
                          <span className="text-xs sm:text-[13px] font-bold text-pink-400 mt-0.5 font-mono whitespace-nowrap">
                            {prodStats.confirm} <span className="text-[10px] font-normal text-pink-300/80">({cleanRate(prodStats.confirmRate)})</span>
                          </span>
                        </div>

                        {/* 3. Delivery */}
                        <div className="bg-[#141824] border border-[#20283c] group-hover:border-emerald-500/30 rounded-lg py-1 px-1.5 text-center flex flex-col justify-center transition-all min-h-[42px]">
                          <span className="text-[10px] text-gray-400 font-medium block truncate">Delivery</span>
                          <span className="text-xs sm:text-[13px] font-bold text-emerald-400 mt-0.5 font-mono whitespace-nowrap">
                            {prodStats.delivery} <span className="text-[10px] font-normal text-emerald-300/80">({cleanRate(prodStats.deliveryRate)})</span>
                          </span>
                        </div>

                        {/* 4. Pending */}
                        <div className="bg-[#141824] border border-[#20283c] group-hover:border-amber-500/30 rounded-lg py-1 px-1.5 text-center flex flex-col justify-center transition-all min-h-[42px]">
                          <span className="text-[10px] text-gray-400 font-medium block truncate">Pending</span>
                          <span className="text-xs sm:text-[13px] font-bold text-amber-400 mt-0.5 font-mono whitespace-nowrap">
                            {prodStats.pending} <span className="text-[10px] font-normal text-amber-300/80">({cleanRate(prodStats.pendingRate)})</span>
                          </span>
                        </div>

                        {/* 5. Partial */}
                        <div className="bg-[#141824] border border-[#20283c] group-hover:border-orange-500/30 rounded-lg py-1 px-1.5 text-center flex flex-col justify-center transition-all min-h-[42px]">
                          <span className="text-[10px] text-gray-400 font-medium block truncate">Partial</span>
                          <span className="text-xs sm:text-[13px] font-bold text-orange-400 mt-0.5 font-mono whitespace-nowrap">
                            {prodStats.partial} <span className="text-[10px] font-normal text-orange-300/80">({cleanRate(prodStats.partialRate)})</span>
                          </span>
                        </div>

                        {/* 6. Quantity */}
                        <div className="bg-[#141824] border border-[#20283c] group-hover:border-cyan-500/30 rounded-lg py-1 px-1.5 text-center flex flex-col justify-center transition-all min-h-[42px]">
                          <span className="text-[10px] text-gray-400 font-medium block truncate">Quantity</span>
                          <span className="text-xs sm:text-[13px] font-bold text-cyan-300 mt-0.5 font-mono">
                            {prodStats.quantity}
                          </span>
                        </div>

                        {/* 7. Cancel */}
                        <div className="bg-[#141824] border border-[#20283c] group-hover:border-rose-500/30 rounded-lg py-1 px-1.5 text-center flex flex-col justify-center transition-all min-h-[42px]">
                          <span className="text-[10px] text-gray-400 font-medium block truncate">Cancel</span>
                          <span className="text-xs sm:text-[13px] font-bold text-rose-400 mt-0.5 font-mono whitespace-nowrap">
                            {prodStats.cancel} <span className="text-[10px] font-normal text-rose-300/80">({cleanRate(prodStats.cancelRate)})</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}

      {/* Main Tab View 2: Sales Source Analytics & Comparison Chart */}
      {activeTab === 'sources' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Source Matrix */}
          <div className="lg:col-span-7 bg-[#12151f] border border-[#1e2436] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500" />
                সেলস সোর্স অনুযায়ী সামগ্রিক পারফরম্যান্স
              </h3>
              <span className="text-xs text-gray-400">Sheet 1 থেকে চ্যানেল পরিসংখ্যান</span>
            </div>

            <div className="space-y-3">
              {sourceAnalytics.map((src, i) => (
                <div
                  key={i}
                  className="bg-[#0e1119] border border-[#1e2436] rounded-xl p-3.5 hover:border-[#2d3852] transition-all"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: src.color }}
                      />
                      <span className="text-xs font-bold text-white">{src.name}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-[#171c2a] text-pink-300 border border-pink-500/20 font-mono">
                        {src.percentage}% শেয়ার
                      </span>
                    </div>
                    <div className="text-xs font-bold text-gray-200">
                      লিড: <strong className="text-white">{src.lead}</strong> টি
                    </div>
                  </div>

                  {/* Metrics Bar for this source */}
                  <div className="grid grid-cols-4 gap-2 text-[11px] text-gray-400 pt-2 border-t border-[#181d2c]">
                    <div>
                      কনফার্ম:{' '}
                      <span className="text-purple-300 font-bold">{src.confirm}</span>
                    </div>
                    <div>
                      ডেলিভারি:{' '}
                      <span className="text-emerald-400 font-bold">{src.delivery}</span>
                    </div>
                    <div>
                      কোয়ান্টিটি:{' '}
                      <span className="text-blue-300 font-bold">{src.quantity}</span>
                    </div>
                    <div>
                      ক্যান্সেল:{' '}
                      <span className="text-rose-400 font-bold">{src.cancel}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: SVG Donut Chart for Sources */}
          <div className="lg:col-span-5 bg-[#12151f] border border-[#1e2436] rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                সোর্স শেয়ার পাই-চার্ট (Sheet 1)
              </h3>

              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-44 h-44">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="38"
                      stroke="#1a2030"
                      strokeWidth="14"
                      fill="transparent"
                    />
                    {(() => {
                      let accumulatedPercent = 0;
                      return sourceAnalytics.map((s, idx) => {
                        const dashLength = s.percentage * 2.387;
                        const dashOffset = -(accumulatedPercent * 2.387);
                        accumulatedPercent += s.percentage;
                        return (
                          <circle
                            key={idx}
                            cx="50"
                            cy="50"
                            r="38"
                            stroke={s.color}
                            strokeWidth="14"
                            strokeDasharray={`${dashLength} 300`}
                            strokeDashoffset={`${dashOffset}`}
                            fill="transparent"
                            className="transition-all duration-1000"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-white">
                      {aggregatedStats.totalLead}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">মোট লিড</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Donut Legend */}
            <div className="space-y-2 pt-4 border-t border-[#1c2232] text-xs">
              {sourceAnalytics.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-gray-300">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-mono text-gray-400">
                    {item.percentage}% ({item.lead} টি)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Tab View 3: Customer Analytics Table */}
      {activeTab === 'customers' && (
        <div className="bg-[#12151f] border border-[#1e2436] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              কাস্টমার এনালিটিক্স (Sheet 2 Live Data)
            </h3>
            <span className="text-xs text-gray-400">টপ রিপিট কাস্টমার তালিকা</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#1c2232] text-xs text-gray-400 font-semibold">
                  <th className="py-2.5 px-4">
                    কাস্টমার নাম
                    <br />
                    <span className="text-[10px] text-gray-600 font-normal">Customer Name</span>
                  </th>
                  <th className="py-2.5 px-4">
                    ফোন নম্বর
                    <br />
                    <span className="text-[10px] text-gray-600 font-normal">Phone</span>
                  </th>
                  <th className="py-2.5 px-4">
                    মোট অর্ডার
                    <br />
                    <span className="text-[10px] text-gray-600 font-normal">Total Orders</span>
                  </th>
                  <th className="py-2.5 px-4">
                    গড় অর্ডার মূল্য
                    <br />
                    <span className="text-[10px] text-gray-600 font-normal">Avg. Order Value</span>
                  </th>
                  <th className="py-2.5 px-4">
                    ঠিকানা
                    <br />
                    <span className="text-[10px] text-gray-600 font-normal">Address</span>
                  </th>
                  <th className="py-2.5 px-4 text-right">
                    স্ট্যাটাস
                    <br />
                    <span className="text-[10px] text-gray-600 font-normal">Status</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#171b26]">
                {derivedCustomerAnalytics.map((c, idx) => (
                  <tr key={idx} className="hover:bg-[#161a26] transition-colors">
                    <td className="py-3 px-4 font-semibold text-gray-200 text-xs">{c.name}</td>
                    <td className="py-3 px-4 text-pink-300 font-mono text-xs">{c.phone || '—'}</td>
                    <td className="py-3 px-4 text-gray-300 text-xs font-bold">
                      {c.totalOrders} টি
                    </td>
                    <td className="py-3 px-4 text-gray-300 font-mono text-xs">
                      ৳{c.avgOrderValue}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs truncate max-w-[160px]">
                      {c.address || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
