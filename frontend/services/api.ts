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

  // Получаем токен из localStorage, если он существует
  const token = localStorage.getItem('accessToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    mode: 'cors',
    credentials: 'omit',
  };

  try {
    // Основной запрос
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    if (!response.ok) {
      console.error(`API ошибка: ${response.status} ${response.statusText} (${method} ${endpoint})`);
      let errorMessage = `API запрос вернул ошибку: ${response.status}`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch (parseError) {
        // Пробуем получить текст ошибки
        try {
          const errorText = await response.text();
          if (errorText) {
            errorMessage += ` - ${errorText}`;
          }
        } catch (textError) {
          // Игнорируем ошибку получения текста
        }
      }
      
      throw new Error(errorMessage);
    }
    
    // Для DELETE запросов может не быть JSON тела
    if (method === 'DELETE' && response.status === 204) {
      return {} as T;
    }
    
    const data = await response.json() as T;
    return data;
  } catch (error) {
    console.error(`API ошибка при запросе ${method} ${endpoint}:`, error);
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