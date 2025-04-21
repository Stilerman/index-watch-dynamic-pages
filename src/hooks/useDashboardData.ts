
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
      // Получаем результаты индексации
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
        setIsLoading(false);
        return;
      }
      setResults(dbResults ?? []);

      // Получаем группы
      const { data: dbGroups, error: groupsError } = await supabase
        .from("url_groups")
        .select("*");
      if (groupsError) {
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
        const { data: groupUrls } = await supabase
          .from("group_urls")
          .select("url")
          .eq("group_id", group.id);

        groupsWithUrls.push({
          id: group.id,
          name: group.name,
          urls: groupUrls ? groupUrls.map(u => u.url) : [],
        });
      }
      setGroups(groupsWithUrls);
    } catch (err: any) {
      toast({
        title: "Ошибка загрузки",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { results, groups, isLoading, reload: fetchData };
}
