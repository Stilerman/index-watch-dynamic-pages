
import { useState } from "react";
import { IndexationResult } from "@/types";

export function useTableSort() {
  const [sortColumn, setSortColumn] = useState<keyof IndexationResult>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: keyof IndexationResult) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortData = (data: IndexationResult[]) => {
    return [...data].sort((a, b) => {
      const valueA = a[sortColumn];
      const valueB = b[sortColumn];
      
      if (valueA === valueB) return 0;
      
      // Handle string comparisons
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      
      // Handle boolean comparisons
      if (typeof valueA === 'boolean' && typeof valueB === 'boolean') {
        return sortDirection === 'asc'
          ? (valueA === valueB ? 0 : valueA ? -1 : 1)
          : (valueA === valueB ? 0 : valueA ? 1 : -1);
      }
      
      // Handle date strings
      if (sortColumn === 'date' || sortColumn === 'yandex_indexdate') {
        const dateA = valueA ? new Date(valueA as string).getTime() : 0;
        const dateB = valueB ? new Date(valueB as string).getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      return 0;
    });
  };

  return {
    sortColumn,
    sortDirection,
    handleSort,
    sortData
  };
}
