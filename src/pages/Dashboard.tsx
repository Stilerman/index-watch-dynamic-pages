import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DashboardCard from "@/components/DashboardCard";
import IndexationTable from "@/components/IndexationTable";
import AddUrlModal from "@/components/AddUrlModal";
import { IndexationResult, UrlGroup } from "@/types";
import { RiAddLine, RiCheckLine, RiRefreshLine, RiLinksLine } from "react-icons/ri";
import { batchCheckIndexation } from "@/services/indexationApi";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  const totalUrls = results.length;
  const indexedInGoogle = results.filter(r => r.google).length;
  const indexedInYandex = results.filter(r => r.yandex).length;
  const notIndexedTotal = results.filter(r => !r.google || !r.yandex).length;

  const handleAddUrls = async (urls: string[], groupIdOrName?: string) => {
    try {
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

      const newResults = await batchCheckIndexation(urls);

      for (const result of newResults) {
        await supabase
          .from("indexation_results")
          .upsert({
            url: result.url,
            google: result.google,
            yandex: result.yandex,
            date: result.date
          }, { onConflict: 'url' });
      }

      if (groupId) {
        const urlInserts = urls.map(url => ({
          group_id: groupId,
          url: url.trim()
        }));
        await supabase
          .from("group_urls")
          .upsert(urlInserts, { onConflict: 'group_id,url' });
      }

      await fetchIndexationResults();
      await fetchGroups();

      toast({
        title: "URL добавлены",
        description: `Добавлено ${newResults.length} URL для мониторинга.`
      });
    } catch (error: any) {
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
      
      setResults(results.filter(r => r.url !== url));
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
      setIsLoading(true);
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
        
        fetchIndexationResults();
        
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
      if (results.length === 0) {
        toast({
          title: "Нет URL для проверки",
          description: "Добавьте URL для мониторинга."
        });
        return;
      }
      
      setIsLoading(true);
      const urls = results.map(r => r.url);
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
      
      fetchIndexationResults();
      
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
    </div>
  );
};

export default Dashboard;
