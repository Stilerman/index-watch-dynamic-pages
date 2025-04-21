
import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    fetchIndexationResults();
    fetchGroups();
  }, []);

  const fetchIndexationResults = async () => {
    try {
      const { data: indexationResults, error } = await supabase
        .from("indexation_results")
        .select("*");

      if (error) {
        console.error("Ошибка при загрузке результатов индексации:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить результаты индексации",
          variant: "destructive"
        });
        return;
      }

      setResults(indexationResults || []);
    } catch (e: any) {
      console.error("Ошибка при загрузке результатов индексации:", e);
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить результаты индексации: " + e.message,
        variant: "destructive"
      });
    }
  };

  const fetchGroups = async () => {
    try {
      const { data: supaGroups, error } = await supabase
        .from("url_groups")
        .select("id, name");
        
      if (error) {
        console.error("Ошибка загрузки групп из Supabase:", error.message);
        toast({
          title: "Ошибка",
          description: `Не удалось загрузить группы: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      if (supaGroups) {
        const groupsWithUrls: UrlGroup[] = [];
        for (const group of supaGroups) {
          try {
            const { data: urls, error: urlsError } = await supabase
              .from("group_urls")
              .select("url")
              .eq("group_id", group.id);
              
            if (urlsError) {
              console.error(`Ошибка загрузки URL для группы ${group.id}:`, urlsError.message);
            }
              
            groupsWithUrls.push({
              id: group.id,
              name: group.name,
              urls: urls ? urls.map(u => u.url) : []
            });
          } catch (innerError: any) {
            console.error(`Ошибка при обработке группы ${group.id}:`, innerError);
          }
        }
        setGroups(groupsWithUrls);
      }
    } catch (e: any) {
      console.error("Ошибка при загрузке групп:", e);
      toast({
        title: "Ошибка",
        description: `Произошла ошибка при загрузке групп: ${e.message}`,
        variant: "destructive"
      });
    }
  };

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
      let groupId = "";

      const existingGroup = groups.find(g => g.id === groupIdOrName);

      if (groupIdOrName && !existingGroup) {
        const { data: newGroup, error } = await supabase
          .from("url_groups")
          .insert({ name: groupIdOrName })
          .select()
          .single();

        if (error) {
          toast({
            title: "Ошибка",
            description: `Не удалось создать группу: ${error.message}`,
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        groupId = newGroup.id;
      } else if (existingGroup) {
        groupId = existingGroup.id;
      }

      toast({
        title: "Проверка URL",
        description: "Начата проверка индексации URL...",
      });

      const newResults = await batchCheckIndexation(urls);
      console.log("Результаты проверки:", newResults);

      for (const result of newResults) {
        const { error } = await supabase
          .from("indexation_results")
          .upsert({
            url: result.url,
            google: result.google,
            yandex: result.yandex,
            date: result.date
          }, { onConflict: 'url' });
          
        if (error) {
          console.error("Ошибка при сохранении результата:", error);
        }
      }

      if (groupId) {
        const urlInserts = urls.map(url => ({
          group_id: groupId,
          url: url.trim()
        }));
        
        const { error } = await supabase
          .from("group_urls")
          .upsert(urlInserts, { onConflict: 'group_id,url' });
          
        if (error) {
          console.error("Ошибка при добавлении URL в группу:", error);
        }
      }

      // Обновляем данные сразу после добавления
      await fetchIndexationResults();
      await fetchGroups();

      toast({
        title: "URL добавлены",
        description: `Добавлено ${newResults.length} URL для мониторинга.`
      });
    } catch (error: any) {
      console.error("Ошибка при добавлении URL:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить URL: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUrl = async (url: string) => {
    try {
      const { error } = await supabase
        .from("indexation_results")
        .delete()
        .eq("url", url);
        
      if (error) {
        throw new Error(error.message);
      }
      
      const { error: groupUrlError } = await supabase
        .from("group_urls")
        .delete()
        .eq("url", url);
        
      if (groupUrlError) {
        console.error("Ошибка при удалении URL из групп:", groupUrlError);
      }
      
      // Обновляем локальные данные немедленно
      setResults(results.filter(r => r.url !== url));
      
      // Также обновляем группы
      fetchGroups();
      
      toast({
        title: "URL удален",
        description: "URL успешно удален из мониторинга."
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить URL: " + error.message,
        variant: "destructive"
      });
    }
  };

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
        description: `Проверяется индексация для ${url}...`
      });
      
      const [result] = await batchCheckIndexation([url]);
      
      if (result) {
        const { error } = await supabase
          .from("indexation_results")
          .upsert({
            url: result.url,
            google: result.google,
            yandex: result.yandex,
            date: result.date
          }, { onConflict: 'url' });
          
        if (error) {
          throw new Error(error.message);
        }
        
        // Обновляем локальные данные немедленно
        setResults(prevResults => 
          prevResults.map(r => 
            r.url === result.url ? result : r
          )
        );
        
        toast({
          title: "Проверка выполнена",
          description: "Индексация URL успешно проверена."
        });
      }
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: "Не удалось проверить индексацию: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshAll = async () => {
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
          description: "Добавьте URL для мониторинга."
        });
        return;
      }
      
      setIsLoading(true);
      const urls = results.map(r => r.url);
      
      toast({
        title: "Обновление",
        description: `Начата проверка индексации ${urls.length} URL...`
      });
      
      const newResults = await batchCheckIndexation(urls);
      
      for (const result of newResults) {
        const { error } = await supabase
          .from("indexation_results")
          .upsert({
            url: result.url,
            google: result.google,
            yandex: result.yandex,
            date: result.date
          }, { onConflict: 'url' });
          
        if (error) {
          console.error("Ошибка обновления индексации:", error);
        }
      }
      
      // Обновляем локальные данные вместо запроса к серверу
      setResults(newResults);
      
      toast({
        title: "Обновление выполнено",
        description: `Проверено ${newResults.length} URL.`
      });
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Вычисляем статистику на основе актуальных данных
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
