
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UrlGroup } from "@/types";

interface AddUrlModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (urls: string[], groupIdOrName?: string) => void;
  groups: UrlGroup[];
}

const AddUrlModal = ({ open, onClose, onAdd, groups }: AddUrlModalProps) => {
  const [urls, setUrls] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [newGroupName, setNewGroupName] = useState("");
  const [isNewGroup, setIsNewGroup] = useState(false);

  const handleSubmit = () => {
    const urlList = urls.split("\n").map((url) => url.trim()).filter((url) => url !== "");
    if (urlList.length === 0) return;

    if (isNewGroup && newGroupName.trim()) {
      onAdd(urlList, newGroupName.trim());
    } else if (selectedGroup) {
      onAdd(urlList, selectedGroup);
    } else {
      onAdd(urlList);
    }

    setUrls("");
    setSelectedGroup("");
    setNewGroupName("");
    setIsNewGroup(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Добавить URL для проверки</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="urls">URL адреса (по одному на строку)</Label>
            <Textarea
              id="urls"
              placeholder="https://example.com/page1&#10;https://example.com/page2"
              rows={5}
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Выберите группу</Label>
            <div className="flex gap-2">
              <Select
                disabled={isNewGroup}
                value={selectedGroup}
                onValueChange={setSelectedGroup}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите группу" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                onClick={() => setIsNewGroup(!isNewGroup)}
                type="button"
              >
                {isNewGroup ? "Выбрать существующую" : "Новая группа"}
              </Button>
            </div>
          </div>
          
          {isNewGroup && (
            <div className="grid gap-2">
              <Label htmlFor="newGroup">Название новой группы</Label>
              <Input
                id="newGroup"
                placeholder="Например: Блог"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
              />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Отмена</Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={urls.trim() === "" || (isNewGroup && newGroupName === "")}
          >
            Добавить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddUrlModal;
