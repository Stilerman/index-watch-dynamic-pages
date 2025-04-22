
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IndexationResult, UrlGroup } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useDashboardData() {
  const [results, setResults] = useState<IndexationResult[]>([]);
  const [groups, setGroups] = useState<UrlGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("Загрузка данных из базы...");
      
      // Проверяем соединение с базой данных
      const { error: pingError } = await supabase.from("urls").select("count").limit(1);
      if (pingError) {
        console.error("Ошибка соединения с базой данных:", pingError);
        toast({
          title: "Ошибка соединения с БД",
          description: pingError.message,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Получаем результаты индексации
      const { data: dbResults, error: resultsError } = await supabase
        .from("indexation_results")
        .select("url, google, yandex, date")
        .order("date", { ascending: false });
        
      if (resultsError) {
        console.error("Ошибка загрузки результатов:", resultsError);
        toast({
          title: "Ошибка загрузки результатов",
          description: resultsError.message,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      console.log("Загружено результатов:", dbResults?.length);
      setResults(dbResults ?? []);

      // Получаем группы и их URL
      const { data: groups, error: groupsError } = await supabase
        .from("url_groups")
        .select(`
          id,
          name,
          group_urls!inner (
            url
          )
        `);

      if (groupsError) {
        console.error("Ошибка загрузки групп:", groupsError);
        toast({
          title: "Ошибка загрузки групп",
          description: groupsError.message,
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Преобразуем данные в нужный формат
      const groupsWithUrls = groups?.map(group => ({
        id: group.id,
        name: group.name,
        urls: group.group_urls.map(gu => gu.url)
      })) || [];
      
      console.log("Загружено групп:", groupsWithUrls.length);
      setGroups(groupsWithUrls);
      
    } catch (err: any) {
      console.error("Ошибка загрузки данных:", err);
      toast({
        title: "Ошибка загрузки",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { 
    console.log("Первичная загрузка данных...");
    fetchData(); 
  }, [fetchData]);

  return { results, groups, isLoading, reload: fetchData };
}
