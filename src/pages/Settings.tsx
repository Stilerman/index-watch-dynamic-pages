
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiSettings } from "@/types";
import { getApiSettings, saveApiSettings } from "@/services/storageService";
import { setApiKey } from "@/services/indexationApi";
import { useToast } from "@/components/ui/use-toast";

const Settings = () => {
  const [settings, setSettings] = useState<ApiSettings>({
    key: "",
    checkInterval: 24,
    notificationsEnabled: true
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Загрузка настроек при монтировании
  useEffect(() => {
    setSettings(getApiSettings());
  }, []);

  // Обработчики изменения полей
  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, key: e.target.value }));
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setSettings(prev => ({ ...prev, checkInterval: value }));
    }
  };

  const handleNotificationsChange = (checked: boolean) => {
    setSettings(prev => ({ ...prev, notificationsEnabled: checked }));
  };

  // Сохранение настроек
  const handleSave = () => {
    setIsSaving(true);
    
    try {
      saveApiSettings(settings);
      setApiKey(settings.key);
      
      toast({
        title: "Настройки сохранены",
        description: "Ваши настройки успешно сохранены."
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить настройки.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Настройки</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Настройки API</CardTitle>
          <CardDescription>
            Настройте параметры работы с API для проверки индексации.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="api-key">API Ключ</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Введите ваш API ключ"
              value={settings.key}
              onChange={handleKeyChange}
            />
            <p className="text-xs text-gray-500">
              API ключ можно получить на сайте <a href="https://arsenkin.ru/tools/blog/api-indexation/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">arsenkin.ru</a>
            </p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="check-interval">Интервал проверки (часы)</Label>
            <Input
              id="check-interval"
              type="number"
              min="1"
              max="168"
              value={settings.checkInterval}
              onChange={handleIntervalChange}
            />
            <p className="text-xs text-gray-500">
              Как часто система будет проверять индексацию URL.
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications">Уведомления</Label>
              <p className="text-xs text-gray-500">
                Получать уведомления о вылете страниц из индекса.
              </p>
            </div>
            <Switch
              id="notifications"
              checked={settings.notificationsEnabled}
              onCheckedChange={handleNotificationsChange}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Сохранение..." : "Сохранить настройки"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Settings;
