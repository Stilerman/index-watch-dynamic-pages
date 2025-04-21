
import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import DashboardCard from "@/components/DashboardCard";
import IndexationTable from "@/components/IndexationTable";
import AddUrlModal from "@/components/AddUrlModal";
import { IndexationResult, UrlGroup } from "@/types";
import { RiAddLine, RiCheckLine, RiRefreshLine, RiLinksLine, RiSettings4Line } from "react-icons/ri";
import { batchCheckIndexation, getApiKey } from "@/services/indexationApi";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const Dashboard = () => {
  const [results, setResults] = useState<IndexationResult[]>([]);
  const [groups, setGroups] = useState<UrlGroup[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Загрузка результатов и групп с Supabase
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Получаем список результатов индексации
      const { data: dbResults, error: resultsError } = await supabase
        .from("indexation_results")
        .select("*")
        .order("date", { ascending: false });

      if (resultsError) {
        toast({
          title: "Ошибка загрузки результатов",
          description: resultsError.message,
          variant: "destructive"
        });
        return;
      }
      setResults(dbResults ?? []);

      // Получаем список групп
      const { data: dbGroups, error: groupsError } = await supabase
        .from("url_groups")
        .select("*");

      if (groupsError) {
        toast({
          title: "Ошибка загрузки групп",
          description: groupsError.message,
          variant: "destructive"
        });
        return;
      }

      // Для каждой группы подгружаем её URL (через связь group_urls)
      const groupsWithUrls: UrlGroup[] = [];

      for (const group of dbGroups ?? []) {
        const { data: groupUrls, error: groupUrlsError } = await supabase
          .from("group_urls")
          .select("url")
          .eq("group_id", group.id);

        if (groupUrlsError) {
          toast({
            title: `Ошибка группировки (${group.name})`,
            description: groupUrlsError.message,
            variant: "destructive"
          });
          continue;
        }

        groupsWithUrls.push({
          id: group.id,
          name: group.name,
          urls: groupUrls ? groupUrls.map(u => u.url) : [],
        });
      }
      setGroups(groupsWithUrls);

    } catch (error: any) {
      toast({
        title: "Ошибка загрузки",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Добавление URL
  const handleAddUrls = async (urls: string[], groupIdOrName?: string) => {
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
      setIsLoading(true);

      // --- Создание группы если указано название ---
      let groupId = "";
      if (groupIdOrName) {
        // Проверяем, есть ли группа с таким id
        let existing = groups.find(g => g.id === groupIdOrName || g.name === groupIdOrName);
        if (!existing) {
          const { data: createdGroup, error } = await supabase.from("url_groups")
            .insert({ name: groupIdOrName })
            .select()
            .single();
          if (error) {
            toast({
              title: "Ошибка создания группы",
              description: error.message,
              variant: "destructive"
            });
            setIsLoading(false);
            return;
          }
          groupId = createdGroup.id;
        } else {
          groupId = existing.id;
        }
      }

      toast({
        title: "Проверка URL",
        description: "Выполняется проверка URL...",
      });

      const newResults = await batchCheckIndexation(urls);

      // Сохраняем результаты в indexation_results
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

      // Сохраняем связи с группой (если есть)
      if (groupId) {
        const urlsToInsert = urls.map(url => ({
          group_id: groupId,
          url: url.trim(),
        }));
        await supabase.from("group_urls").upsert(urlsToInsert, { onConflict: "group_id,url" });
      }

      await fetchData();
      toast({
        title: "Готово!",
        description: `Добавлено ${newResults.length} URL для мониторинга.`
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Удаление URL
  const handleDeleteUrl = async (url: string) => {
    try {
      await supabase.from("indexation_results").delete().eq("url", url);
      await supabase.from("group_urls").delete().eq("url", url);
      await fetchData();
      toast({
        title: "URL удалён",
        description: "URL успешно удалён из мониторинга."
      });
    } catch (error: any) {
      toast({
        title: "Ошибка при удалении",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Проверить конкретный URL
  const handleCheckUrl = async (url: string) => {
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
      setIsLoading(true);
      toast({
        title: "Проверка URL",
        description: "Проверяется индексация..."
      });

      const [result] = await batchCheckIndexation([url]);
      if (result) {
        await supabase.from("indexation_results").upsert(
          {
            url: result.url,
            google: result.google,
            yandex: result.yandex,
            date: result.date,
          },
          { onConflict: "url" }
        );
        toast({
          title: "Проверка завершена",
          description: "Индексация обновлена."
        });
      }
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Ошибка при проверке",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Проверить все
  const handleRefreshAll = async () => {
    try {
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
        toast({
          title: "Нет URL",
          description: "Сначала добавьте адреса."
        });
        return;
      }
      setIsLoading(true);
      toast({
        title: "Обновление всех",
        description: "Проверяем все URL..."
      });
      const urls = results.map(r => r.url);
      const newResults = await batchCheckIndexation(urls);
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
      await fetchData();
      toast({
        title: "Обновлено",
        description: `${newResults.length} URL проверено`
      });
    } catch (error: any) {
      toast({
        title: "Ошибка обновления",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Статистика
  const totalUrls = results.length;
  const indexedInGoogle = results.filter(r => r.google).length;
  const indexedInYandex = results.filter(r => r.yandex).length;
  const notIndexedTotal = results.filter(r => !r.google || !r.yandex).length;
  const apiKeyExists = !!getApiKey();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Дашборд</h1>
        <div className="flex space-x-2">
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center"
            disabled={isLoading}
          >
            <RiAddLine className="mr-2 h-4 w-4" /> Добавить URL
          </Button>
          <Button
            variant="outline"
            onClick={handleRefreshAll}
            className="flex items-center"
            disabled={isLoading || results.length === 0}
          >
            <RiRefreshLine className="mr-2 h-4 w-4" /> Обновить все
          </Button>
        </div>
      </div>

      {!apiKeyExists && (
        <Alert variant="destructive">
          <AlertTitle>Требуется API ключ</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Для работы с проверкой индексации необходимо указать API ключ в настройках.</span>
            <Link to="/settings">
              <Button size="sm" variant="outline" className="flex items-center">
                <RiSettings4Line className="mr-2 h-4 w-4" /> Настройки
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Всего URL"
          value={totalUrls}
          icon={<RiLinksLine className="h-4 w-4" />}
        />
        <DashboardCard
          title="Индексируется в Google"
          value={`${indexedInGoogle} из ${totalUrls}`}
          icon={<span className="font-bold">G</span>}
          trend={totalUrls > 0 ? {
            value: Math.round((indexedInGoogle / totalUrls) * 100),
            isPositive: indexedInGoogle === totalUrls
          } : undefined}
        />
        <DashboardCard
          title="Индексируется в Яндекс"
          value={`${indexedInYandex} из ${totalUrls}`}
          icon={<span className="font-bold">Я</span>}
          trend={totalUrls > 0 ? {
            value: Math.round((indexedInYandex / totalUrls) * 100),
            isPositive: indexedInYandex === totalUrls
          } : undefined}
        />
        <DashboardCard
          title="Требуют внимания"
          value={notIndexedTotal}
          icon={<RiCheckLine className="h-4 w-4" />}
          className={notIndexedTotal > 0 ? "border-red-300" : undefined}
        />
      </div>

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
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4"
          >
            <RiAddLine className="mr-2 h-4 w-4" /> Добавить первый URL
          </Button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

