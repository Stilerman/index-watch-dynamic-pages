
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
      
      // Fetch groups and group URLs
      const { data: groupsData, error: groupsError } = await supabase
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
        return;
      }

      // Process groups data
      const processedGroups = groupsData?.map(group => ({
        id: group.id,
        name: group.name,
        urls: group.group_urls.map(gu => gu.url)
      })) || [];
      
      setGroups(processedGroups);
      
      // Get URLs to filter by if a group is selected
      const selectedUrls = selectedGroup 
        ? processedGroups.find(g => g.id === selectedGroup)?.urls || []
        : [];
      
      // Query for indexation results with proper filtering
      let resultsQuery = supabase
        .from("indexation_results")
        .select("*", { count: 'exact' })
        .order("date", { ascending: false });
      
      // Apply filtering by group if selected
      if (selectedGroup && selectedUrls.length > 0) {
        resultsQuery = resultsQuery.in('url', selectedUrls);
      }
      
      // Apply pagination
      resultsQuery = resultsQuery.range((page - 1) * limit, page * limit - 1);

      const { data: resultsData, count, error: resultsError } = await resultsQuery;

      if (resultsError) {
        console.error("Ошибка загрузки результатов:", resultsError);
        toast({
          title: "Ошибка загрузки результатов",
          description: resultsError.message,
          variant: "destructive"
        });
        return;
      }

      setResults(resultsData ?? []);
      setTotalResults(count ?? 0);
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
