
import { Button } from "@/components/ui/button";
import { RiAddLine, RiRefreshLine } from "react-icons/ri";

type Props = {
  isLoading: boolean;
  hasUrls: boolean;
  onAdd: () => void;
  onRefresh: () => void;
};

export default function DashboardActions({ isLoading, hasUrls, onAdd, onRefresh }: Props) {
  return (
    <div className="flex space-x-2">
      <Button
        onClick={onAdd}
        className="flex items-center"
        disabled={isLoading}
      >
        <RiAddLine className="mr-2 h-4 w-4" /> Добавить URL
      </Button>
      <Button
        variant="outline"
        onClick={onRefresh}
        className="flex items-center"
        disabled={isLoading || !hasUrls}
      >
        <RiRefreshLine className="mr-2 h-4 w-4" /> Обновить все
      </Button>
    </div>
  );
}
