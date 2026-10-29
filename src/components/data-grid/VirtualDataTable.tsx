import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  type ColumnDef,
  type SortingState,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type VirtualDataTableProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  height?: number | string;
  rowHeight?: number;
  emptyMessage?: string;
  className?: string;
  getRowId?: (original: TData, index: number) => string;
};

export function VirtualDataTable<TData>({
  data,
  columns,
  height = 520,
  rowHeight = 52,
  emptyMessage = "No records found.",
  className,
  getRowId,
}: VirtualDataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const parentRef = React.useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId,
  });

  const rows = table.getRowModel().rows;
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
  });

  return (
    <div
      ref={parentRef}
      className={cn("overflow-auto rounded-xl border border-border bg-background", className)}
      style={{ height }}
      role="region"
      aria-label="Data table"
      tabIndex={0}
    >
      <div className="min-w-full" style={{ minWidth: "max-content" }}>
        <div
          role="row"
          className="sticky top-0 z-10 grid min-w-full border-b border-border bg-background/95 px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground backdrop-blur-sm"
          style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(140px, 1fr))` }}
        >
          {table.getHeaderGroups()[0]?.headers.map((header) => {
            const canSort = header.column.getCanSort();
            const sorted = header.column.getIsSorted();

            return (
              <div key={header.id} role="columnheader" className="pr-4 last:pr-0">
                {header.isPlaceholder ? null : (
                  <button
                    type="button"
                    className={cn(
                      "inline-flex min-h-8 items-center gap-1.5 rounded-md text-left transition-colors",
                      canSort && "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      !canSort && "cursor-default",
                    )}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    aria-label={canSort ? `Sort by ${header.column.id}` : undefined}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {canSort &&
                      (sorted === "asc" ? (
                        <ArrowUp className="size-3.5" aria-hidden="true" />
                      ) : sorted === "desc" ? (
                        <ArrowDown className="size-3.5" aria-hidden="true" />
                      ) : (
                        <ChevronsUpDown className="size-3.5 opacity-50" aria-hidden="true" />
                      ))}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {rows.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center px-6 text-sm text-muted-foreground" role="status">
            {emptyMessage}
          </div>
        ) : (
          <div
            role="rowgroup"
            className="relative"
            style={{ height: virtualizer.getTotalSize() }}
          >
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = rows[virtualRow.index];

              return (
                <div
                  key={row.id}
                  ref={virtualizer.measureElement}
                  data-index={virtualRow.index}
                  role="row"
                  className="absolute left-0 top-0 grid w-full items-center border-b border-border/70 px-4 text-sm transition-colors last:border-b-0 hover:bg-muted/35"
                  style={{
                    minHeight: rowHeight,
                    transform: `translateY(${virtualRow.start}px)`,
                    gridTemplateColumns: `repeat(${columns.length}, minmax(140px, 1fr))`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <div key={cell.id} role="cell" className="min-w-0 pr-4 last:pr-0">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export type { ColumnDef } from "@tanstack/react-table";
