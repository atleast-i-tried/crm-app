"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function Table({
  className,
  ...props
}) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        // container: rounded card, subtle border & overflow handling
        "relative w-full overflow-x-auto rounded-2xl border bg-card shadow-sm",
        // allow a slightly elevated look on wide screens, keep compact on small
        "sm:shadow-md",
        className
      )}
    >
      <table
        data-slot="table"
        // table reset + min width so columns don't collapse, better default typography
        className={cn(
          "min-w-full table-auto text-sm leading-6 text-foreground",
          "caption-bottom",
          "border-transparent",
          className
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({
  className,
  ...props
}) {
  return (
    <thead
      data-slot="table-header"
      // sticky header for long scrollable tables; subtle backdrop to avoid bleed-through
      className={cn(
        "[&_tr]:border-b",
        "sticky top-0 z-20",
        "backdrop-blur-sm bg-background/90 dark:bg-background/90",
        className
      )}
      {...props}
    />
  );
}

function TableBody({
  className,
  ...props
}) {
  return (
    <tbody
      data-slot="table-body"
      // keep last-row border off and smooth row transitions
      className={cn("[&_tr:last-child]:border-0", "divide-y", className)}
      {...props}
    />
  );
}

function TableFooter({
  className,
  ...props
}) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        // slightly muted band with strong separator
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  );
}

function TableRow({
  className,
  ...props
}) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        // zebra striping + hover + subtle lift when hovered
        "transition-colors duration-150",
        "odd:bg-transparent even:bg-muted/5 dark:even:bg-muted/10",
        "hover:bg-muted/40 dark:hover:bg-muted/30",
        // keep original border behaviour
        "data-[state=selected]:bg-muted border-b",
        className
      )}
      {...props}
    />
  );
}

function TableHead({
  className,
  ...props
}) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        // slightly larger, uppercase label feel for headings, good spacing
        "text-foreground h-12 px-4 text-left align-middle font-medium whitespace-nowrap",
        "text-xs uppercase tracking-wide select-none",
        // preserve existing checkbox alignment helper
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  ...props
}) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        // more comfortable touch target + truncation for long values
        "py-3 px-4 align-middle whitespace-nowrap text-sm",
        "max-w-[18rem] truncate",
        // preserve checkbox helpers
        "[&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}) {
  return (
    <caption
      data-slot="table-caption"
      className={cn(
        // centered, small and slightly muted with spacing
        "text-muted-foreground mt-4 text-sm text-center",
        className
      )}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
