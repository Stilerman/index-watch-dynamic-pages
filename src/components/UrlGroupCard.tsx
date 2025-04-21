
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UrlGroup } from "@/types";
import { RiEditLine, RiDeleteBin6Line, RiAddLine } from "react-icons/ri";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UrlGroupCardProps {
  group: UrlGroup;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onAddUrl: (groupId: string) => void;
}

const UrlGroupCard = ({ group, onUpdate, onDelete, onAddUrl }: UrlGroupCardProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState(group.name);

  const handleEdit = () => {
    if (newGroupName.trim() !== "") {
      onUpdate(group.id, newGroupName);
      setIsEditModalOpen(false);
    }
  };

  const openEditModal = () => {
    setNewGroupName(group.name);
    setIsEditModalOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-bold">{group.name}</CardTitle>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={openEditModal}>
              <RiEditLine className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onDelete(group.id)}
            >
              <RiDeleteBin6Line className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <Badge variant="outline">{group.urls.length} URL</Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onAddUrl(group.id)}
              className="flex items-center"
            >
              <RiAddLine className="mr-1 h-4 w-4" /> Добавить URL
            </Button>
          </div>
          <div className="max-h-32 overflow-y-auto">
            <ul className="space-y-1">
              {group.urls.slice(0, 5).map((url, index) => (
                <li key={index} className="text-xs text-gray-600 truncate">
                  {url}
                </li>
              ))}
              {group.urls.length > 5 && (
                <li className="text-xs text-gray-500 italic">
                  и еще {group.urls.length - 5} URL...
                </li>
              )}
              {group.urls.length === 0 && (
                <li className="text-xs text-gray-500 italic">
                  Нет URL в этой группе
                </li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Редактировать группу</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="groupName">Название группы</Label>
            <Input
              id="groupName"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="mt-2"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleEdit}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UrlGroupCard;
