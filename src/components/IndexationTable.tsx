
import React, { useState, useEffect } from "react";
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

  const totalPages = Math.ceil(totalResults / limit);

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
          Показано: {data.length} из {totalResults}
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
              <TableHead>Проверка</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.url}>
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
                  {item.yandex_indexdate 
                    ? format(new Date(item.yandex_indexdate), "dd MMM yyyy, HH:mm", { locale: ru }) 
                    : "Нет данных"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCheck(item.url)}
                  >
                    Проверить
                  </Button>
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
            ))}
          </TableBody>
        </Table>
      </div>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => setPage(Math.max(1, page - 1))} 
              isDisabled={page === 1} 
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => (
            <PaginationItem key={i}>
              <PaginationLink 
                isActive={page === i + 1} 
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext 
              onClick={() => setPage(Math.min(totalPages, page + 1))} 
              isDisabled={page === totalPages} 
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default IndexationTable;
