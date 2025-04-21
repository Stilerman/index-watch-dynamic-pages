
import { IndexationResult } from "@/types";

// Базовый URL API
const API_BASE_URL = "https://arsenkin.ru/tools/blog/api-indexation";

// Хранилище API ключа
let apiKey = localStorage.getItem("indexation-api-key") || "";

// Функция для установки API ключа
export const setApiKey = (key: string) => {
  console.log("Устанавливаем API ключ:", key ? "ключ установлен" : "ключ не установлен");
  apiKey = key;
  localStorage.setItem("indexation-api-key", key);
};

// Функция для получения API ключа
export const getApiKey = () => {
  const storedKey = localStorage.getItem("indexation-api-key") || apiKey;
  console.log("Получаем API ключ:", storedKey ? "ключ есть" : "ключ отсутствует");
  return storedKey;
};

// Основная функция проверки индексации
export const checkIndexation = async (url: string): Promise<{ google: boolean; yandex: boolean } | null> => {
  if (!apiKey) {
    console.error("API ключ не указан");
    throw new Error("API ключ не указан. Пожалуйста, добавьте ключ в настройках.");
  }

  try {
    // Для целей демонстрации, если настоящий API недоступен
    console.log(`Проверка индексации для URL: ${url}`);
    
    // Симуляция API для тестирования
    return {
      google: Math.random() > 0.3,
      yandex: Math.random() > 0.3
    };
    
    /* Раскомментировать для реального API
    const response = await fetch(`${API_BASE_URL}?key=${apiKey}&url=${encodeURIComponent(url)}`, {
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
    console.log("Ответ API:", data);
    
    // Проверка формата ответа
    if (typeof data.google !== "boolean" || typeof data.yandex !== "boolean") {
      throw new Error("Некорректный формат ответа от API");
    }
    
    return {
      google: data.google,
      yandex: data.yandex
    };
    */
  } catch (error) {
    console.error("Ошибка при проверке индексации:", error);
    throw error; // Пробрасываем ошибку дальше
  }
};

// Функция для пакетной проверки URL
export const batchCheckIndexation = async (urls: string[]): Promise<IndexationResult[]> => {
  const results: IndexationResult[] = [];
  const currentDate = new Date().toISOString();
  
  console.log(`Пакетная проверка ${urls.length} URL адресов`);
  
  for (const url of urls) {
    try {
      const result = await checkIndexation(url);
      if (result) {
        results.push({
          url,
          google: result.google,
          yandex: result.yandex,
          date: currentDate
        });
        console.log(`Результат для ${url}: Google=${result.google}, Yandex=${result.yandex}`);
      }
    } catch (error) {
      console.error(`Ошибка при проверке URL ${url}:`, error);
      // Добавляем запись с ошибкой
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
