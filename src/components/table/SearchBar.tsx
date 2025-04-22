
import React from "react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  totalResults: number;
  filteredCount: number;
}

const SearchBar = ({ value, onChange, totalResults, filteredCount }: SearchBarProps) => {
  return (
    <div className="flex items-center justify-between">
      <Input
        placeholder="Поиск по URL..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-64"
      />
      <div className="text-sm text-gray-500">
        Показано: {filteredCount} из {totalResults}
      </div>
    </div>
  );
};

export default SearchBar;
