'use client';

import { useState } from 'react';
import { FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaUser, FaIdCard, FaCity } from 'react-icons/fa';

// Типы для клиентов
interface Client {
  client_id: number;
  first_name: string;
  last_name: string;
  passport_number: string;
  city: string;
  total_bookings?: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([
    {
      client_id: 1,
      first_name: 'Александр',
      last_name: 'Иванов',
      passport_number: '4567 123456',
      city: 'Москва',
      total_bookings: 3
    },
    {
      client_id: 2,
      first_name: 'Елена',
      last_name: 'Петрова',
      passport_number: '4567 789012',
      city: 'Санкт-Петербург',
      total_bookings: 1
    },
    {
      client_id: 3,
      first_name: 'Иван',
      last_name: 'Сидоров',
      passport_number: '4568 345678',
      city: 'Москва',
      total_bookings: 2
    },
    {
      client_id: 4,
      first_name: 'Мария',
      last_name: 'Козлова',
      passport_number: '4569 901234',
      city: 'Екатеринбург',
      total_bookings: 1
    },
    {
      client_id: 5,
      first_name: 'Дмитрий',
      last_name: 'Новиков',
      passport_number: '4570 567890',
      city: 'Казань',
      total_bookings: 4
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  
  // В реальном проекте здесь будет загрузка данных с API
  // useEffect(() => {
  //   fetch('/api/clients')
  //     .then(res => res.json())
  //     .then(data => setClients(data));
  // }, []);
  
  // Фильтрация клиентов
  const filteredClients = clients.filter(client => {
    const fullName = `${client.first_name} ${client.last_name}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchTerm.toLowerCase()) ||
      client.passport_number.includes(searchTerm);
    
    const matchesCity = filterCity ? client.city === filterCity : true;
    
    return matchesSearch && matchesCity;
  });
  
  // Получение уникальных городов для фильтра
  const cities = Array.from(new Set(clients.map(client => client.city)));

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Клиенты</h2>
        <button className="btn-primary flex items-center space-x-2">
          <FaPlus />
          <span>Добавить клиента</span>
        </button>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по имени или паспорту..."
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <select
            className="select pl-10 appearance-none pr-8"
            value={filterCity}
            onChange={(e) => setFilterCity(e.target.value)}
          >
            <option value="">Все города</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
          <FaCity className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Фамилия</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Паспорт</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Город</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Бронирований</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredClients.map(client => (
              <tr key={client.client_id}>
                <td className="px-6 py-4 whitespace-nowrap">{client.client_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.first_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.last_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.passport_number}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.city}</td>
                <td className="px-6 py-4 whitespace-nowrap">{client.total_bookings}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-secondary hover:text-secondary-hover">
                      <FaEdit />
                    </button>
                    <button className="text-red-600 hover:text-red-800">
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Информация</h3>
        <div className="bg-white p-4 rounded-lg shadow">
          <p>В этом разделе вы можете управлять данными о клиентах гостиницы.</p>
          <p className="mt-2">Для добавления нового клиента нажмите кнопку "Добавить клиента".</p>
          <p className="mt-2">Для редактирования информации о клиенте используйте кнопку редактирования в таблице.</p>
        </div>
      </div>
    </div>
  );
} 