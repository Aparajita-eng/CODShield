"use client";

import { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import type { PincodeMetrics } from "@/lib/pincode-api";
import { getRiskBadgeClass } from "@/lib/pincode-ui";

interface PincodeTableProps {
  data: PincodeMetrics[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  selectedPincode: string | null;
  highlightPincode: string | null;
  onRowClick: (pincode: PincodeMetrics) => void;
  tableRef?: React.RefObject<HTMLDivElement | null>;
}

export default function PincodeTable({
  data,
  sorting,
  onSortingChange,
  selectedPincode,
  highlightPincode,
  onRowClick,
  tableRef,
}: PincodeTableProps) {
  const columns = useMemo<ColumnDef<PincodeMetrics>[]>(
    () => [
      {
        accessorKey: "pincode",
        header: "Pincode",
        cell: ({ row }) => (
          <span className="font-mono font-semibold text-ink-primary">{row.original.pincode}</span>
        ),
      },
      {
        id: "area",
        header: "Area / City",
        cell: ({ row }) => (
          <span className="text-ink-secondary">
            {row.original.city !== "Unknown area" ? row.original.city : row.original.district}
          </span>
        ),
      },
      { accessorKey: "state", header: "State" },
      {
        accessorKey: "orderCount",
        header: "Orders",
        cell: ({ row }) => <span className="font-mono">{row.original.orderCount}</span>,
      },
      {
        accessorKey: "riskScore",
        header: "Risk Score",
        cell: ({ row }) => (
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${getRiskBadgeClass(row.original.riskLevel)}`}
          >
            {row.original.riskScore}
          </span>
        ),
      },
      {
        accessorKey: "successPct",
        header: "Success %",
        cell: ({ row }) => <span className="font-mono">{row.original.successPct}%</span>,
      },
      {
        accessorKey: "fraudPct",
        header: "Fraud %",
        cell: ({ row }) => <span className="font-mono">{row.original.fraudPct}%</span>,
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      onSortingChange(next);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div ref={tableRef} className="bg-bg-raised border border-border-default rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border-default flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-primary">
          Pincode list
        </h3>
        <span className="text-xs text-ink-tertiary">{data.length} pincode(s)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border-default bg-bg-base">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-2.5 text-left text-xs font-semibold text-ink-secondary uppercase tracking-wide"
                  >
                    {header.isPlaceholder ? null : (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-ink-primary"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                      </button>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-ink-secondary">
                  No pincodes match the current filters.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => {
                const pin = row.original.pincode;
                const isActive = selectedPincode === pin || highlightPincode === pin;
                return (
                  <tr
                    key={row.id}
                    id={`pincode-row-${pin}`}
                    onClick={() => onRowClick(row.original)}
                    className={`border-b border-border-subtle cursor-pointer transition-colors ${
                      isActive ? "bg-accent-muted" : "hover:bg-bg-sunken"
                    }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-border-default flex items-center justify-between text-xs text-ink-secondary">
        <span>
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            className="p-1.5 rounded border border-border-default disabled:opacity-40 hover:bg-bg-sunken"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            className="p-1.5 rounded border border-border-default disabled:opacity-40 hover:bg-bg-sunken"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
