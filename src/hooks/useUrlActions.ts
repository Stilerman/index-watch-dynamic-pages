
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
      console.log("Добавляем URLs:", urls);
      if (groupIdOrName) {
        console.log("В группу:", groupIdOrName);
      }
      
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
        // Проверяем, существует ли такая группа
        let existing = groups.find(g => g.id === groupIdOrName || g.name === groupIdOrName);
        if (!existing) {
          // Если группы нет, создаем новую
          const newGroupId = uuidv4();
          const { data: createdGroup, error } = await supabase.from("url_groups")
            .insert({ id: newGroupId, name: groupIdOrName })
            .select()
            .maybeSingle();
          if (error) {
            console.error("Ошибка создания группы:", error);
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
      
      // Проверка индексации
      console.log("Пакетная проверка", urls.length, "URL адресов");
      const newResults = await batchCheckIndexation(urls);
      console.log("Получены результаты проверки:", newResults);

      // Сохраняем результаты в базу
      for (const result of newResults) {
        // Используем insert вместо upsert
        const { error } = await supabase.from("indexation_results")
          .insert({
            id: uuidv4(),
            url: result.url,
            google: result.google,
            yandex: result.yandex,
            date: result.date,
          });
          
        if (error) {
          console.error("Ошибка при сохранении результата:", error);
          // Продолжаем обработку других результатов
        }
      }

      // Связываем URLs с группой, если указана группа
      if (groupId) {
        for (const url of urls) {
          const { error } = await supabase.from("group_urls")
            .insert({
              id: uuidv4(),
              group_id: groupId,
              url: url.trim(),
            });
            
          if (error) {
            console.error("Ошибка при связывании URL с группой:", error);
          }
        }
      }

      // Перезагружаем данные
      await reload();
      
      toast({
        title: "Готово!",
        description: `Добавлено ${newResults.length} URL для мониторинга.`
      });
    } catch (error: any) {
      console.error("Ошибка при добавлении URL:", error);
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteUrl = async (url: string) => {
    try {
      // Удаляем из таблицы результатов
      const { error: resultError } = await supabase
        .from("indexation_results")
        .delete()
        .eq("url", url);

      if (resultError) {
        console.error("Ошибка при удалении из результатов:", resultError);
      }

      // Удаляем связи с группами
      const { error: groupError } = await supabase
        .from("group_urls")
        .delete()
        .eq("url", url);

      if (groupError) {
        console.error("Ошибка при удалении связей с группами:", groupError);
      }

      await reload();
      toast({ title: "URL удалён", description: "URL успешно удалён из мониторинга." });
    } catch (error: any) {
      console.error("Ошибка при удалении URL:", error);
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
        // Обновляем запись в БД - используем insert вместо upsert
        const { error } = await supabase.from("indexation_results")
          .insert({
            id: uuidv4(),
            url: result.url,
            google: result.google,
            yandex: result.yandex,
            date: result.date,
          });
          
        if (error) {
          console.error("Ошибка при обновлении результата:", error);
          throw new Error("Не удалось обновить результат: " + error.message);
        }
        
        toast({ title: "Проверка завершена", description: "Индексация обновлена." });
      }

      await reload();
    } catch (error: any) {
      console.error("Ошибка при проверке URL:", error);
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

      // Обновляем записи в БД - используем insert вместо upsert
      for (const result of newResults) {
        const { error } = await supabase.from("indexation_results")
          .insert({
            id: uuidv4(),
            url: result.url,
            google: result.google,
            yandex: result.yandex,
            date: result.date,
          });
          
        if (error) {
          console.error("Ошибка при обновлении результата:", error, "для URL:", result.url);
        }
      }

      await reload();
      toast({ title: "Обновлено", description: `${newResults.length} URL проверено` });
    } catch (error: any) {
      console.error("Ошибка обновления:", error);
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
