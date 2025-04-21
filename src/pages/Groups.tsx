
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UrlGroup } from "@/types";
import { 
  getUrlGroups, 
  addUrlGroup, 
  updateUrlGroup, 
  deleteUrlGroup 
} from "@/services/storageService";
import { RiAddLine } from "react-icons/ri";
import { useToast } from "@/components/ui/use-toast";
import UrlGroupCard from "@/components/UrlGroupCard";
import AddUrlModal from "@/components/AddUrlModal";

const Groups = () => {
  const [groups, setGroups] = useState<UrlGroup[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddUrlModalOpen, setIsAddUrlModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const { toast } = useToast();

  // Загрузка групп при монтировании
  useEffect(() => {
    setGroups(getUrlGroups());
  }, []);

  // Создание новой группы
  const handleCreateGroup = () => {
    if (newGroupName.trim() !== "") {
      addUrlGroup(newGroupName);
      setGroups(getUrlGroups());
      setNewGroupName("");
      setIsCreateModalOpen(false);
      
      toast({
        title: "Группа создана",
        description: `Группа "${newGroupName}" успешно создана.`
      });
    }
  };

  // Обновление группы
  const handleUpdateGroup = (id: string, name: string) => {
    updateUrlGroup(id, name);
    setGroups(getUrlGroups());
    
    toast({
      title: "Группа обновлена",
      description: `Название группы изменено на "${name}".`
    });
  };

  // Удаление группы
  const handleDeleteGroup = (id: string) => {
    const group = groups.find(g => g.id === id);
    if (!group) return;
    
    if (window.confirm(`Вы уверены, что хотите удалить группу "${group.name}"? URL страниц останутся в системе.`)) {
      deleteUrlGroup(id);
      setGroups(getUrlGroups());
      
      toast({
        title: "Группа удалена",
        description: `Группа "${group.name}" успешно удалена.`
      });
    }
  };

  // Обработчик добавления URL в группу
  const handleAddUrl = (groupId: string) => {
    setSelectedGroupId(groupId);
    setIsAddUrlModalOpen(true);
  };

  // Добавление URL в выбранную группу
  const handleAddUrlToGroup = (urls: string[]) => {
    // Функция добавления URL в группу будет реализована в родительском компоненте
    // и вызвана из модального окна AddUrlModal
    
    toast({
      title: "URL добавлены",
      description: `Добавлено ${urls.length} URL в группу.`
    });
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
