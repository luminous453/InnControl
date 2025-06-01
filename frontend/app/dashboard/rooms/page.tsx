'use client';

import { useState } from 'react';
import { FaSearch, FaFilter, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

// Типы для номеров
interface RoomType {
  id: number;
  name: string;
  description: string;
  price_per_night: number;
  capacity: number;
}

interface Room {
  id: number;
  room_number: string;
  floor: number;
  status: 'Свободен' | 'Занят' | 'Уборка' | 'Техобслуживание';
  room_type: RoomType;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([
    {
      id: 1,
      room_number: '101',
      floor: 1,
      status: 'Свободен',
      room_type: {
        id: 1,
        name: 'Стандарт',
        description: 'Стандартный номер с одной двуспальной кроватью',
        price_per_night: 3000,
        capacity: 2
      }
    },
    {
      id: 2,
      room_number: '102',
      floor: 1,
      status: 'Занят',
      room_type: {
        id: 1,
        name: 'Стандарт',
        description: 'Стандартный номер с одной двуспальной кроватью',
        price_per_night: 3000,
        capacity: 2
      }
    },
    {
      id: 3,
      room_number: '201',
      floor: 2,
      status: 'Уборка',
      room_type: {
        id: 2,
        name: 'Люкс',
        description: 'Просторный номер с гостиной и спальней',
        price_per_night: 5000,
        capacity: 3
      }
    },
    {
      id: 4,
      room_number: '301',
      floor: 3,
      status: 'Свободен',
      room_type: {
        id: 3,
        name: 'Полулюкс',
        description: 'Улучшенный номер с дополнительными удобствами',
        price_per_night: 4000,
        capacity: 2
      }
    },
    {
      id: 5,
      room_number: '302',
      floor: 3,
      status: 'Занят',
      room_type: {
        id: 3,
        name: 'Полулюкс',
        description: 'Улучшенный номер с дополнительными удобствами',
        price_per_night: 4000,
        capacity: 2
      }
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  
  // Фильтрация комнат
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.room_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus ? room.status === filterStatus : true;
    const matchesType = filterType ? room.room_type.name === filterType : true;
    
    return matchesSearch && matchesStatus && matchesType;
  });
  
  // Получение уникальных статусов и типов для фильтров
  const statuses = Array.from(new Set(rooms.map(room => room.status)));
  const types = Array.from(new Set(rooms.map(room => room.room_type.name)));
  
  // Функция для определения цвета статуса
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Свободен': return 'bg-green-100 text-green-800';
      case 'Занят': return 'bg-red-100 text-red-800';
      case 'Уборка': return 'bg-yellow-100 text-yellow-800';
      case 'Техобслуживание': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Управление номерами</h2>
        <button className="btn-primary flex items-center space-x-2">
          <FaPlus />
          <span>Добавить номер</span>
        </button>
      </div>
      
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Поиск по номеру..."
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <select
              className="select pl-10 appearance-none pr-8"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Все статусы</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <FaFilter className="absolute left-3 top-3 text-gray-400" />
          </div>
          
          <div className="relative">
            <select
              className="select pl-10 appearance-none pr-8"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="">Все типы</option>
              {types.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <FaFilter className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Номер</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Этаж</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Вместимость</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена за ночь</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRooms.map(room => (
              <tr key={room.id}>
                <td className="px-6 py-4 whitespace-nowrap">{room.room_number}</td>
                <td className="px-6 py-4 whitespace-nowrap">{room.floor}</td>
                <td className="px-6 py-4 whitespace-nowrap">{room.room_type.name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{room.room_type.capacity} чел.</td>
                <td className="px-6 py-4 whitespace-nowrap">{room.room_type.price_per_night} ₽</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(room.status)}`}>
                    {room.status}
                  </span>
                </td>
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
    </div>
  );
} 