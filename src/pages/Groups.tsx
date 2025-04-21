
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UrlGroup } from "@/types";
import { RiAddLine } from "react-icons/ri";
import { useToast } from "@/hooks/use-toast";
import UrlGroupCard from "@/components/UrlGroupCard";
import AddUrlModal from "@/components/AddUrlModal";
import { supabase } from "@/integrations/supabase/client";

const Groups = () => {
  const [groups, setGroups] = useState<UrlGroup[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddUrlModalOpen, setIsAddUrlModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchGroups();
  }, []);

  // Функция для получения групп из Supabase
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
        // Теперь для каждой группы подтянем список url
        const groupsWithUrls: UrlGroup[] = [];
        for (const group of supaGroups) {
          try {
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
          } catch (innerError: any) {
            console.error(`Ошибка при обработке группы ${group.id}:`, innerError);
          }
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

  // Создание новой группы
  const handleCreateGroup = async () => {
    if (newGroupName.trim() !== "") {
      try {
        const { data, error } = await supabase
          .from("url_groups")
          .insert({ name: newGroupName.trim() })
          .select()
          .single();
          
        if (error) {
          toast({
            title: "Ошибка",
            description: `Не удалось создать группу: ${error.message}`,
            variant: "destructive"
          });
          return;
        }
        
        // Добавляем новую группу в локальное состояние
        setGroups([...groups, { id: data.id, name: data.name, urls: [] }]);
        setNewGroupName("");
        setIsCreateModalOpen(false);
        
        toast({
          title: "Группа создана",
          description: `Группа "${newGroupName}" успешно создана.`
        });
      } catch (e: any) {
        toast({
          title: "Ошибка",
          description: `Не удалось создать группу: ${e.message}`,
          variant: "destructive"
        });
      }
    }
  };

  // Обновление группы
  const handleUpdateGroup = async (id: string, name: string) => {
    try {
      const { error } = await supabase
        .from("url_groups")
        .update({ name })
        .eq("id", id);
        
      if (error) {
        toast({
          title: "Ошибка",
          description: `Не удалось обновить группу: ${error.message}`,
          variant: "destructive"
        });
        return;
      }
      
      // Обновляем группу в локальном состоянии
      setGroups(groups.map(g => g.id === id ? { ...g, name } : g));
      
      toast({
        title: "Группа обновлена",
        description: `Название группы изменено на "${name}".`
      });
    } catch (e: any) {
      toast({
        title: "Ошибка",
        description: `Не удалось обновить группу: ${e.message}`,
        variant: "destructive"
      });
    }
  };

  // Удаление группы
  const handleDeleteGroup = async (id: string) => {
    const group = groups.find(g => g.id === id);
    if (!group) return;
    
    if (window.confirm(`Вы уверены, что хотите удалить группу "${group.name}"? URL страниц останутся в системе.`)) {
      try {
        // Сначала удаляем связи с URL
        const { error: urlsError } = await supabase
          .from("group_urls")
          .delete()
          .eq("group_id", id);
          
        if (urlsError) {
          console.error("Ошибка при удалении URL из группы:", urlsError);
        }
        
        // Затем удаляем саму группу
        const { error } = await supabase
          .from("url_groups")
          .delete()
          .eq("id", id);
          
        if (error) {
          toast({
            title: "Ошибка",
            description: `Не удалось удалить группу: ${error.message}`,
            variant: "destructive"
          });
          return;
        }
        
        // Удаляем группу из локального состояния
        setGroups(groups.filter(g => g.id !== id));
        
        toast({
          title: "Группа удалена",
          description: `Группа "${group.name}" успешно удалена.`
        });
      } catch (e: any) {
        toast({
          title: "Ошибка",
          description: `Не удалось удалить группу: ${e.message}`,
          variant: "destructive"
        });
      }
    }
  };

  const handleAddUrl = (groupId: string) => {
    setSelectedGroupId(groupId);
    setIsAddUrlModalOpen(true);
  };

  // Добавляем URL в группу
  const handleAddUrlToGroup = async (urls: string[], groupIdOrName?: string) => {
    try {
      // Если передана строка, она может быть либо ID существующей группы, либо названием новой группы
      let targetGroupId = groupIdOrName || selectedGroupId;
      
      if (!targetGroupId || urls.length === 0) {
        toast({
          title: "Ошибка",
          description: "Необходимо указать группу и URL",
          variant: "destructive"
        });
        return;
      }
      
      // Проверяем, существует ли такая группа
      let existingGroup = groups.find(g => g.id === targetGroupId);
      
      // Если группы нет, создаём новую
      if (!existingGroup) {
        const { data: newGroup, error: createError } = await supabase
          .from("url_groups")
          .insert({ name: targetGroupId })
          .select()
          .single();
          
        if (createError) {
          toast({
            title: "Ошибка",
            description: `Не удалось создать группу: ${createError.message}`,
            variant: "destructive"
          });
          return;
        }
        
        targetGroupId = newGroup.id;
      }
      
      // Сохраняем URL-ы в Supabase
      const inserts = urls.map((url) => ({
        group_id: targetGroupId,
        url: url.trim(),
      }));
      
      const { error } = await supabase
        .from("group_urls")
        .upsert(inserts, { onConflict: 'group_id,url' });
        
      if (error) {
        console.error("Ошибка при добавлении URL:", error);
        toast({
          title: "Ошибка",
          description: "При добавлении URL возникла ошибка: " + error.message,
          variant: "destructive"
        });
        return;
      }
      
      // Обновляем список групп
      await fetchGroups();
      
      toast({
        title: "URL добавлены",
        description: `Добавлено ${urls.length} URL в группу.`,
      });
    } catch (e: any) {
      console.error("Ошибка при добавлении URL:", e);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить URL: " + e.message,
        variant: "destructive"
      });
    }
    setIsAddUrlModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Группы URL</h1>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center"
        >
          <RiAddLine className="mr-2 h-4 w-4" /> Создать группу
        </Button>
      </div>

      {groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(group => (
            <UrlGroupCard 
              key={group.id}
              group={group}
              onUpdate={handleUpdateGroup}
              onDelete={handleDeleteGroup}
              onAddUrl={handleAddUrl}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Нет созданных групп</h3>
          <p className="text-gray-500">
            Создайте группу для организации URL адресов по категориям.
          </p>
        </div>
      )}

      {/* Модальное окно создания группы */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Создание новой группы</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="groupName">Название группы</Label>
            <Input
              id="groupName"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Например: Блог, Страницы каталога и т.д."
              className="mt-2"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleCreateGroup} disabled={newGroupName.trim() === ""}>
              Создать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Модальное окно добавления URL */}
      <AddUrlModal
        open={isAddUrlModalOpen}
        onClose={() => setIsAddUrlModalOpen(false)}
        onAdd={handleAddUrlToGroup}
        groups={groups}
      />
    </div>
  );
};

export default Groups;
