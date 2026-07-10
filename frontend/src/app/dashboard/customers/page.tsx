"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  Eye,
  EyeOff,
  ShieldAlert,
  ChevronRight,
  Phone,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Bar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import ActivityTimeline from "@/components/ActivityTimeline";
import { useDebouncedValue } from "@/lib/hooks";
import {
  fetchRecentCustomers,
  searchCustomers,
  fetchCustomerProfile,
  type CustomerSummary,
  type CustomerProfile,
} from "@/lib/customers-api";
import {
  formatCurrency,
  formatDate,
  getRiskColor,
  getStatusColor,
  getTrustBadgeClass,
  maskPhone,
  DELIVERY_CHART_COLORS,
  CHART_COLORS,
} from "@/lib/dashboard-ui";

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-bg-raised border border-border-default rounded-lg p-4">
      <p className="text-2xl font-bold font-mono text-ink-primary">{value}</p>
      <p className="text-xs text-ink-secondary mt-1">{label}</p>
      {sub && <p className="text-[10px] text-ink-tertiary mt-0.5">{sub}</p>}
    </div>
  );
}

function CustomerListItem({
  customer,
  onSelect,
}: {
  customer: CustomerSummary;
  onSelect: (phone: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(customer.phone)}
      className="w-full flex items-center justify-between gap-4 px-4 py-3 bg-bg-raised border border-border-default rounded-lg hover:bg-bg-sunken transition-colors text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg border border-border-default bg-bg-base flex items-center justify-center shrink-0">
          <Phone className="w-4 h-4 text-ink-tertiary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink-primary truncate">{customer.displayName}</p>
          <p className="text-xs font-mono text-ink-secondary mt-0.5">{customer.phone}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-mono font-semibold text-ink-primary">{customer.trustScore}</p>
          <p className="text-[10px] text-ink-tertiary">{customer.orderCount} orders</p>
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getTrustBadgeClass(customer.trustLabel)}`}
        >
          {customer.trustLabel}
        </span>
        <ChevronRight className="w-4 h-4 text-ink-tertiary" />
      </div>
    </button>
  );
}

function CustomerProfileView({
  profile,
  onBack,
}: {
  profile: CustomerProfile;
  onBack: () => void;
}) {
  const [showPhone, setShowPhone] = useState(false);

  const pieData = profile.deliveryBreakdown.map((item) => ({
    ...item,
    color: DELIVERY_CHART_COLORS[item.name] || CHART_COLORS.inkSecondary,
  }));

  return (
    <motion.div
      key={profile.phone}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-ink-secondary hover:text-ink-primary transition-colors"
      >
        ← Back to search
      </button>

      {/* Profile header */}
      <div className="bg-bg-raised border border-border-default rounded-lg p-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-bold text-ink-primary">{profile.name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <p className="text-sm font-mono text-ink-primary">
                  {maskPhone(profile.phone, showPhone)}
                </p>
                <button
                  type="button"
                  onClick={() => setShowPhone(!showPhone)}
                  className="text-ink-tertiary hover:text-ink-primary"
                  aria-label={showPhone ? "Hide phone" : "Reveal phone"}
                >
                  {showPhone ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {profile.email && (
                <p className="text-sm text-ink-secondary mt-1">{profile.email}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2">
            <span className="text-xs text-ink-tertiary uppercase tracking-wider">
              Buyer Trust Score
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold font-mono text-ink-primary">
                {profile.trustScore}
              </span>
              <span className="text-sm text-ink-tertiary">/ 100</span>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getTrustBadgeClass(profile.trustLabel)}`}
            >
              {profile.trustLabel} trust
            </span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Past Orders" value={String(profile.stats.pastOrders)} />
        <StatCard
          label="Successful Deliveries"
          value={String(profile.stats.successfulDeliveries)}
          sub={`${profile.stats.successfulDeliveryPct}% of total`}
        />
        <StatCard
          label="RTO Count"
          value={String(profile.stats.rtoCount)}
          sub={`${profile.stats.rtoPct}% of total`}
        />
        <StatCard label="Fraud Flags" value={String(profile.stats.fraudFlags)} />
      </div>

      {/* Fraud flags */}
      {profile.fraudFlags.length > 0 && (
        <section className="bg-bg-raised border border-border-default rounded-lg p-5">
          <h3 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-ink-tertiary" />
            Fraud Flags
          </h3>
          <div className="space-y-4">
            {profile.fraudFlags.map((flag) => (
              <div key={flag.id} className="flex gap-3">
                <div className="mt-1">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: getRiskColor(flag.severity) }}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-ink-primary">{flag.type}</p>
                    <span className="text-xs text-ink-tertiary shrink-0">
                      {formatDate(flag.date)}
                    </span>
                  </div>
                  <span
                    className="inline-flex mt-2 items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: `${getRiskColor(flag.severity)}20`,
                      color: getRiskColor(flag.severity),
                      border: `1px solid ${getRiskColor(flag.severity)}40`,
                    }}
                  >
                    {flag.severity}
                  </span>
                  {flag.orderId && (
                    <Link
                      href={`/dashboard/orders/${flag.orderId}`}
                      className="block text-xs text-accent hover:text-accent/80 mt-2"
                    >
                      View order {flag.orderId}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-bg-raised border border-border-default rounded-lg p-5">
          <h3 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-4">
            Delivery Outcome Breakdown
          </h3>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-raised)",
                      border: "1px solid var(--border-default)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-ink-secondary">No delivery data available</p>
          )}
        </section>

        <section className="bg-bg-raised border border-border-default rounded-lg p-5">
          <h3 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-4">
            Order Volume & RTO Trend
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={profile.monthlyTrend}>
                <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--ink-tertiary)" }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "var(--ink-tertiary)" }} />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "var(--ink-tertiary)" }}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--bg-raised)",
                    border: "1px solid var(--border-default)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="orders"
                  name="Orders"
                  fill={CHART_COLORS.accent}
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="rtoRate"
                  name="RTO %"
                  stroke={CHART_COLORS.negative}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      {/* Timeline */}
      <section className="bg-bg-raised border border-border-default rounded-lg p-5">
        <h3 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-4">
          Activity Timeline
        </h3>
        <ActivityTimeline events={profile.timeline} />
      </section>

      {/* Past orders */}
      <section className="bg-bg-raised border border-border-default rounded-lg p-5">
        <h3 className="text-sm font-semibold text-ink-primary uppercase tracking-wider mb-4">
          Past Orders
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-default">
                <th className="text-left text-xs font-semibold text-ink-tertiary uppercase pb-2 pr-4">
                  Order ID
                </th>
                <th className="text-left text-xs font-semibold text-ink-tertiary uppercase pb-2 pr-4">
                  Date
                </th>
                <th className="text-left text-xs font-semibold text-ink-tertiary uppercase pb-2 pr-4">
                  Value
                </th>
                <th className="text-left text-xs font-semibold text-ink-tertiary uppercase pb-2">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {profile.pastOrders.map((order) => (
                <tr key={order.id} className="border-b border-border-subtle last:border-b-0">
                  <td className="py-2.5 pr-4">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-xs font-mono text-accent hover:text-accent/80"
                    >
                      {order.id}
                    </Link>
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-ink-primary">
                    {formatDate(order.date)}
                  </td>
                  <td className="py-2.5 pr-4 text-xs font-mono text-ink-primary">
                    {formatCurrency(order.value)}
                  </td>
                  <td className="py-2.5">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{
                        backgroundColor: `${getStatusColor(order.status)}20`,
                        color: getStatusColor(order.status),
                        border: `1px solid ${getStatusColor(order.status)}40`,
                      }}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </motion.div>
  );
}

export default function CustomersPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [recentCustomers, setRecentCustomers] = useState<CustomerSummary[]>([]);
  const [searchResults, setSearchResults] = useState<CustomerSummary[] | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<CustomerProfile | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const result = await fetchRecentCustomers();
        if (!active) return;
        if (result.success) {
          setRecentCustomers(result.customers);
        } else {
          setError(result.message || "Failed to load customers");
        }
      } catch {
        if (active) setError("Failed to load customers");
      } finally {
        if (active) setLoadingList(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setSelectedProfile(null);
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      setSearchResults(null);
      setSearchAttempted(false);
      setLoadingSearch(false);
    } else {
      setSearchAttempted(true);
      setLoadingSearch(true);
    }
  };

  useEffect(() => {
    const trimmed = debouncedQuery.replace(/\D/g, "");
    if (!trimmed) return;

    let active = true;
    (async () => {
      try {
        const result = await searchCustomers(trimmed);
        if (!active) return;
        setSearchResults(result.success ? result.customers : []);
      } catch {
        if (active) setSearchResults([]);
      } finally {
        if (active) setLoadingSearch(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [debouncedQuery]);

  const handleSelectCustomer = async (phone: string) => {
    setLoadingProfile(true);
    setError("");
    try {
      const result = await fetchCustomerProfile(phone);
      if (result.success && result.profile) {
        setSelectedProfile(result.profile);
        setQuery(phone);
      } else {
        setError(result.message || "Customer not found");
        setSelectedProfile(null);
      }
    } catch {
      setError("Failed to load customer profile");
      setSelectedProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleBack = () => {
    setSelectedProfile(null);
    handleQueryChange("");
  };

  const showDefaultList = !debouncedQuery.replace(/\D/g, "") && !selectedProfile;
  const listToShow = showDefaultList ? recentCustomers : searchResults ?? [];
  const isSearching = Boolean(debouncedQuery.replace(/\D/g, ""));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-default pb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg border border-accent/20 bg-accent-muted flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink-primary">Customer Intelligence</h1>
            <p className="text-sm text-ink-secondary mt-1">
              Look up COD buyers by phone number and review trust signals across their order history.
            </p>
          </div>
        </div>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
        <input
          type="tel"
          inputMode="numeric"
          placeholder="Search by phone number…"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-default bg-bg-base text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
      </div>

      {error && (
        <p className="text-sm text-negative border border-negative/20 bg-negative/5 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      <AnimatePresence mode="wait">
        {loadingProfile ? (
          <motion.div
            key="loading-profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-16 text-sm text-ink-secondary"
          >
            Loading customer profile…
          </motion.div>
        ) : selectedProfile ? (
          <CustomerProfileView profile={selectedProfile} onBack={handleBack} />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {showDefaultList && (
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink-primary">
                  Frequent & Recent Customers
                </h2>
                <span className="text-xs text-ink-tertiary">{recentCustomers.length} buyers</span>
              </div>
            )}

            {isSearching && loadingSearch && (
              <p className="text-sm text-ink-secondary py-8 text-center">Searching…</p>
            )}

            {isSearching && !loadingSearch && searchAttempted && listToShow.length === 0 && (
              <div className="border border-border-default bg-bg-raised rounded-lg p-8 text-center">
                <p className="text-sm font-medium text-ink-primary">No customers found</p>
                <p className="text-sm text-ink-secondary mt-2 max-w-md mx-auto">
                  No orders match that phone number. Check the format — use digits only, e.g.{" "}
                  <span className="font-mono">9876543210</span> without spaces or country code.
                </p>
              </div>
            )}

            {loadingList && showDefaultList ? (
              <p className="text-sm text-ink-secondary py-8 text-center">Loading customers…</p>
            ) : (
              <div className="space-y-2">
                {listToShow.map((customer) => (
                  <CustomerListItem
                    key={customer.phone}
                    customer={customer}
                    onSelect={handleSelectCustomer}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
