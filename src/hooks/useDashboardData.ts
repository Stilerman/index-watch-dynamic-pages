
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
      console.log("Выбранная группа:", selectedGroup);
      
      // 1. Загружаем все группы
      const { data: groupsData, error: groupsError } = await supabase
        .from("url_groups")
        .select(`
          id,
          name,
          group_urls (
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
        return;
      }

      // Обрабатываем данные групп
      const processedGroups = groupsData?.map(group => ({
        id: group.id,
        name: group.name,
        urls: group.group_urls?.map(gu => gu.url) || []
      })) || [];
      
      setGroups(processedGroups);
      
      // Получаем URLs для фильтрации по группе
      const selectedUrls = selectedGroup 
        ? processedGroups.find(g => g.id === selectedGroup)?.urls || []
        : [];
      
      console.log("Выбранная группа:", selectedGroup);
      console.log("URLs в выбранной группе:", selectedUrls);
      
      // Получаем общее количество результатов для пагинации
      let countQuery = supabase
        .from("indexation_results")
        .select("*", { count: 'exact', head: true });
      
      // Применяем фильтрацию по группе если она выбрана
      if (selectedGroup && selectedUrls.length > 0) {
        countQuery = countQuery.in('url', selectedUrls);
      }
      
      const { count: totalCount, error: countError } = await countQuery;
      
      if (countError) {
        console.error("Ошибка получения общего количества:", countError);
        toast({
          title: "Ошибка получения общего количества",
          description: countError.message,
          variant: "destructive"
        });
        return;
      }
      
      console.log("Общее количество результатов:", totalCount);
      
      // Получаем результаты с пагинацией
      let resultsQuery = supabase
        .from("indexation_results")
        .select("*")
        .order("date", { ascending: false });
      
      // Применяем фильтрацию по группе
      if (selectedGroup && selectedUrls.length > 0) {
        console.log("Применение фильтра по группе. URLs:", selectedUrls);
        resultsQuery = resultsQuery.in('url', selectedUrls);
      } else if (selectedGroup && selectedUrls.length === 0) {
        console.log("Выбрана группа без URL, возвращаем пустой результат");
        setResults([]);
        setTotalResults(0);
        setIsLoading(false);
        return;
      }
      
      // Применяем пагинацию
      const from = (page - 1) * limit;
      const to = page * limit - 1;
      console.log(`Применение пагинации: from=${from}, to=${to}`);
      resultsQuery = resultsQuery.range(from, to);

      const { data: resultsData, error: resultsError } = await resultsQuery;

      if (resultsError) {
        console.error("Ошибка загрузки результатов:", resultsError);
        toast({
          title: "Ошибка загрузки результатов",
          description: resultsError.message,
          variant: "destructive"
        });
        return;
      }

      console.log("Загружено результатов:", resultsData?.length);
      setResults(resultsData ?? []);
      setTotalResults(totalCount ?? 0);
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
    console.log("Запуск загрузки данных с параметрами:", { selectedGroup, page, limit });
    fetchData(); 
    // Сбрасываем страницу на 1 при изменении группы
    if (selectedGroup) {
      setPage(1);
    }
  }, [fetchData, selectedGroup]);

  useEffect(() => {
    fetchData();
  }, [fetchData, page, limit]);

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
