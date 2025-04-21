
import React, { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UrlGroup } from "@/types";

interface AddUrlModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (urls: string[], groupIdOrName?: string) => void;
  groups: UrlGroup[];
}

const AddUrlModal = ({ open, onClose, onAdd, groups }: AddUrlModalProps) => {
  const [urlsInput, setUrlsInput] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);

  const handleSubmit = () => {
    // Разделяем URL по переносу строки и убираем пустые строки
    const urls = urlsInput
      .split("\n")
      .map(url => url.trim())
      .filter(url => url !== "");

    if (urls.length === 0) return;

    // Используем либо ID существующей группы, либо название новой
    const groupIdOrName = isCreatingNewGroup 
      ? newGroupName.trim() 
      : selectedGroupId;

    console.log("Добавляем URLs:", urls);
    console.log("В группу:", groupIdOrName);
    
    onAdd(urls, groupIdOrName);
    resetForm();
  };

  const resetForm = () => {
    setUrlsInput("");
    setSelectedGroupId("");
    setNewGroupName("");
    setIsCreatingNewGroup(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить URL</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="urls">URL адреса</Label>
            <Textarea
              id="urls"
              value={urlsInput}
              onChange={(e) => setUrlsInput(e.target.value)}
              placeholder="Введите URL-адреса, по одному на строку"
              rows={5}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Группа</Label>
            
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant={isCreatingNewGroup ? "outline" : "default"}
                onClick={() => setIsCreatingNewGroup(false)}
                className="w-1/2"
              >
                Существующая группа
              </Button>
              
              <Button
                type="button"
                variant={!isCreatingNewGroup ? "outline" : "default"}
                onClick={() => setIsCreatingNewGroup(true)}
                className="w-1/2"
              >
                Новая группа
              </Button>
            </div>
            
            {isCreatingNewGroup ? (
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Название новой группы"
              />
            ) : (
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите группу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {groups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={resetForm}>
            Отмена
          </Button>
          <Button onClick={handleSubmit}>
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUrlModal;
