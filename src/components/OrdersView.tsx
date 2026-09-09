import React, { useState, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Check,
  RefreshCw,
  Package,
  Truck,
  Copy,
  Plus,
} from 'lucide-react';
import { Order, OrderStatus } from '../types';

interface OrdersViewProps {
  orders: Order[];
  onOpenNewOrder: () => void;
  onSyncSheet: () => void;
  isSyncing: boolean;
  onSelectOrder: (order: Order) => void;
  onUpdateOrderStatus: (order: Order, newStatus: OrderStatus) => void;
  onUpdateVariant?: (order: Order, newVariant: string) => void;
  onUpdateSource?: (order: Order, newSource: string) => void;
  onUpdateQuantity?: (order: Order, newQuantity: number) => void;
  onUpdateCourierStatus?: (order: Order, newCourierStatus: string) => void;
  onToggleSteadfast: (order: Order, action: 'No Sellect' | 'send to steadfast') => Promise<boolean> | void;
  onDeleteOrder?: (order: Order) => void;
}

type DropdownType = 'variant' | 'source' | 'status' | 'steadfast';

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  onOpenNewOrder,
  onSyncSheet,
  isSyncing,
  onSelectOrder,
  onUpdateOrderStatus,
  onUpdateVariant,
  onUpdateSource,
  onUpdateQuantity,
  onToggleSteadfast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'All' | 'Processing' | 'Completed' | 'On hold' | 'Cancelled' | 'Pending'>('All');
  
  // Isolated dropdown state: only ONE dropdown on ONE card can be open at a time!
  const [activeDropdown, setActiveDropdown] = useState<{
    orderKey: string;
    type: DropdownType;
  } | null>(null);

  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);
  const [isDispatchingKey, setIsDispatchingKey] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveDropdown(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Generate unique order key so actions NEVER collide
  const getOrderKey = (order: Order, index: number): string => {
    if (order.rowIndex !== undefined && order.rowIndex !== null) {
      return `row-${order.rowIndex}`;
    }
    return `order-${order.id}-${index}`;
  };

  // Toggle 1: Variant (Column H) Styles
  const getVariantStyle = (variant?: string) => {
    const v = (variant || '').toLowerCase();
    if (v.includes('rose 1350') || v.includes('1350')) {
      return 'bg-[#4a1d24] text-[#fca5a5] border-[#882d36]';
    }
    if (v.includes('rose 990') || v.includes('990')) {
      return 'bg-[#3b1828] text-[#f472b6] border-[#6b2345]';
    }
    if (v.includes('rose')) {
      return 'bg-[#40171a] text-[#fca5a5] border-[#742329]';
    }
    if (v.includes('doll') || v.includes('toy')) {
      return 'bg-[#3b2712] text-[#fde047] border-[#664319]';
    }
    if (v.includes('watch 599') || v.includes('watch')) {
      return 'bg-[#3b2d10] text-[#fef08a] border-[#664d17]';
    }
    if (v.includes('cutting') || v.includes('dispancer')) {
      return 'bg-[#153434] text-[#5eead4] border-[#1d5b5b]';
    }
    if (v.includes('golden') || v.includes('combo')) {
      return 'bg-[#221c38] text-[#d8b4fe] border-[#44366e]';
    }
    // "No Sellect" or default
    return 'bg-[#181922] text-gray-400 border-[#2b2d3d]';
  };

  // Toggle 2: Source (Column I) Styles
  const getSourceStyle = (source?: string) => {
    const s = (source || '').toLowerCase();
    if (s.includes('what') || s.includes('হোয়াটসঅ্যাপ')) {
      return 'bg-[#064e3b] text-[#6ee7b7] border-[#047857]';
    }
    if (s.includes('call') || s.includes('phone') || s.includes('ডিরেক্ট')) {
      return 'bg-[#3d2410] text-[#fdba74] border-[#683c16]';
    }
    if (s.includes('mess') || s.includes('মেসেঞ্জার')) {
      return 'bg-[#132d4a] text-[#7dd3fc] border-[#0369a1]';
    }
    if (s.includes('tik') || s.includes('টিকটক')) {
      return 'bg-[#3b1227] text-[#fb7185] border-[#9f1239]';
    }
    if (s.includes('you') || s.includes('ইউটিউব')) {
      return 'bg-[#450a0a] text-[#fca5a5] border-[#991b1b]';
    }
    if (s.includes('incom') || s.includes('ইনকমপ্লিট')) {
      return 'bg-[#3a2211] text-[#fcd34d] border-[#78350f]';
    }
    if (s.includes('fb') || s.includes('facebook')) {
      return 'bg-[#3b172a] text-[#f472b6] border-[#662447]';
    }
    if (s.includes('pend') || s.includes('পেন্ডিং')) {
      return 'bg-[#1e293b] text-[#cbd5e1] border-[#334155]';
    }
    // "Website" or default
    return 'bg-[#152544] text-[#93c5fd] border-[#1e3d70]';
  };

  // Toggle 3: Status (Column J) Styles matching Google Sheet colors
  const getStatusBadgeStyle = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('comp') || s.includes('deliv') || s.includes('ডেলিভার্ড')) {
      return {
        label: status || 'Complete',
        badge: 'bg-[#1e3a8a] text-[#bfdbfe] border-[#2563eb]',
        dot: 'bg-[#60a5fa]',
      };
    }
    if (s.includes('proc') || s.includes('প্রসেসিং')) {
      return {
        label: status || 'Procecing',
        badge: 'bg-[#064e3b] text-[#34d399] border-[#059669]',
        dot: 'bg-[#34d399]',
      };
    }
    if (s.includes('hold') || s.includes('হোল্ড')) {
      return {
        label: status || 'Hold',
        badge: 'bg-[#3f2911] text-[#fbbf24] border-[#6b471d]',
        dot: 'bg-[#fbbf24]',
      };
    }
    if (s.includes('cancel') || s.includes('বাতিল') || s.includes('ক্যান্সেল')) {
      return {
        label: status || 'Cancel',
        badge: 'bg-[#451014] text-[#f87171] border-[#782329]',
        dot: 'bg-[#f87171]',
      };
    }
    if (s.includes('review') || s.includes('রিভিউ')) {
      return {
        label: status || 'In Review',
        badge: 'bg-[#1e1b4b] text-[#c7d2fe] border-[#4338ca]',
        dot: 'bg-[#818cf8]',
      };
    }
    if (s.includes('part') || s.includes('আংশিক')) {
      return {
        label: status || 'Partial',
        badge: 'bg-[#134e4a] text-[#5eead4] border-[#0f766e]',
        dot: 'bg-[#2dd4bf]',
      };
    }
    return {
      label: status || 'Pending',
      badge: 'bg-[#35270f] text-[#fde047] border-[#594215]',
      dot: 'bg-[#fde047]',
    };
  };

  // Delivery / Courier Status options
  const availableDeliveryStatuses = [
    'in_review',
    'pending',
    'delivered',
    'cancelled',
    'partial_delivered',
  ];

  // Delivery / Courier Status Styles with distinct color combinations
  const getDeliveryStatusStyle = (status?: string, hasTracking?: boolean) => {
    const raw = (status && status.trim() !== '' ? status : (hasTracking ? 'in_review' : 'pending')).toLowerCase().trim();

    if (raw.includes('review') || raw.includes('in_review') || raw.includes('রিভিউ')) {
      return {
        key: 'in_review',
        label: 'in_review',
        badge: 'bg-[#0f1e36] hover:bg-[#152a4d] text-[#60a5fa] border-[#2563eb]/50 shadow-xs shadow-blue-950/40',
        dot: 'bg-[#3b82f6]',
      };
    }
    if (raw.includes('pend') || raw.includes('পেন্ডিং')) {
      return {
        key: 'pending',
        label: 'pending',
        badge: 'bg-[#291e0a] hover:bg-[#382a0e] text-[#fbbf24] border-[#d97706]/50 shadow-xs shadow-amber-950/40',
        dot: 'bg-[#f59e0b]',
      };
    }
    if (raw.includes('deliv') || raw.includes('ডেলিভারি') || raw.includes('ডেলিভার্ড')) {
      return {
        key: 'delivered',
        label: 'delivered',
        badge: 'bg-[#0a2618] hover:bg-[#0f3522] text-[#34d399] border-[#059669]/50 shadow-xs shadow-emerald-950/40',
        dot: 'bg-[#10b981]',
      };
    }
    if (raw.includes('cancel') || raw.includes('বাতিল') || raw.includes('ক্যান্সেল')) {
      return {
        key: 'cancelled',
        label: 'cancelled',
        badge: 'bg-[#2b0f14] hover:bg-[#3a151b] text-[#f87171] border-[#e11d48]/50 shadow-xs shadow-rose-950/40',
        dot: 'bg-[#ef4444]',
      };
    }
    if (raw.includes('part') || raw.includes('আংশিক')) {
      return {
        key: 'partial_delivered',
        label: 'partial_delivered',
        badge: 'bg-[#0a2624] hover:bg-[#0e3532] text-[#2dd4bf] border-[#0d9488]/50 shadow-xs shadow-teal-950/40',
        dot: 'bg-[#14b8a6]',
      };
    }
    return {
      key: raw || 'pending',
      label: status || 'pending',
      badge: 'bg-[#181a24] hover:bg-[#202330] text-gray-300 border-[#2d3042]',
      dot: 'bg-gray-400',
    };
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchName = order.customerName.toLowerCase().includes(q);
      const matchPhone = (order.customerPhone || '').toLowerCase().includes(q);
      const matchId = order.id.toLowerCase().includes(q);
      const matchProd = (order.product || '').toLowerCase().includes(q);
      const matchVariant = (order.variant || '').toLowerCase().includes(q);
      const matchAddr = (order.customerAddress || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchId && !matchProd && !matchVariant && !matchAddr) {
        return false;
      }
    }

    const s = order.status.toLowerCase();
    if (activeFilter === 'Processing') {
      return s.includes('proc');
    }
    if (activeFilter === 'Completed') {
      return s.includes('comp') || s.includes('deliv');
    }
    if (activeFilter === 'On hold') {
      return s.includes('hold');
    }
    if (activeFilter === 'Cancelled') {
      return s.includes('cancel');
    }
    if (activeFilter === 'Pending') {
      return s.includes('pend');
    }
    return true;
  });

  // 1. Column H (Variant) options - verified from Google Sheet (Col H & sheet analytics columns)
  const sheetVariants = [
    'No Sellect',
    'Rose 599tk',
    'Doll and toys',
    'Watch 599tk',
    'Porbash Rose 990tk',
    'Porbash Rose 1350tk',
    'Cutting Dispancer',
    'Golden Watch Combo',
  ];

  // Dynamic connection to Google Sheet orders data for Variants
  const availableVariants = Array.from(
    new Set([
      ...sheetVariants,
      ...orders
        .map((o) => (o.variant || '').trim())
        .filter((v) => v && v !== '' && !/^\d{8,}$/.test(v)),
    ])
  );

  // 2. Column I (Source) options - verified from Google Sheet (Col I & lead formulas)
  const sheetSources = [
    'Website',
    'Whatsapp',
    'Call Direct',
    'Messenger',
    'Tiktok',
    'Youtube',
    'FB Ads',
    'incomplete',
    'Pending',
  ];

  // Dynamic connection to Google Sheet orders data for Sources
  const availableSources = Array.from(
    new Set([
      ...sheetSources,
      ...orders
        .map((o) => (o.source || '').trim())
        .filter((s) => s && s !== '' && !/^\d+$/.test(s)),
    ])
  );

  // 3. Column J (Status) options - verified from Google Sheet (Col J: Sheet1 & Sheet2)
  const sheetStatuses: OrderStatus[] = [
    'Procecing',
    'Hold',
    'Complete',
    'Cancel',
    'Cancelled',
    'Pending',
    'In Review',
    'Partial',
    'Delivered',
  ];

  // Dynamic connection to Google Sheet orders data for Statuses
  const availableStatuses = Array.from(
    new Set([
      ...sheetStatuses,
      ...orders
        .map((o) => (o.status || '').trim())
        .filter((st) => st && st !== ''),
    ])
  ) as OrderStatus[];

  const handleCopyTracking = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedTracking(code);
    setTimeout(() => setCopiedTracking(null), 2000);
  };

  const handleSteadfastAction = async (e: React.MouseEvent, order: Order, action: 'No Sellect' | 'send to steadfast', orderKey: string) => {
    e.stopPropagation();
    setActiveDropdown(null);
    setIsDispatchingKey(orderKey);
    try {
      await onToggleSteadfast(order, action);
    } finally {
      setIsDispatchingKey(null);
    }
  };

  const toggleDropdown = (e: React.MouseEvent, orderKey: string, type: DropdownType) => {
    e.stopPropagation();
    if (activeDropdown?.orderKey === orderKey && activeDropdown?.type === type) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown({ orderKey, type });
    }
  };

  return (
    <div className="space-y-3.5 animate-fadeIn pb-28 sm:pb-20 max-w-4xl mx-auto font-sans">
      {/* WooCommerce Top Header */}
      <div className="bg-[#141419] border-b border-[#24242c] -mx-3 sm:-mx-6 -mt-3 sm:-mt-6 px-4 sm:px-6 py-3.5 sticky top-0 z-20 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Orders
          </h1>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-1.5 text-gray-300 hover:text-white transition-colors"
              title="Search orders"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={onSyncSheet}
              disabled={isSyncing}
              className="p-1.5 text-gray-300 hover:text-white transition-colors"
              title="Sync Google Sheet"
            >
              {isSyncing ? (
                <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onOpenNewOrder}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8a4af3] hover:bg-[#9d66f7] text-white text-xs font-semibold shadow"
            >
              <Plus className="w-4 h-4" />
              <span>New Order</span>
            </button>
          </div>
        </div>

        {/* Collapsible Search Bar */}
        {isSearchOpen && (
          <div className="mt-3 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by #order, name, phone, product, variant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full bg-[#1b1b22] border border-[#2f2f3a] rounded-lg pl-9 pr-8 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Sub Header: Filter Label + Count */}
        <div className="mt-2.5 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-100 flex items-center gap-1.5">
              <span>{activeFilter === 'All' ? 'All orders' : activeFilter}</span>
              <span className="text-xs text-gray-400 font-mono">({filteredOrders.length})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilter('All')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#202028] hover:bg-[#282834] text-xs font-medium text-gray-300 border border-[#323240] transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Top Status Tabs */}
        <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {(['All', 'Processing', 'Completed', 'On hold', 'Cancelled', 'Pending'] as const).map((filter) => {
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#152e35] text-[#7de3e0] border border-[#235863] shadow-sm'
                    : 'bg-[#1c1c24] text-gray-400 hover:text-gray-200 border border-transparent'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List: Sleek, compact cards for Each Order */}
      <div className="space-y-1.5 sm:space-y-2">
        {filteredOrders.length === 0 ? (
          <div className="py-16 px-4 text-center bg-[#141418] rounded-xl border border-[#23242c]">
            <Package className="w-10 h-10 text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-300">কোনো অর্ডার পাওয়া যায়নি</p>
            <p className="text-xs text-gray-500 mt-1">
              {searchQuery ? 'ভিন্ন শব্দ দিয়ে খুঁজুন' : 'নতুন অর্ডার তৈরি করতে নিচে চাপুন'}
            </p>
          </div>
        ) : (
          filteredOrders.map((order, index) => {
            const orderKey = getOrderKey(order, index);
            const statusStyle = getStatusBadgeStyle(order.status);
            const displayAmount = order.total || order.amount || 599;

            return (
              <div
                key={orderKey}
                onClick={() => onSelectOrder(order)}
                className="bg-[#141419] hover:bg-[#181822] active:bg-[#1c1c28] border border-[#232430] hover:border-[#383a4c] rounded-xl p-3 sm:px-4 sm:py-3 shadow-xs transition-all cursor-pointer select-none group relative"
              >
                {/* Line 1: Order # & Row # on Left, Status Button (Col J) on Right */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs font-mono font-bold text-gray-400 group-hover:text-purple-400 shrink-0">
                      {order.id.startsWith('#') ? order.id : `#${order.id}`}
                    </span>
                    {order.rowIndex && (
                      <span className="text-[10px] text-gray-500 font-mono bg-[#1b1c24] px-1.5 py-0.5 rounded border border-[#262835] shrink-0">
                        Row #{order.rowIndex}
                      </span>
                    )}
                  </div>

                  {/* Status Button (Column J) */}
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={(e) => toggleDropdown(e, orderKey, 'status')}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${statusStyle.badge}`}
                      title="J: অর্ডার স্ট্যাটাস পরিবর্তন করুন"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      <span className="text-[10px] opacity-75 font-bold">J:</span>
                      <span>{statusStyle.label}</span>
                      <ChevronDown className="w-3 h-3 opacity-70 ml-0.5 shrink-0" />
                    </button>

                    {activeDropdown?.orderKey === orderKey && activeDropdown?.type === 'status' && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-1 w-44 max-h-60 overflow-y-auto bg-[#181822] border border-[#2f2f40] rounded-xl shadow-2xl py-1.5 z-50 animate-fadeIn"
                      >
                        <div className="px-3 py-1 text-[10px] text-gray-400 font-semibold border-b border-[#252535] sticky top-0 bg-[#181822] z-10">
                          J: স্ট্যাটাস সিলেক্ট করুন
                        </div>
                        {availableStatuses.map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateOrderStatus(order, st);
                              setActiveDropdown(null);
                            }}
                            className="w-full text-left px-3 py-2 text-xs text-gray-200 hover:bg-[#252535] flex items-center justify-between cursor-pointer"
                          >
                            <span>{st}</span>
                            {order.status === st && (
                              <Check className="w-3.5 h-3.5 text-[#7de3e0]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Line 2: Customer Name First, then Product Name on Left, Price on Right */}
                <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-400 font-medium flex-1 min-w-0 pr-2">
                    <span className="text-sm sm:text-base font-bold text-white tracking-tight truncate shrink-0 max-w-[150px] sm:max-w-[220px]">
                      {order.customerName || 'গ্রাহকের নাম নেই'}
                    </span>
                    <span className="text-gray-600 shrink-0">•</span>
                    <span className="truncate block">
                      {order.product || 'Golden Watch Combo'}
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-bold font-mono text-white tracking-tight">
                      {displayAmount}.00BDT
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
