
// Новый компактный дашборд. Вся лишняя логика вынесена в хуки и отдельные компоненты!
import React, { useState, useEffect } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import DashboardActions from "@/components/DashboardActions";
import DashboardStats from "@/components/DashboardStats";
import IndexationTable from "@/components/IndexationTable";
import AddUrlModal from "@/components/AddUrlModal";
import { batchCheckIndexation, getApiKey } from "@/services/indexationApi";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RiSettings4Line, RiLinksLine, RiAddLine } from "react-icons/ri";
import { v4 as uuidv4 } from "uuid";

const Dashboard = () => {
  const { results, groups, isLoading, reload } = useDashboardData();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log("Отображение результатов:", results.length);
  }, [results]);

  // Добавление url — использует весь тот же механизм как и раньше
  const handleAddUrls = async (urls: string[], groupIdOrName?: string) => {
    try {
      console.log("Добавление URLs:", urls);
      console.log("В группу:", groupIdOrName);
      
      // Проверяем наличие API ключа
      const apiKey = getApiKey();
      if (!apiKey) {
        toast({
          title: "API ключ не найден",
          description: "Пожалуйста, добавьте API ключ в настройках перед проверкой URL.",
          variant: "destructive"
        });
        return;
      }

      // Создание новой группы при необходимости
      let groupId = "";
      if (groupIdOrName) {
        let existing = groups.find(g => g.id === groupIdOrName || g.name === groupIdOrName);
        if (!existing) {
          const newGroupId = uuidv4();
          const { data: createdGroup, error } = await supabase.from("url_groups")
            .insert({ id: newGroupId, name: groupIdOrName })
            .select()
            .single();
            
          if (error) {
            console.error("Ошибка создания группы:", error);
            toast({
              title: "Ошибка создания группы",
              description: error.message,
              variant: "destructive"
            });
            return;
          }
          
          console.log("Создана новая группа:", createdGroup);
          groupId = createdGroup.id;
        } else {
          groupId = existing.id;
        }
      }

      toast({
        title: "Проверка URL",
        description: "Выполняется проверка URL...",
      });
      
      // Получаем результаты индексации
      const newResults = await batchCheckIndexation(urls);
      console.log("Получены результаты индексации:", newResults);

      // Сохраняем результаты в базе
      for (const result of newResults) {
        const { error: insertError } = await supabase.from("indexation_results").upsert(
          {
            url: result.url,
            google: result.google,
            yandex: result.yandex,
            date: result.date,
          },
          { onConflict: "url" }
        );
        
        if (insertError) {
          console.error("Ошибка сохранения результата для URL", result.url, insertError);
        }
      }

      // Связываем URLs с группой
      if (groupId) {
        const urlsToInsert = urls.map(url => ({
          id: uuidv4(),
          group_id: groupId,
          url: url.trim(),
        }));
        
        const { error: groupUrlsError } = await supabase
          .from("group_urls")
          .upsert(urlsToInsert, { onConflict: ["group_id", "url"] });
          
        if (groupUrlsError) {
          console.error("Ошибка привязки URL к группе:", groupUrlsError);
          toast({
            title: "Ошибка привязки URL к группе",
            description: groupUrlsError.message,
            variant: "destructive"
          });
        }
      }
      
      // Обновляем данные на странице
      await reload();
      
      toast({
        title: "Готово!",
        description: `Добавлено ${newResults.length} URL для мониторинга.`
      });
    } catch (error: any) {
      console.error("Ошибка при добавлении URL:", error);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteUrl = async (url: string) => {
    try {
      console.log("Удаление URL:", url);
      
      // Удаляем URL из результатов индексации
      const { error: deleteResultError } = await supabase
        .from("indexation_results")
        .delete()
        .eq("url", url);
        
      if (deleteResultError) {
        console.error("Ошибка удаления результата:", deleteResultError);
      }
      
      // Удаляем URL из групп
      const { error: deleteGroupUrlError } = await supabase
        .from("group_urls")
        .delete()
        .eq("url", url);
        
      if (deleteGroupUrlError) {
        console.error("Ошибка удаления ссылки из группы:", deleteGroupUrlError);
      }
      
      await reload();
      toast({ title: "URL удалён", description: "URL успешно удалён из мониторинга." });
    } catch (error: any) {
      console.error("Ошибка при удалении URL:", error);
      toast({
        title: "Ошибка при удалении",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCheckUrl = async (url: string) => {
    try {
      console.log("Проверка индексации URL:", url);
      
      const apiKey = getApiKey();
      if (!apiKey) {
        toast({
          title: "API ключ не найден",
          description: "Пожалуйста, добавьте API ключ в настройках перед проверкой URL.",
          variant: "destructive"
        });
        return;
      }
      
      toast({ title: "Проверка URL", description: "Проверяется индексация..." });

      // Получаем результат индексации
      const [result] = await batchCheckIndexation([url]);
      if (result) {
        const { error } = await supabase.from("indexation_results").upsert(
          {
            url: result.url,
            google: result.google,
            yandex: result.yandex,
            date: result.date,
          },
          { onConflict: "url" }
        );
        
        if (error) {
          console.error("Ошибка сохранения результата проверки:", error);
          throw error;
        }
        
        toast({
          title: "Проверка завершена",
          description: "Индексация обновлена."
        });
      }
      
      await reload();
    } catch (error: any) {
      console.error("Ошибка при проверке URL:", error);
      toast({
        title: "Ошибка при проверке",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRefreshAll = async () => {
    try {
      console.log("Обновление всех URL...");
      
      const apiKey = getApiKey();
      if (!apiKey) {
        toast({
          title: "API ключ не найден",
          description: "Пожалуйста, добавьте API ключ в настройках.",
          variant: "destructive"
        });
        return;
      }
      
      if (results.length === 0) {
        toast({ title: "Нет URL", description: "Сначала добавьте адреса." });
        return;
      }
      
      toast({ title: "Обновление всех", description: "Проверяем все URL..." });
      
      const urls = results.map(r => r.url);
      const newResults = await batchCheckIndexation(urls);
      
      // Сохраняем результаты в базу
      for (const result of newResults) {
        const { error } = await supabase.from("indexation_results").upsert(
          {
            url: result.url,
            google: result.google,
            yandex: result.yandex,
            date: result.date,
          },
          { onConflict: "url" }
        );
        
        if (error) {
          console.error("Ошибка обновления результата для URL", result.url, error);
        }
      }
      
      await reload();
      toast({ title: "Обновлено", description: `${newResults.length} URL проверено` });
    } catch (error: any) {
      console.error("Ошибка обновления всех URL:", error);
      toast({
        title: "Ошибка обновления",
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
        <DashboardActions
          isLoading={isLoading}
          hasUrls={results.length > 0}
          onAdd={() => setIsAddModalOpen(true)}
          onRefresh={handleRefreshAll}
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
