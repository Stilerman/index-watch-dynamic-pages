
import React, { useState } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import DashboardActions from "@/components/DashboardActions";
import DashboardStats from "@/components/DashboardStats";
import IndexationTable from "@/components/IndexationTable";
import SeoCharts from "@/components/SeoCharts";
import AddUrlModal from "@/components/AddUrlModal";
import { useUrlActions } from "@/hooks/useUrlActions";
import { useToast } from "@/hooks/use-toast";
import { batchCheckIndexation, getApiKey } from "@/services/indexationApi";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

const Dashboard = () => {
  const [selectedGroup, setSelectedGroup] = useState<string | undefined>(undefined);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [limit, setLimit] = useState(50);

  const { 
    results, 
    groups, 
    isLoading, 
    reload, 
    page, 
    setPage, 
    totalResults 
  } = useDashboardData(selectedGroup, limit);

  const { toast } = useToast();

  const {
    handleAddUrls,
    handleDeleteUrl,
    handleCheckUrl,
    handleRefreshAll
  } = useUrlActions({ reload, groups, results });

  const handleStartIndexing = async () => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) {
        toast({
          title: "API ключ не найден",
          description: "Пожалуйста, добавьте API ключ в настройках перед проверкой URL.",
          variant: "destructive"
        });
        return;
      }

      const urlsToCheck = selectedGroup 
        ? groups.find(g => g.id === selectedGroup)?.urls || [] 
        : groups.flatMap(g => g.urls);

      if (urlsToCheck.length === 0) {
        toast({
          title: "Нет URL для проверки",
          description: "Сначала добавьте URL адреса для проверки.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Проверка индексации",
        description: `Начинаем проверку ${urlsToCheck.length} URL...`
      });

      const newResults = await batchCheckIndexation(urlsToCheck);

      for (const result of newResults) {
        try {
          const { error } = await supabase
            .from("indexation_results")
            .upsert({
              url: result.url,
              google: result.google,
              yandex: result.yandex,
              date: result.date,
              yandex_indexdate: result.yandex_indexdate
            }, { 
              onConflict: 'url' 
            });
          
          if (error) {
            console.error("Ошибка сохранения результата для", result.url, error);
          }
        } catch (insertError) {
          console.error("Исключение при сохранении результата", insertError);
        }
      }

      await reload();
      toast({
        title: "Проверка завершена",
        description: `Проверено ${newResults.length} URL`
      });
    } catch (error: any) {
      console.error("Ошибка при проверке индексации:", error);
      toast({
        title: "Ошибка проверки",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Подсчеты
  const totalUrls = results.length;
  const google = results.filter(r => r.google).length;
  const yandex = results.filter(r => r.yandex).length;
  const notIndexed = results.filter(r => !r.google || !r.yandex).length;
  const apiKeyExists = !!getApiKey();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Дашборд</h1>
        <div className="flex space-x-2 items-center">
          <select 
            value={selectedGroup || ''} 
            onChange={(e) => setSelectedGroup(e.target.value || undefined)}
            className="mr-2 px-2 py-1 border rounded"
          >
            <option value="">Все группы</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
          <select 
            value={limit} 
            onChange={(e) => setLimit(Number(e.target.value))}
            className="mr-2 px-2 py-1 border rounded"
          >
            {[10, 50, 100, 200].map(num => (
              <option key={num} value={num}>Показать {num}</option>
            ))}
          </select>
          <DashboardActions
            isLoading={isLoading}
            hasUrls={groups.some(g => g.urls.length > 0)}
            onAdd={() => setIsAddModalOpen(true)}
            onRefresh={handleRefreshAll}
            onStartIndexing={handleStartIndexing}
          />
        </div>
      </div>

      {/* Остальной код остается без изменений */}
      {/* Alert, DashboardStats и другие компоненты */}

      <SeoCharts 
        results={results} 
        groups={groups} 
        selectedGroup={selectedGroup} 
      />

      <IndexationTable
        data={results}
        groups={groups}
        onDelete={handleDeleteUrl}
        onCheck={handleCheckUrl}
        page={page}
        setPage={setPage}
        totalResults={totalResults}
        limit={limit}
        selectedGroup={selectedGroup}
      />

      <AddUrlModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddUrls}
        groups={groups}
      />
    </div>
  );
};

export default Dashboard;
