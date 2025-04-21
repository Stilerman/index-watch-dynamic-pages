
import DashboardCard from "@/components/DashboardCard";
import { RiLinksLine, RiCheckLine } from "react-icons/ri";

type Props = {
  total: number;
  indexedGoogle: number;
  indexedYandex: number;
  notIndexed: number;
};

export default function DashboardStats({ total, indexedGoogle, indexedYandex, notIndexed }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardCard
        title="Всего URL"
        value={total}
        icon={<RiLinksLine className="h-4 w-4" />}
      />
      <DashboardCard
        title="Индексируется в Google"
        value={`${indexedGoogle} из ${total}`}
        icon={<span className="font-bold">G</span>}
        trend={total > 0 ? {
          value: Math.round((indexedGoogle / total) * 100),
          isPositive: indexedGoogle === total
        } : undefined}
      />
      <DashboardCard
        title="Индексируется в Яндекс"
        value={`${indexedYandex} из ${total}`}
        icon={<span className="font-bold">Я</span>}
        trend={total > 0 ? {
          value: Math.round((indexedYandex / total) * 100),
          isPositive: indexedYandex === total
        } : undefined}
      />
      <DashboardCard
        title="Требуют внимания"
        value={notIndexed}
        icon={<RiCheckLine className="h-4 w-4" />}
        className={notIndexed > 0 ? "border-red-300" : undefined}
      />
    </div>
  );
}
