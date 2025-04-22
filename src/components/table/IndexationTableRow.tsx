
import React from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RiMore2Fill } from "react-icons/ri";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IndexationResult } from "@/types";

interface IndexationTableRowProps {
  item: IndexationResult;
  groupName: string;
  onDelete: (url: string) => void;
  onCheck: (url: string) => void;
}

const IndexationTableRow = ({ item, groupName, onDelete, onCheck }: IndexationTableRowProps) => {
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
    <TableRow>
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
      <TableCell>{groupName}</TableCell>
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
      <TableCell>{formatDate(item.yandex_indexdate)}</TableCell>
      <TableCell>{formatDate(item.date)}</TableCell>
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
  );
};

export default IndexationTableRow;
