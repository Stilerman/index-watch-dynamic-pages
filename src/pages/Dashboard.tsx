import React, { useState, useEffect } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import DashboardActions from "@/components/DashboardActions";
import DashboardStats from "@/components/DashboardStats";
import IndexationTable from "@/components/IndexationTable";
import AddUrlModal from "@/components/AddUrlModal";
import { useUrlActions } from "@/hooks/useUrlActions";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RiSettings4Line, RiLinksLine, RiAddLine } from "react-icons/ri";
import { getApiKey } from "@/services/indexationApi";
import { batchCheckIndexation } from "@/services/indexationApi";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { results, groups, isLoading, reload } = useDashboardData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();

  const {
    handleAddUrls,
    handleDeleteUrl,
    handleCheckUrl,
    handleRefreshAll
  } = useUrlActions({ reload, groups, results });

  // Новая функция для запуска проверки индексации
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

      if (results.length === 0) {
        toast({
          title: "Нет URL для проверки",
          description: "Сначала добавьте URL адреса для проверки.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Проверка индексации",
        description: `Начинаем проверку ${results.length} URL...`
      });

      const urls = results.map(r => r.url);
      const newResults = await batchCheckIndexation(urls);

      // Сохраняем результаты в базу
      for (const result of newResults) {
        await supabase.from("indexation_results").upsert(
          {
            url: result.url,
            google: result.google,
            yandex: result.yandex,
            date: result.date,
          },
          { onConflict: "url" }
        );
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

  useEffect(() => {
    console.log("Отображение результатов:", results.length);
  }, [results]);

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
        <DashboardActions
          isLoading={isLoading}
          hasUrls={results.length > 0}
          onAdd={() => setIsAddModalOpen(true)}
          onRefresh={handleRefreshAll}
          onStartIndexing={handleStartIndexing}
        />
      </div>

      {!apiKeyExists && (
        <Alert variant="destructive">
          <AlertTitle>Требуется API ключ</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Для работы с проверкой индексации необходимо указать API ключ в настройках.</span>
            <Link to="/settings">
              <span className="flex items-center px-3 py-1 border rounded hover:bg-gray-100 text-sm">
                <RiSettings4Line className="mr-2 h-4 w-4" /> Настройки
              </span>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <DashboardStats
        total={totalUrls}
        indexedGoogle={google}
        indexedYandex={yandex}
        notIndexed={notIndexed}
      />

      <IndexationTable
        data={results}
        groups={groups}
        onDelete={handleDeleteUrl}
        onCheck={handleCheckUrl}
      />

      <AddUrlModal
        open={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddUrls}
        groups={groups}
      />

      {results.length === 0 && (
        <div className="py-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <RiLinksLine className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Нет добавленных URL</h3>
          <p className="text-gray-500">
            Добавьте URL для проверки индексации в поисковых системах.
          </p>
          <button
            className="mt-4 flex items-center justify-center px-4 py-2 bg-primary text-white rounded"
            onClick={() => setIsAddModalOpen(true)}
          >
            <RiAddLine className="mr-2 h-4 w-4" /> Добавить первый URL
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
