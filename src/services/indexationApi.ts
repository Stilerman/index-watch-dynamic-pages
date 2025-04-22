
import { IndexationResult } from "@/types";

const API_BASE_URL = "https://arsenkin.ru/tools/blog/api-indexation";

let apiKey = localStorage.getItem("indexation-api-key") || "";

export const setApiKey = (key: string) => {
  apiKey = key;
  localStorage.setItem("indexation-api-key", key);
};

export const getApiKey = () => {
  const storedKey = localStorage.getItem("indexation-api-key") || apiKey;
  return storedKey;
};

export const checkIndexation = async (url: string): Promise<{ 
  google: boolean; 
  yandex: boolean; 
  yandex_indexdate?: string 
}> => {
  if (!apiKey) {
    console.error("API ключ не указан");
    throw new Error("API ключ не указан. Пожалуйста, добавьте ключ в настройках.");
  }

  try {
    // Симуляция API для тестирования с добавлением search_all=1
    console.log(`Проверка индексации для URL: ${url}`);
    return {
      google: Math.random() > 0.3,
      yandex: Math.random() > 0.3,
      yandex_indexdate: new Date().toISOString() // Имитация даты первой индексации
    };
    
    /* Раскомментировать для реального API
    const response = await fetch(`${API_BASE_URL}?key=${apiKey}&url=${encodeURIComponent(url)}&search_all=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Ошибка API: ", response.status, errorText);
      throw new Error(`Ошибка API: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      google: data.google,
      yandex: data.yandex,
      yandex_indexdate: data.indexdate
    };
    */
  } catch (error) {
    console.error("Ошибка при проверке индексации:", error);
    throw error;
  }
};

export const batchCheckIndexation = async (urls: string[]): Promise<IndexationResult[]> => {
  const results: IndexationResult[] = [];
  const currentDate = new Date().toISOString();
  
  console.log(`Пакетная проверка ${urls.length} URL адресов`);
  
  for (const url of urls) {
    try {
      const result = await checkIndexation(url);
      results.push({
        url,
        google: result.google,
        yandex: result.yandex,
        date: currentDate,
        yandex_indexdate: result.yandex_indexdate
      });
    } catch (error) {
      console.error(`Ошибка при проверке URL ${url}:`, error);
      results.push({
        url,
        google: false,
        yandex: false,
        date: currentDate
      });
    }
  }
  
  return results;
};
