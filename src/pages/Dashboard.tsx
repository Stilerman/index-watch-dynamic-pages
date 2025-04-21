
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import DashboardCard from "@/components/DashboardCard";
import IndexationTable from "@/components/IndexationTable";
import AddUrlModal from "@/components/AddUrlModal";
import { IndexationResult, UrlGroup } from "@/types";
import { RiAddLine, RiCheckLine, RiRefreshLine, RiLinksLine } from "react-icons/ri";
import { 
  getIndexationResults, 
  addIndexationResult, 
  removeIndexationResult,
  getUrlGroups,
  addUrlGroup,
  addUrlsToGroup
} from "@/services/storageService";
import { batchCheckIndexation } from "@/services/indexationApi";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const [results, setResults] = useState<IndexationResult[]>([]);
  const [groups, setGroups] = useState<UrlGroup[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Загрузка данных при монтировании
  useEffect(() => {
    setResults(getIndexationResults());
    setGroups(getUrlGroups());
  }, []);

  // Статистика для карточек
  const totalUrls = results.length;
  const indexedInGoogle = results.filter(r => r.google).length;
  const indexedInYandex = results.filter(r => r.yandex).length;
  const notIndexedTotal = results.filter(r => !r.google || !r.yandex).length;

  // Функция для добавления URL
  const handleAddUrls = async (urls: string[], groupName?: string) => {
    try {
      setIsLoading(true);
      
      // Если передано имя группы, создаем новую группу
      let groupId = "";
      if (groupName && groupName.trim() !== "") {
        const newGroup = addUrlGroup(groupName);
        groupId = newGroup.id;
        setGroups(getUrlGroups());
      }
      
      // Проверяем индексацию для всех URL
      const newResults = await batchCheckIndexation(urls);
      
      // Сохраняем результаты
      for (const result of newResults) {
        addIndexationResult(result);
      }
      
      // Обновляем состояние
      setResults(getIndexationResults());
      
      // Если был указан ID группы, добавляем URLs в эту группу
      if (groupId) {
        addUrlsToGroup(groupId, urls);
        setGroups(getUrlGroups());
      }
      
      toast({
        title: "URL добавлены",
        description: `Добавлено ${newResults.length} URL для мониторинга.`
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить URL. Проверьте API ключ и попробуйте снова.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для удаления URL
  const handleDeleteUrl = (url: string) => {
    removeIndexationResult(url);
    setResults(getIndexationResults());
    toast({
      title: "URL удален",
      description: "URL успешно удален из мониторинга."
    });
  };

  // Функция для проверки индексации одного URL
  const handleCheckUrl = async (url: string) => {
    try {
      setIsLoading(true);
      const [result] = await batchCheckIndexation([url]);
      
      if (result) {
        addIndexationResult(result);
        setResults(getIndexationResults());
        
        toast({
          title: "Проверка выполнена",
          description: "Индексация URL успешно проверена."
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось проверить индексацию. Попробуйте позже.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Функция для массовой проверки всех URL
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
        addIndexationResult(result);
      }
      
      setResults(getIndexationResults());
      
      toast({
        title: "Обновление выполнено",
        description: `Проверено ${newResults.length} URL.`
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные. Проверьте API ключ и попробуйте снова.",
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
