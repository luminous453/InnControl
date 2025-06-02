// Базовый URL для API
const API_URL = 'http://localhost:8000';

// Функция для выполнения запросов к API
async function fetchApi<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  const config: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    mode: 'cors',
    credentials: 'omit',
  };

  try {
    console.log(`API запрос: ${method} ${API_URL}${endpoint}`);
    
    // Основной запрос
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Выводим детальную информацию о статусе ответа и заголовках
    console.log(`Статус ответа: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`API ошибка: ${response.status} ${response.statusText}`);
      let errorMessage = `API запрос вернул ошибку: ${response.status}`;
      
      try {
        const errorData = await response.json();
        console.error('Детали ошибки:', errorData);
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        console.error('Не удалось прочитать тело ошибки:', parseError);
        // Пробуем получить текст ошибки
        try {
          const errorText = await response.text();
          console.error('Текст ошибки:', errorText);
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        } catch (textError) {
          console.error('Не удалось прочитать текст ошибки:', textError);
        }
      }
      
      throw new Error(errorMessage);
    }
    
    // Для DELETE запросов может не быть JSON тела
    if (method === 'DELETE' && response.status === 204) {
      console.log('Запрос DELETE успешно выполнен без тела ответа');
      return {} as T;
    }
    
    const data = await response.json() as T;
    console.log('API ответ:', data);
    return data;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

// Экспорт функций для различных типов запросов
export const api = {
  get: <T>(endpoint: string) => fetchApi<T>(endpoint, 'GET'),
  post: <T>(endpoint: string, body: any) => fetchApi<T>(endpoint, 'POST', body),
  put: <T>(endpoint: string, body: any) => fetchApi<T>(endpoint, 'PUT', body),
  delete: <T>(endpoint: string) => fetchApi<T>(endpoint, 'DELETE'),
};

export default api; 