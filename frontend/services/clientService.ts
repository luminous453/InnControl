import api from './api';

// Интерфейсы для типов данных
export interface Client {
  client_id: number;
  first_name: string;
  last_name: string;
  passport_number: string;
  city: string;
}

export interface ClientCreate {
  first_name: string;
  last_name: string;
  passport_number: string;
  city: string;
}

// Сервис для работы с API клиентов
export const clientService = {
  // Получить всех клиентов
  getAllClients: () => {
    return api.get<Client[]>('/clients/');
  },
  
  // Получить клиента по ID
  getClient: (id: number) => {
    return api.get<Client>(`/clients/${id}`);
  },
  
  // Создать нового клиента
  createClient: (client: ClientCreate) => {
    return api.post<Client>('/clients/', client);
  },
  
  // Обновить клиента
  updateClient: (id: number, client: ClientCreate) => {
    return api.put<Client>(`/clients/${id}`, client);
  },
  
  // Удалить клиента
  deleteClient: (id: number) => {
    return api.delete<Client>(`/clients/${id}`);
  },
  
  // Получить клиентов по городу
  getClientsByCity: (city: string) => {
    return api.get<Client[]>(`/clients/city/${encodeURIComponent(city)}`);
  }
};

export default clientService; 