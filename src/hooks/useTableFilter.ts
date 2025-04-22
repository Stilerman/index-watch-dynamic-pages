
import { useState } from "react";
import { IndexationResult, UrlGroup } from "@/types";

export function useTableFilter() {
  const [searchTerm, setSearchTerm] = useState("");

  const filterData = (data: IndexationResult[], groups?: UrlGroup[]) => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      // Filter by URL
      const urlMatch = item.url.toLowerCase().includes(searchTerm.toLowerCase());
      
      // If already matches URL, no need to check further
      if (urlMatch) return true;
      
      // If groups are provided, also check group names
      if (groups) {
        const group = groups.find(g => g.urls.includes(item.url));
        if (group && group.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          return true;
        }
      }
      
      return false;
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    filterData
  };
}
