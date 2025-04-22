
import { Button } from "@/components/ui/button";
import { PlayCircle, Plus, RefreshCw } from "lucide-react";

type Props = {
  isLoading: boolean;
  hasUrls: boolean;
  onAdd: () => void;
  onRefresh: () => void;
  onStartIndexing: () => void;
};

export default function DashboardActions({ 
  isLoading, 
  hasUrls, 
  onAdd, 
  onRefresh,
  onStartIndexing 
}: Props) {
  return (
    <div className="flex space-x-2">
      <Button
        onClick={onAdd}
        className="flex items-center"
        disabled={isLoading}
      >
        <Plus className="mr-2 h-4 w-4" /> Добавить URL
      </Button>
      <Button
        variant="outline"
        onClick={onRefresh}
        className="flex items-center"
        disabled={isLoading || !hasUrls}
      >
        <RefreshCw className="mr-2 h-4 w-4" /> Обновить все
      </Button>
      <Button
        variant="secondary"
        onClick={onStartIndexing}
        className="flex items-center"
        disabled={isLoading || !hasUrls}
      >
        <PlayCircle className="mr-2 h-4 w-4" /> Запустить проверку
      </Button>
    </div>
  );
}
