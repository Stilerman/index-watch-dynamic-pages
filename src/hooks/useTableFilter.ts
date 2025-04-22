
import { useState } from "react";
import { IndexationResult } from "@/types";

export function useTableFilter() {
  const [searchTerm, setSearchTerm] = useState("");

  const filterData = (data: IndexationResult[]) => {
    return data.filter(item =>
      item.url.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return {
    searchTerm,
    setSearchTerm,
    filterData
  };
}

