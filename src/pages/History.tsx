
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { IndexationHistory } from "@/types";
import { getIndexationHistory } from "@/services/storageService";
import HistoryChart from "@/components/HistoryChart";

const History = () => {
  const [history, setHistory] = useState<IndexationHistory[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<string>("");

  // Загрузка истории при монтировании
  useEffect(() => {
    const loadedHistory = getIndexationHistory();
    setHistory(loadedHistory);
    
    // Устанавливаем первый URL как выбранный, если история не пуста
    if (loadedHistory.length > 0) {
      setSelectedUrl(loadedHistory[0].url);
    }
  }, []);

  // Получаем выбранную историю URL
  const selectedHistory = history.find(h => h.url === selectedUrl);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">История индексации</h1>
      </div>

      {history.length > 0 ? (
        <>
          <Card>
            <CardContent className="pt-6">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="url-select">Выберите URL</Label>
                  <Select 
                    value={selectedUrl} 
                    onValueChange={setSelectedUrl}
                  >
                    <SelectTrigger id="url-select" className="w-full md:w-1/2 mt-2">
                      <SelectValue placeholder="Выберите URL для просмотра истории" />
                    </SelectTrigger>
                    <SelectContent>
                      {history.map(item => (
                        <SelectItem key={item.url} value={item.url}>
                          {item.url}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedHistory && (
            <HistoryChart data={selectedHistory} />
          )}
        </>
      ) : (
        <div className="py-12 text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Нет данных истории</h3>
          <p className="text-gray-500">
            Добавьте URL и запустите проверку индексации, чтобы начать отслеживать историю.
          </p>
        </div>
      )}
    </div>
  );
};

export default History;
