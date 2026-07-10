"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckSquare,
  Square,
  X,
  MoreHorizontal,
  Eye,
  Check,
  AlertTriangle,
  XCircle,
  Filter,
  Calendar,
  ArrowUpDown,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Type Definitions ---

type OrderStatus = "Pending" | "Verified" | "Shipped" | "Delivered" | "RTO" | "Cancelled";
type RiskLevel = "Low" | "Medium" | "High";

interface Order {
  id: string;
  customerName: string;
  phone: string;
  pincode: string;
  value: number;
  riskScore: number;
  status: OrderStatus;
  orderDate: string;
  riskFactors: string[];
  otpVerified: boolean;
  timeline: { date: string; status: string; description: string }[];
}

// --- Sample Data ---
const sampleOrders: Order[] = [
  {
    id: "COD-8342",
    customerName: "Rahul Sharma",
    phone: "+91 9876543210",
    pincode: "110001",
    value: 2499,
    riskScore: 12,
    status: "Delivered",
    orderDate: "2025-07-09T10:30:00Z",
    riskFactors: ["Low RTO history", "Pincode low risk", "Verified phone"],
    otpVerified: true,
    timeline: [
      { date: "2025-07-05", status: "Order Placed", description: "Order received from customer" },
      { date: "2025-07-06", status: "Verified", description: "OTP verified successfully" },
      { date: "2025-07-07", status: "Shipped", description: "Dispatched to logistics" },
      { date: "2025-07-09", status: "Delivered", description: "Delivered to customer" },
    ],
  },
  {
    id: "COD-8341",
    customerName: "Priya Mehta",
    phone: "+91 8765432109",
    pincode: "400001",
    value: 5999,
    riskScore: 68,
    status: "Shipped",
    orderDate: "2025-07-08T14:15:00Z",
    riskFactors: ["High order value", "Pincode medium risk"],
    otpVerified: false,
    timeline: [
      { date: "2025-07-06", status: "Order Placed", description: "Order received from customer" },
      { date: "2025-07-08", status: "Shipped", description: "Dispatched to logistics" },
    ],
  },
  {
    id: "COD-8340",
    customerName: "Amit Patel",
    phone: "+91 7654321098",
    pincode: "560001",
    value: 1299,
    riskScore: 45,
    status: "Pending",
    orderDate: "2025-07-10T09:45:00Z",
    riskFactors: ["Pincode medium risk"],
    otpVerified: false,
    timeline: [
      { date: "2025-07-10", status: "Order Placed", description: "Order received from customer" },
    ],
  },
  {
    id: "COD-8339",
    customerName: "Neha Singh",
    phone: "+91 9988776655",
    pincode: "600001",
    value: 3499,
    riskScore: 89,
    status: "RTO",
    orderDate: "2025-06-28T11:20:00Z",
    riskFactors: ["High RTO history", "Pincode high risk"],
    otpVerified: false,
    timeline: [
      { date: "2025-06-28", status: "Order Placed", description: "Order received from customer" },
      { date: "2025-06-30", status: "Shipped", description: "Dispatched to logistics" },
      { date: "2025-07-05", status: "RTO", description: "Returned to origin" },
    ],
  },
  {
    id: "COD-8338",
    customerName: "Rohit Verma",
    phone: "+91 9123456789",
    pincode: "700001",
    value: 899,
    riskScore: 5,
    status: "Verified",
    orderDate: "2025-07-09T16:00:00Z",
    riskFactors: ["Low RTO history", "Verified phone"],
    otpVerified: true,
    timeline: [
      { date: "2025-07-09", status: "Order Placed", description: "Order received from customer" },
      { date: "2025-07-09", status: "Verified", description: "OTP verified successfully" },
    ],
  },
  {
    id: "COD-8337",
    customerName: "Sneha Gupta",
    phone: "+91 8800112233",
    pincode: "201301",
    value: 7999,
    riskScore: 95,
    status: "Cancelled",
    orderDate: "2025-06-25T13:00:00Z",
    riskFactors: ["High RTO history", "High order value", "Pincode high risk"],
    otpVerified: false,
    timeline: [
      { date: "2025-06-25", status: "Order Placed", description: "Order received from customer" },
      { date: "2025-06-26", status: "Cancelled", description: "Order cancelled by customer" },
    ],
  },
  {
    id: "COD-8336",
    customerName: "Vikram Yadav",
    phone: "+91 9966554433",
    pincode: "500001",
    value: 1999,
    riskScore: 22,
    status: "Delivered",
    orderDate: "2025-07-03T10:00:00Z",
    riskFactors: ["Low RTO history"],
    otpVerified: true,
    timeline: [
      { date: "2025-07-03", status: "Order Placed", description: "Order received from customer" },
      { date: "2025-07-03", status: "Verified", description: "OTP verified successfully" },
      { date: "2025-07-04", status: "Shipped", description: "Dispatched to logistics" },
      { date: "2025-07-06", status: "Delivered", description: "Delivered to customer" },
    ],
  },
  {
    id: "COD-8335",
    customerName: "Ritu Jain",
    phone: "+91 9432109876",
    pincode: "302001",
    value: 4599,
    riskScore: 55,
    status: "Shipped",
    orderDate: "2025-07-07T15:30:00Z",
    riskFactors: ["Pincode medium risk"],
    otpVerified: true,
    timeline: [
      { date: "2025-07-07", status: "Order Placed", description: "Order received from customer" },
      { date: "2025-07-07", status: "Verified", description: "OTP verified successfully" },
      { date: "2025-07-08", status: "Shipped", description: "Dispatched to logistics" },
    ],
  },
];

// --- Helper Functions ---

const getRiskLevel = (score: number): RiskLevel => {
  if (score <= 30) return "Low";
  if (score <= 70) return "Medium";
  return "High";
};

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case "Verified":
    case "Delivered":
      return "var(--positive)";
    case "Pending":
    case "Shipped":
      return "var(--warning)";
    case "RTO":
    case "Cancelled":
      return "var(--negative)";
    default:
      return "var(--ink-secondary)";
  }
};

const getRiskColor = (level: RiskLevel) => {
  switch (level) {
    case "Low":
      return "var(--positive)";
    case "Medium":
      return "var(--warning)";
    case "High":
      return "var(--negative)";
    default:
      return "var(--ink-secondary)";
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// --- Main Component ---

export default function OrdersPage() {
  // --- State ---
  const [data, setData] = useState<Order[]>(sampleOrders);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilters, setStatusFilters] = useState<OrderStatus[]>([]);
  const [riskFilters, setRiskFilters] = useState<RiskLevel[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // --- Filter Logic ---
  const filteredData = useMemo(() => {
    return data.filter((order) => {
      // Global search
      const matchesSearch =
        globalFilter === "" ||
        order.id.toLowerCase().includes(globalFilter.toLowerCase()) ||
        order.customerName.toLowerCase().includes(globalFilter.toLowerCase()) ||
        order.phone.toLowerCase().includes(globalFilter.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilters.length === 0 || statusFilters.includes(order.status);

      // Risk filter
      const riskLevel = getRiskLevel(order.riskScore);
      const matchesRisk =
        riskFilters.length === 0 || riskFilters.includes(riskLevel);

      // Date range filter
      let matchesDate = true;
      if (startDate && endDate) {
        const orderDate = new Date(order.orderDate);
        const start = new Date(startDate);
        const end = new Date(endDate);
        matchesDate = orderDate >= start && orderDate <= end;
      } else if (startDate) {
        const orderDate = new Date(order.orderDate);
        const start = new Date(startDate);
        matchesDate = orderDate >= start;
      } else if (endDate) {
        const orderDate = new Date(order.orderDate);
        const end = new Date(endDate);
        matchesDate = orderDate <= end;
      }

      return matchesSearch && matchesStatus && matchesRisk && matchesDate;
    });
  }, [data, globalFilter, statusFilters, riskFilters, startDate, endDate]);

  // --- Columns ---
  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <button
            onClick={() => table.toggleAllRowsSelected()}
            className="text-ink-tertiary hover:text-ink-primary"
          >
            {table.getIsAllRowsSelected() ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <button
            onClick={(e) => {
              e.stopPropagation();
              row.toggleSelected();
            }}
            className="text-ink-tertiary hover:text-ink-primary"
          >
            {row.getIsSelected() ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4" />
            )}
          </button>
        ),
        size: 40,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "id",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 text-xs font-semibold text-ink-tertiary uppercase"
          >
            Order ID
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => <span className="text-xs font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "customerName",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 text-xs font-semibold text-ink-tertiary uppercase"
          >
            Customer Name
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => <span className="text-xs font-medium">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "phone",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 text-xs font-semibold text-ink-tertiary uppercase hidden sm:table-cell"
          >
            Phone
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => (
          <span className="text-xs text-ink-secondary hidden sm:table-cell">
            {info.getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "pincode",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 text-xs font-semibold text-ink-tertiary uppercase"
          >
            Pincode
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => <span className="text-xs font-mono">{info.getValue() as string}</span>,
      },
      {
        accessorKey: "value",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 text-xs font-semibold text-ink-tertiary uppercase"
          >
            Order Value
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => (
          <span className="text-xs font-mono">{formatCurrency(info.getValue() as number)}</span>
        ),
      },
      {
        accessorKey: "riskScore",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 text-xs font-semibold text-ink-tertiary uppercase"
          >
            Risk Score
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => {
          const score = info.getValue() as number;
          const level = getRiskLevel(score);
          const color = getRiskColor(level);
          return (
            <div
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40` }}
            >
              {score} • {level}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 text-xs font-semibold text-ink-tertiary uppercase"
          >
            Status
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => {
          const status = info.getValue() as OrderStatus;
          const color = getStatusColor(status);
          return (
            <div
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40` }}
            >
              {status}
            </div>
          );
        },
      },
      {
        accessorKey: "orderDate",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 text-xs font-semibold text-ink-tertiary uppercase hidden md:table-cell"
          >
            Order Date
            <ArrowUpDown className="w-3 h-3" />
          </button>
        ),
        cell: (info) => (
          <span className="text-xs text-ink-secondary hidden md:table-cell">
            {formatDate(info.getValue() as string)}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedOrder(row.original);
              }}
              className="text-ink-tertiary hover:text-ink-primary"
            >
              <Eye className="w-4 h-4" />
            </button>
            <Link
              href={`/dashboard/orders/${row.original.id}`}
              className="text-xs font-semibold text-accent hover:text-accent/80"
            >
              View Full Details
            </Link>
          </div>
        ),
        size: 140,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    []
  );

  // --- Table Instance ---
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      sorting,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
  });

  // --- Export CSV ---
  const handleExportCSV = () => {
    const headers = [
      "Order ID",
      "Customer Name",
      "Phone",
      "Pincode",
      "Order Value",
      "Risk Score",
      "Risk Level",
      "Status",
      "Order Date",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredData.map((order) => [
        order.id,
        `"${order.customerName}"`,
        order.phone,
        order.pincode,
        order.value,
        order.riskScore,
        getRiskLevel(order.riskScore),
        order.status,
        formatDate(order.orderDate),
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `orders-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSelected = () => {
    const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
    const headers = [
      "Order ID",
      "Customer Name",
      "Phone",
      "Pincode",
      "Order Value",
      "Risk Score",
      "Risk Level",
      "Status",
      "Order Date",
    ];
    const csvContent = [
      headers.join(","),
      ...selectedRows.map((order) => [
        order.id,
        `"${order.customerName}"`,
        order.phone,
        order.pincode,
        order.value,
        order.riskScore,
        getRiskLevel(order.riskScore),
        order.status,
        formatDate(order.orderDate),
      ].join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `selected-orders-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Reset Filters ---
  const resetFilters = () => {
    setGlobalFilter("");
    setStatusFilters([]);
    setRiskFilters([]);
    setStartDate("");
    setEndDate("");
  };

  // --- Keydown Handler for Drawer ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedOrder(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- Render ---
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-ink-primary">Orders Management</h2>
          <p className="text-sm text-ink-secondary mt-1">
            Manage and monitor all your COD orders
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search + Export */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-tertiary" />
            <input
              type="text"
              placeholder="Search by Order ID, Customer Name, or Phone..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-default bg-bg-raised text-sm text-ink-primary placeholder:text-ink-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border-default bg-bg-base hover:bg-bg-raised text-sm font-semibold text-ink-primary transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-ink-tertiary" />
            <span className="text-xs font-semibold text-ink-tertiary uppercase">Filters</span>
          </div>

          {/* Status Filter */}
          <select
            multiple
            value={statusFilters}
            onChange={(e) =>
              setStatusFilters(Array.from(e.target.selectedOptions, (opt) => opt.value as OrderStatus))
            }
            className="px-3 py-2 rounded-lg border border-border-default bg-bg-raised text-sm text-ink-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="Pending">Pending</option>
            <option value="Verified">Verified</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="RTO">RTO</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Risk Filter */}
          <select
            multiple
            value={riskFilters}
            onChange={(e) =>
              setRiskFilters(Array.from(e.target.selectedOptions, (opt) => opt.value as RiskLevel))
            }
            className="px-3 py-2 rounded-lg border border-border-default bg-bg-raised text-sm text-ink-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          >
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>

          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-ink-tertiary" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border-default bg-bg-raised text-sm text-ink-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
            <span className="text-ink-tertiary">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border-default bg-bg-raised text-sm text-ink-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {(statusFilters.length > 0 ||
            riskFilters.length > 0 ||
            startDate ||
            endDate ||
            globalFilter) && (
            <button
              onClick={resetFilters}
              className="text-xs font-semibold text-ink-tertiary hover:text-ink-primary transition-colors"
            >
              Reset all filters
            </button>
          )}
        </div>

        {/* Active Filter Chips */}
        {(statusFilters.length > 0 || riskFilters.length > 0 || startDate || endDate) && (
          <div className="flex flex-wrap items-center gap-2">
            {statusFilters.map((status) => (
              <span
                key={status}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-bg-raised border border-border-default"
              >
                Status: {status}
                <button
                  onClick={() =>
                    setStatusFilters((prev) => prev.filter((s) => s !== status))
                  }
                  className="text-ink-tertiary hover:text-ink-primary"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {riskFilters.map((level) => (
              <span
                key={level}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-bg-raised border border-border-default"
              >
                Risk: {level}
                <button
                  onClick={() =>
                    setRiskFilters((prev) => prev.filter((l) => l !== level))
                  }
                  className="text-ink-tertiary hover:text-ink-primary"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {startDate && endDate && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-bg-raised border border-border-default">
                Date: {formatDate(startDate)} to {formatDate(endDate)}
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  className="text-ink-tertiary hover:text-ink-primary"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {Object.keys(rowSelection).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between px-4 py-3 bg-bg-raised border border-border-default rounded-lg"
          >
            <span className="text-sm font-medium text-ink-primary">
              {Object.keys(rowSelection).length} orders selected
            </span>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-default bg-bg-base hover:bg-bg-sunken text-xs font-semibold text-ink-primary transition-colors">
                <Check className="w-3.5 h-3.5" />
                Mark as Verified
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-default bg-bg-base hover:bg-bg-sunken text-xs font-semibold text-ink-primary transition-colors">
                <AlertTriangle className="w-3.5 h-3.5" />
                Flag as Fraud
              </button>
              <button
                onClick={handleExportSelected}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-default bg-bg-base hover:bg-bg-sunken text-xs font-semibold text-ink-primary transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Selected
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders Table */}
      <div className="border border-border-default rounded-lg overflow-hidden bg-bg-base">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-raised border-b border-border-default">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedOrder(row.original)}
                  className={`hover:bg-bg-sunken cursor-pointer transition-colors ${
                    row.getIsSelected() ? "bg-bg-raised" : ""
                  }`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-border-default gap-4">
          <div className="text-xs text-ink-secondary">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} –{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} orders
          </div>
          <div className="flex items-center gap-3">
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="px-2 py-1.5 rounded-lg border border-border-default bg-bg-raised text-xs text-ink-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            >
              {[10, 25, 50, 100].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} / page
                </option>
              ))}
            </select>
            <div className="flex items-center gap-1">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-1.5 rounded border border-border-default bg-bg-raised hover:bg-bg-sunken disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: table.getPageCount() }, (_, i) => (
                <button
                  key={i}
                  onClick={() => table.setPageIndex(i)}
                  className={`px-2.5 py-1.5 rounded text-xs font-semibold transition-colors ${
                    table.getState().pagination.pageIndex === i
                      ? "bg-accent text-ink-inverse"
                      : "text-ink-primary hover:bg-bg-raised"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-1.5 rounded border border-border-default bg-bg-raised hover:bg-bg-sunken disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Drawer */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black/40 z-40"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-bg-base border-l border-border-default z-50 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
                <div>
                  <h3 className="text-lg font-bold text-ink-primary">Order {selectedOrder.id}</h3>
                  <p className="text-xs text-ink-secondary mt-1">
                    {formatDate(selectedOrder.orderDate)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 rounded-lg hover:bg-bg-raised text-ink-secondary hover:text-ink-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Order Status Badge */}
                <div className="flex items-center justify-between">
                  <div
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold"
                    style={{
                      backgroundColor: `${getStatusColor(selectedOrder.status)}20`,
                      color: getStatusColor(selectedOrder.status),
                      border: `1px solid ${getStatusColor(selectedOrder.status)}40`,
                    }}
                  >
                    {selectedOrder.status}
                  </div>
                  <div
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold"
                    style={{
                      backgroundColor: `${getRiskColor(getRiskLevel(selectedOrder.riskScore))}20`,
                      color: getRiskColor(getRiskLevel(selectedOrder.riskScore)),
                      border: `1px solid ${getRiskColor(getRiskLevel(selectedOrder.riskScore))}40`,
                    }}
                  >
                    Risk: {selectedOrder.riskScore} ({getRiskLevel(selectedOrder.riskScore)})
                  </div>
                </div>

                {/* Order Details */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-ink-primary">Order Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-ink-tertiary uppercase">Order Value</span>
                      <p className="font-mono font-semibold text-ink-primary">
                        {formatCurrency(selectedOrder.value)}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-ink-tertiary uppercase">Pincode</span>
                      <p className="font-mono text-ink-primary">{selectedOrder.pincode}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-ink-primary">Customer Details</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-ink-tertiary uppercase">Name</span>
                      <p className="font-medium text-ink-primary">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <span className="text-xs text-ink-tertiary uppercase">Phone</span>
                      <p className="font-mono text-ink-primary">{selectedOrder.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Risk Score Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-ink-primary">Risk Score Breakdown</h4>
                  <ul className="space-y-2">
                    {selectedOrder.riskFactors.map((factor, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-ink-secondary">
                        <div className="w-1.5 h-1.5 rounded-full bg-border-default" />
                        {factor}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* OTP Verification */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-ink-primary">OTP Verification</h4>
                  <div className="flex items-center gap-2 text-sm">
                    {selectedOrder.otpVerified ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-positive" />
                        <span className="text-positive font-medium">Verified</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-negative" />
                        <span className="text-negative font-medium">Not Verified</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Order Timeline */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-ink-primary">Order Timeline</h4>
                  <div className="space-y-4">
                    {selectedOrder.timeline.map((event, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                          {i < selectedOrder.timeline.length - 1 && (
                            <div className="w-0.5 flex-1 bg-border-default" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold text-ink-primary">{event.status}</p>
                            <span className="text-[10px] text-ink-tertiary font-mono">
                              {formatDate(event.date)}
                            </span>
                          </div>
                          <p className="text-xs text-ink-secondary mt-1">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="flex items-center gap-3 p-6 border-t border-border-default">
                <Link
                  href={`/dashboard/orders/${selectedOrder.id}`}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border-default bg-bg-base hover:bg-bg-raised text-sm font-semibold text-ink-primary transition-colors text-center"
                >
                  View Full Details
                </Link>
                <button className="flex-1 px-4 py-2.5 rounded-lg border border-border-default bg-bg-base hover:bg-bg-raised text-sm font-semibold text-ink-primary transition-colors">
                  Flag as Fraud
                </button>
                <button className="flex-1 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-sm font-semibold text-ink-inverse transition-colors">
                  Approve Order
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
