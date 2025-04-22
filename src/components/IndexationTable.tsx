
import React, { useState } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { IndexationResult, UrlGroup } from "@/types";
import SearchBar from "./table/SearchBar";
import IndexationTableHeader from "./table/IndexationTableHeader";
import IndexationTableRow from "./table/IndexationTableRow";
import TablePagination from "./table/TablePagination";

interface IndexationTableProps {
  data: IndexationResult[];
  groups: UrlGroup[];
  onDelete: (url: string) => void;
  onCheck: (url: string) => void;
  page: number;
  totalResults: number;
  limit: number;
  setPage: (page: number) => void;
  selectedGroup?: string;
}

const IndexationTable = ({
  data,
  groups,
  onDelete,
  onCheck,
  page,
  totalResults,
  limit,
  setPage,
  selectedGroup
}: IndexationTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<keyof IndexationResult | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: keyof IndexationResult) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0;
    const valueA = a[sortColumn];
    const valueB = b[sortColumn];
    
    if (typeof valueA === 'string' && typeof valueB === 'string') {
      return sortDirection === 'asc'
        ? valueA.localeCompare(valueB)
        : valueB.localeCompare(valueA);
    }
    
    if (typeof valueA === 'boolean' && typeof valueB === 'boolean') {
      return sortDirection === 'asc'
        ? (valueA === valueB ? 0 : valueA ? -1 : 1)
        : (valueA === valueB ? 0 : valueA ? 1 : -1);
    }
    
    return 0;
  });

  const getGroupName = (url: string): string => {
    for (const group of groups) {
      if (group.urls.includes(url)) {
        return group.name;
      }
    }
    return "Без группы";
  };

  const filteredData = sortedData.filter(item =>
    item.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(totalResults / limit);

  return (
    <div className="space-y-4">
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        totalResults={totalResults}
        filteredCount={filteredData.length}
      />

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <IndexationTableHeader
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <IndexationTableRow
                  key={`${item.url}-${item.date}`}
                  item={item}
                  groupName={getGroupName(item.url)}
                  onDelete={onDelete}
                  onCheck={onCheck}
                />
              ))
            ) : (
              <tr>
                <td colSpan={7} className="text-center py-4">
                  {searchTerm ? "URL не найдены" : "Нет данных"}
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  );
};

export default IndexationTable;
