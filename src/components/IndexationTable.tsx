
import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IndexationResult, UrlGroup } from "@/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { RiMore2Fill, RiArrowUpLine, RiArrowDownLine } from "react-icons/ri";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";

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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Нет данных";
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: ru });
    } catch (e) {
      console.error("Ошибка форматирования даты:", e);
      return "Ошибка формата";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Поиск по URL..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
        <div className="text-sm text-gray-500">
          Показано: {filteredData.length} из {totalResults}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead onClick={() => handleSort('url')} className="cursor-pointer">
                URL
                {sortColumn === 'url' && (
                  sortDirection === 'asc' ? <RiArrowUpLine className="inline ml-2" /> : <RiArrowDownLine className="inline ml-2" />
                )}
              </TableHead>
              <TableHead>Группа</TableHead>
              <TableHead onClick={() => handleSort('google')} className="cursor-pointer">
                Google
                {sortColumn === 'google' && (
                  sortDirection === 'asc' ? <RiArrowUpLine className="inline ml-2" /> : <RiArrowDownLine className="inline ml-2" />
                )}
              </TableHead>
              <TableHead onClick={() => handleSort('yandex')} className="cursor-pointer">
                Яндекс
                {sortColumn === 'yandex' && (
                  sortDirection === 'asc' ? <RiArrowUpLine className="inline ml-2" /> : <RiArrowDownLine className="inline ml-2" />
                )}
              </TableHead>
              <TableHead onClick={() => handleSort('yandex_indexdate')} className="cursor-pointer">
                Индексация Яндекс
                {sortColumn === 'yandex_indexdate' && (
                  sortDirection === 'asc' ? <RiArrowUpLine className="inline ml-2" /> : <RiArrowDownLine className="inline ml-2" />
                )}
              </TableHead>
              <TableHead onClick={() => handleSort('date')} className="cursor-pointer">
                Дата проверки
                {sortColumn === 'date' && (
                  sortDirection === 'asc' ? <RiArrowUpLine className="inline ml-2" /> : <RiArrowDownLine className="inline ml-2" />
                )}
              </TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={`${item.url}-${item.date}`}>
                  <TableCell className="font-medium truncate max-w-xs">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline text-blue-600"
                    >
                      {item.url}
                    </a>
                  </TableCell>
                  <TableCell>{getGroupName(item.url)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={item.google ? "default" : "destructive"}
                      className={item.google ? "bg-green-100 text-green-800" : ""}
                    >
                      {item.google ? "Да" : "Нет"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={item.yandex ? "default" : "destructive"}
                      className={item.yandex ? "bg-green-100 text-green-800" : ""}
                    >
                      {item.yandex ? "Да" : "Нет"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(item.yandex_indexdate)}
                  </TableCell>
                  <TableCell>
                    {formatDate(item.date)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <RiMore2Fill className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onCheck(item.url)}>
                          Проверить сейчас
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(item.url)}>
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  {searchTerm ? "URL не найдены" : "Нет данных"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => page > 1 && setPage(page - 1)} 
                aria-disabled={page === 1}
                className={page === 1 ? "opacity-50 cursor-not-allowed" : ""}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (page <= 3) {
                pageNumber = i + 1;
              } else if (page >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = page - 2 + i;
              }
              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink 
                    isActive={page === pageNumber} 
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext 
                onClick={() => page < totalPages && setPage(page + 1)} 
                aria-disabled={page === totalPages}
                className={page === totalPages ? "opacity-50 cursor-not-allowed" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};

export default IndexationTable;
