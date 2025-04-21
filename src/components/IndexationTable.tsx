
import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IndexationResult, UrlGroup } from "@/types";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { RiMore2Fill } from "react-icons/ri";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface IndexationTableProps {
  data: IndexationResult[];
  groups: UrlGroup[];
  onDelete: (url: string) => void;
  onCheck: (url: string) => void;
}

const IndexationTable = ({ data, groups, onDelete, onCheck }: IndexationTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [filteredData, setFilteredData] = useState<IndexationResult[]>(data);

  useEffect(() => {
    const newFilteredData = data.filter((item) => {
      const matchesSearch = item.url.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = selectedGroup
        ? groups.find(g => g.id === selectedGroup)?.urls.includes(item.url)
        : true;
      return matchesSearch && matchesGroup;
    });
    setFilteredData(newFilteredData);
  }, [data, searchTerm, selectedGroup, groups]);

  const getGroupName = (url: string): string => {
    for (const group of groups) {
      if (group.urls.includes(url)) {
        return group.name;
      }
    }
    return "Без группы";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Поиск по URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {selectedGroup
                  ? `Группа: ${groups.find(g => g.id === selectedGroup)?.name}`
                  : "Все группы"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedGroup(null)}>
                Все группы
              </DropdownMenuItem>
              {groups.map((group) => (
                <DropdownMenuItem
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                >
                  {group.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="text-sm text-gray-500">
          Показано: {filteredData.length} из {data.length}
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Группа</TableHead>
              <TableHead>Google</TableHead>
              <TableHead>Яндекс</TableHead>
              <TableHead>Последняя проверка</TableHead>
              <TableHead>Проверить</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
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
                    {format(new Date(item.date), "dd MMM yyyy, HH:mm", { locale: ru })}
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
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                  {searchTerm || selectedGroup
                    ? "Ничего не найдено. Попробуйте изменить параметры поиска."
                    : "Нет данных. Добавьте URL для начала мониторинга."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default IndexationTable;

