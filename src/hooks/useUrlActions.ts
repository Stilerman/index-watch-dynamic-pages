
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { batchCheckIndexation, getApiKey } from "@/services/indexationApi";
import { UrlGroup, IndexationResult } from "@/types";

// Группы и список результатов передаются из useDashboardData
export function useUrlActions(params: {
  reload: () => Promise<void>,
  groups: UrlGroup[],
  results: IndexationResult[],
}) {
  const { reload, groups, results } = params;
  const { toast } = useToast();

  // Добавление URL (либо в существующую, либо в новую группу)
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

      let groupId = "";
      if (groupIdOrName) {
        let existing = groups.find(g => g.id === groupIdOrName || g.name === groupIdOrName);
        if (!existing) {
          const newGroupId = uuidv4();
          const { data: createdGroup, error } = await supabase.from("url_groups")
            .insert({ id: newGroupId, name: groupIdOrName })
            .select()
            .maybeSingle();
          if (error) {
            toast({
              title: "Ошибка создания группы",
              description: error.message,
              variant: "destructive"
            });
            return;
          }
          groupId = createdGroup ? createdGroup.id : newGroupId;
        } else {
          groupId = existing.id;
        }
      }

      toast({ title: "Проверка URL", description: "Выполняется проверка URL..." });
      const newResults = await batchCheckIndexation(urls);

      // Сохраняем результаты в базу
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

      // Связываем URLs с группой
      if (groupId) {
        const urlsToInsert = urls.map(url => ({
          id: uuidv4(),
          group_id: groupId,
          url: url.trim(),
        }));

        // ВАЖНО: исправляем вызов upsert для массива
        await supabase.from("group_urls").upsert(urlsToInsert, { onConflict: "id" });
      }

      await reload();
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
    }
  };

  const handleDeleteUrl = async (url: string) => {
    try {
      await supabase
        .from("indexation_results")
        .delete()
        .eq("url", url);

      await supabase
        .from("group_urls")
        .delete()
        .eq("url", url);

      await reload();
      toast({ title: "URL удалён", description: "URL успешно удалён из мониторинга." });
    } catch (error: any) {
      toast({
        title: "Ошибка при удалении",
        description: error.message,
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
      toast({ title: "Проверка URL", description: "Проверяется индексация..." });
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
        toast({ title: "Проверка завершена", description: "Индексация обновлена." });
      }

      await reload();
    } catch (error: any) {
      toast({
        title: "Ошибка при проверке",
        description: error.message,
        variant: "destructive"
      });
    }
  };

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
        toast({ title: "Нет URL", description: "Сначала добавьте адреса." });
        return;
      }

      toast({ title: "Обновление всех", description: "Проверяем все URL..." });

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

      await reload();
      toast({ title: "Обновлено", description: `${newResults.length} URL проверено` });
    } catch (error: any) {
      toast({
        title: "Ошибка обновления",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return {
    handleAddUrls,
    handleDeleteUrl,
    handleCheckUrl,
    handleRefreshAll,
  };
}
