
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IndexationResult, UrlGroup } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useDashboardData(selectedGroup?: string, limit = 50) {
  const [results, setResults] = useState<IndexationResult[]>([]);
  const [groups, setGroups] = useState<UrlGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("Загрузка данных из базы...");
      
      // Базовый запрос для получения групп
      let groupQuery = supabase
        .from("url_groups")
        .select(`
          id,
          name,
          group_urls!inner (
            url
          )
        `);

      // Получаем результаты индексации с фильтрацией по группе
      let resultsQuery = supabase
        .from("indexation_results")
        .select("*, group_urls!inner(group_id)", { count: 'exact' })
        .order("date", { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      // Если выбрана группа, добавляем фильтрацию
      if (selectedGroup) {
        groupQuery = groupQuery.eq("id", selectedGroup);
        resultsQuery = resultsQuery.eq("group_urls.group_id", selectedGroup);
      }

      const [groupsResponse, resultsResponse] = await Promise.all([
        groupQuery,
        resultsQuery
      ]);

      if (groupsResponse.error) {
        console.error("Ошибка загрузки групп:", groupsResponse.error);
        toast({
          title: "Ошибка загрузки групп",
          description: groupsResponse.error.message,
          variant: "destructive"
        });
        return;
      }

      if (resultsResponse.error) {
        console.error("Ошибка загрузки результатов:", resultsResponse.error);
        toast({
          title: "Ошибка загрузки результатов",
          description: resultsResponse.error.message,
          variant: "destructive"
        });
        return;
      }

      // Преобразуем данные о группах
      const processedGroups = groupsResponse.data?.map(group => ({
        id: group.id,
        name: group.name,
        urls: group.group_urls.map(gu => gu.url)
      })) || [];

      setGroups(processedGroups);
      setResults(resultsResponse.data ?? []);
      setTotalResults(resultsResponse.count ?? 0);
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
  }, [toast, selectedGroup, page, limit]);

  useEffect(() => { 
    console.log("Первичная загрузка данных...");
    fetchData(); 
  }, [fetchData]);

  return { 
    results, 
    groups, 
    isLoading, 
    reload: fetchData, 
    page, 
    setPage, 
    totalResults, 
    limit 
  };
}
