
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { IndexationResult, UrlGroup } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Возвращает состояния для dashboard: {results, groups, loading, reload()}
export function useDashboardData() {
  const [results, setResults] = useState<IndexationResult[]>([]);
  const [groups, setGroups] = useState<UrlGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("Загрузка данных из базы...");
      
      // Получаем результаты индексации
      const { data: dbResults, error: resultsError } = await supabase
        .from("indexation_results")
        .select("*")
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

      // Получаем группы
      const { data: dbGroups, error: groupsError } = await supabase
        .from("url_groups")
        .select("*");
        
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
      
      // Для каждой группы — подтягиваем ее url
      const groupsWithUrls: UrlGroup[] = [];
      for (const group of dbGroups ?? []) {
        const { data: groupUrls, error: urlsError } = await supabase
          .from("group_urls")
          .select("url")
          .eq("group_id", group.id);
          
        if (urlsError) {
          console.error("Ошибка загрузки URL для группы:", group.id, urlsError);
          continue;
        }

        groupsWithUrls.push({
          id: group.id,
          name: group.name,
          urls: groupUrls?.map(u => u.url) || [],
        });
      }
      
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
