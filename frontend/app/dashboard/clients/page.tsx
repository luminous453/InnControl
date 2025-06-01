'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaUser, FaIdCard, FaCity } from 'react-icons/fa';
import { clientService, Client as ApiClient } from '@/services/clientService';
import { bookingService } from '@/services/bookingService';

// Расширенный интерфейс клиента для отображения
interface ClientDisplay extends ApiClient {
  total_bookings?: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientDisplay | null>(null);
  const [newClient, setNewClient] = useState({
    first_name: '',
    last_name: '',
    passport_number: '',
    city: 'Москва'
  });
  
  // Загрузка данных с API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const data = await clientService.getAllClients();
        
        // Для каждого клиента получаем его бронирования
        const clientsWithBookingCounts = await Promise.all(
          data.map(async (client) => {
            try {
              const bookings = await bookingService.getBookingsByClient(client.client_id);
              return {
                ...client,
                total_bookings: bookings.length
              };
            } catch (err) {
              console.error(`Ошибка при получении бронирований для клиента ${client.client_id}:`, err);
              return {
                ...client,
                total_bookings: 0
              };
            }
          })
        );
        
        setClients(clientsWithBookingCounts);
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке клиентов:', err);
        setError('Не удалось загрузить данные клиентов');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);
  
  // Функция для создания нового клиента
  const handleCreateClient = async () => {
    try {
      const clientData = {
        first_name: newClient.first_name,
        last_name: newClient.last_name,
        passport_number: newClient.passport_number,
        city: newClient.city
      };
      
      const createdClient = await clientService.createClient(clientData);
      
      // Добавляем созданного клиента в список
      setClients(prev => [...prev, {
        ...createdClient,
        total_bookings: 0
      }]);
      
      // Сбрасываем форму и закрываем модальное окно
      setNewClient({
        first_name: '',
        last_name: '',
        passport_number: '',
        city: 'Москва'
      });
      setShowModal(false);
    } catch (err) {
      console.error('Ошибка при создании клиента:', err);
      setError('Не удалось создать клиента');
    }
  };
  
  // Функция для редактирования клиента
  const handleEditClient = async () => {
    if (!editingClient) return;
    
    try {
      const clientData = {
        first_name: editingClient.first_name,
        last_name: editingClient.last_name,
        passport_number: editingClient.passport_number,
        city: editingClient.city
      };
      
      await clientService.updateClient(editingClient.client_id, clientData);
      
      // Обновляем клиента в списке
      setClients(prev => 
        prev.map(client => 
          client.client_id === editingClient.client_id ? editingClient : client
        )
      );
      
      // Закрываем модальное окно
      setEditingClient(null);
      setShowEditModal(false);
    } catch (err) {
      console.error('Ошибка при редактировании клиента:', err);
      setError('Не удалось обновить данные клиента');
    }
  };
  
  // Функция для открытия модального окна редактирования
  const openEditModal = (client: ClientDisplay) => {
    setEditingClient(client);
    setShowEditModal(true);
  };
  
  // Функция для удаления клиента
  const handleDeleteClient = async (id: number) => {
    try {
      await clientService.deleteClient(id);
      
      // Удаляем клиента из списка
      setClients(prev => prev.filter(client => client.client_id !== id));
    } catch (err) {
      console.error('Ошибка при удалении клиента:', err);
      setError('Не удалось удалить клиента');
    }
  };
  
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
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={() => setShowModal(true)}
        >
          <FaPlus />
          <span>Добавить клиента</span>
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
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
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  <td className="px-6 py-4 whitespace-nowrap">{client.first_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.last_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.passport_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.city}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.total_bookings}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        className="text-secondary hover:text-secondary-hover"
                        onClick={() => openEditModal(client)}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDeleteClient(client.client_id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Информация</h3>
        <div className="bg-white p-4 rounded-lg shadow">
          <p>В этом разделе вы можете управлять данными о клиентах гостиницы.</p>
          <p className="mt-2">Для добавления нового клиента нажмите кнопку "Добавить клиента".</p>
          <p className="mt-2">Для редактирования информации о клиенте используйте кнопку редактирования в таблице.</p>
        </div>
      </div>
      
      {/* Модальное окно для добавления клиента */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Добавить клиента</h3>
            
            <div className="mb-4">
              <label className="label">Имя</label>
              <input 
                type="text" 
                className="input w-full" 
                value={newClient.first_name}
                onChange={(e) => setNewClient({...newClient, first_name: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Фамилия</label>
              <input 
                type="text" 
                className="input w-full" 
                value={newClient.last_name}
                onChange={(e) => setNewClient({...newClient, last_name: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Паспорт</label>
              <input 
                type="text" 
                className="input w-full" 
                value={newClient.passport_number}
                onChange={(e) => setNewClient({...newClient, passport_number: e.target.value})}
                placeholder="0000 000000"
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Город</label>
              <input 
                type="text" 
                className="input w-full" 
                value={newClient.city}
                onChange={(e) => setNewClient({...newClient, city: e.target.value})}
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Отмена
              </button>
              <button 
                className="btn-primary"
                onClick={handleCreateClient}
                disabled={!newClient.first_name || !newClient.last_name || !newClient.passport_number}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно для редактирования клиента */}
      {showEditModal && editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Редактировать клиента</h3>
            
            <div className="mb-4">
              <label className="label">Имя</label>
              <input 
                type="text" 
                className="input w-full" 
                value={editingClient.first_name}
                onChange={(e) => setEditingClient({...editingClient, first_name: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Фамилия</label>
              <input 
                type="text" 
                className="input w-full" 
                value={editingClient.last_name}
                onChange={(e) => setEditingClient({...editingClient, last_name: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Паспорт</label>
              <input 
                type="text" 
                className="input w-full" 
                value={editingClient.passport_number}
                onChange={(e) => setEditingClient({...editingClient, passport_number: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Город</label>
              <input 
                type="text" 
                className="input w-full" 
                value={editingClient.city}
                onChange={(e) => setEditingClient({...editingClient, city: e.target.value})}
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setEditingClient(null);
                  setShowEditModal(false);
                }}
              >
                Отмена
              </button>
              <button 
                className="btn-primary"
                onClick={handleEditClient}
                disabled={!editingClient.first_name || !editingClient.last_name || !editingClient.passport_number}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}