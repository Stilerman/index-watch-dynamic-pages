
import React from "react";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RiArrowUpLine, RiArrowDownLine } from "react-icons/ri";
import { IndexationResult } from "@/types";

interface IndexationTableHeaderProps {
  sortColumn: keyof IndexationResult | null;
  sortDirection: 'asc' | 'desc';
  onSort: (column: keyof IndexationResult) => void;
}

const IndexationTableHeader = ({ sortColumn, sortDirection, onSort }: IndexationTableHeaderProps) => {
  const SortIcon = ({ column }: { column: keyof IndexationResult }) => (
    sortColumn === column && (
      sortDirection === 'asc' ? 
        <RiArrowUpLine className="inline ml-2" /> : 
        <RiArrowDownLine className="inline ml-2" />
    )
  );

  return (
    <TableHeader>
      <TableRow>
        <TableHead onClick={() => onSort('url')} className="cursor-pointer">
          URL
          <SortIcon column="url" />
        </TableHead>
        <TableHead>Группа</TableHead>
        <TableHead onClick={() => onSort('google')} className="cursor-pointer">
          Google
          <SortIcon column="google" />
        </TableHead>
        <TableHead onClick={() => onSort('yandex')} className="cursor-pointer">
          Яндекс
          <SortIcon column="yandex" />
        </TableHead>
        <TableHead onClick={() => onSort('yandex_indexdate')} className="cursor-pointer">
          Индексация Яндекс
          <SortIcon column="yandex_indexdate" />
        </TableHead>
        <TableHead onClick={() => onSort('date')} className="cursor-pointer">
          Дата проверки
          <SortIcon column="date" />
        </TableHead>
        <TableHead></TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default IndexationTableHeader;
