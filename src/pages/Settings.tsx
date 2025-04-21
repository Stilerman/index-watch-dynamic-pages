
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getApiKey, setApiKey } from "@/services/indexationApi";
import { useToast } from "@/hooks/use-toast";
import { RiInformationLine } from "react-icons/ri";

const Settings = () => {
  const [apiKey, setApiKeyLocal] = useState("");
  const [checkInterval, setCheckInterval] = useState("24");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Загрузка API ключа при монтировании компонента
    setApiKeyLocal(getApiKey());
    
    // Загрузка других настроек из localStorage
    const savedInterval = localStorage.getItem("check-interval") || "24";
    setCheckInterval(savedInterval);
    
    const savedNotifications = localStorage.getItem("notifications-enabled");
    setNotificationsEnabled(savedNotifications === null ? true : savedNotifications === "true");
  }, []);

  const handleSaveSettings = () => {
    // Сохраняем API ключ
    setApiKey(apiKey);
    
    // Сохраняем другие настройки
    localStorage.setItem("check-interval", checkInterval);
    localStorage.setItem("notifications-enabled", String(notificationsEnabled));
    
    toast({
      title: "Настройки сохранены",
      description: "Ваши настройки успешно сохранены",
    });
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
            Настройка подключения к API для проверки индексации
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-key">API Ключ</Label>
            <Input
              id="api-key"
              value={apiKey}
              onChange={(e) => setApiKeyLocal(e.target.value)}
              placeholder="Введите ваш API ключ"
            />
            <p className="text-sm text-gray-500">
              Ключ для доступа к API проверки индексации.
            </p>
          </div>

          <Alert variant="default" className="bg-blue-50 border-blue-200">
            <RiInformationLine className="h-4 w-4" />
            <AlertTitle>Важно</AlertTitle>
            <AlertDescription>
              Для работы с приложением необходимо указать действующий API ключ. 
              После указания ключа вы сможете проверять индексацию URL в поисковых системах.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveSettings}>Сохранить настройки</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Настройки проверки</CardTitle>
          <CardDescription>
            Настройка автоматической проверки и уведомлений
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="check-interval">Интервал проверки (часов)</Label>
            <Input
              id="check-interval"
              type="number"
              min="1"
              max="168"
              value={checkInterval}
              onChange={(e) => setCheckInterval(e.target.value)}
            />
            <p className="text-sm text-gray-500">
              Как часто система будет автоматически проверять индексацию.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={setNotificationsEnabled}
            />
            <Label htmlFor="notifications">Включить уведомления</Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveSettings}>Сохранить настройки</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Settings;
