'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { roomService, RoomWithDetails, RoomCreate, RoomStatusUpdate } from '../../../services/roomService';
import { hotelService } from '../../../services/hotelService';

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<RoomWithDetails | null>(null);
  
  // Получение данных о номерах
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Получаем данные о гостинице
        const hotel = await hotelService.getHotel(1); // ID = 1 для примера
        
        // Получаем данные о номерах
        const roomsData = await roomService.getRoomsByHotel(hotel.hotel_id);
        
        // Для каждого номера получаем детальную информацию
        const detailedRooms = await Promise.all(
          roomsData.map(async (room) => {
            const detailedRoom = await roomService.getRoom(room.room_id);
            return detailedRoom;
          })
        );
        
        setRooms(detailedRooms);
      } catch (err) {
        console.error('Ошибка при загрузке номеров:', err);
        setError('Не удалось загрузить данные о номерах');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, []);
  
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
  
  // Функция для изменения статуса номера
  const handleStatusChange = async (roomId: number, newStatus: string) => {
    try {
      setError(null);
      const statusUpdate: RoomStatusUpdate = { status: newStatus };
      await roomService.updateRoomStatus(roomId, statusUpdate);
      
      // Обновление списка номеров
      setRooms(prevRooms => 
        prevRooms.map(room => 
          room.room_id === roomId ? { ...room, status: newStatus } : room
        )
      );
    } catch (err) {
      console.error('Ошибка при изменении статуса номера:', err);
      setError('Не удалось изменить статус номера');
    }
  };
  
  // Функция для удаления номера
  const handleDeleteRoom = async (roomId: number) => {
    try {
      setError(null);
      await roomService.deleteRoom(roomId);
      
      // Обновление списка номеров
      setRooms(prevRooms => prevRooms.filter(room => room.room_id !== roomId));
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Ошибка при удалении номера:', err);
      setError('Не удалось удалить номер');
    }
  };

  if (loading) {
    return <div className="text-center p-8">Загрузка данных...</div>;
  }
  
  if (error) {
    return <div className="text-center p-8 text-red-600">{error}</div>;
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Управление номерами</h2>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={() => setShowAddModal(true)}
        >
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
            {filteredRooms.length > 0 ? (
              filteredRooms.map(room => (
                <tr key={room.room_id}>
                  <td className="px-6 py-4 whitespace-nowrap">{room.room_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{room.floor}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{room.room_type.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{room.room_type.capacity} чел.</td>
                  <td className="px-6 py-4 whitespace-nowrap">{room.room_type.price_per_night} ₽</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      className="px-3 py-2 text-sm font-medium rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      value={room.status}
                      onChange={(e) => handleStatusChange(room.room_id, e.target.value)}
                    >
                      <option value="Свободен">Свободен</option>
                      <option value="Занят">Занят</option>
                      <option value="Уборка">Уборка</option>
                      <option value="Техобслуживание">Техобслуживание</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        className="text-secondary hover:text-secondary-hover"
                        onClick={() => {
                          setCurrentRoom(room);
                          setShowEditModal(true);
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-800"
                        onClick={() => {
                          setCurrentRoom(room);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Нет данных для отображения
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Здесь можно добавить модальные окна для добавления, редактирования и удаления номеров */}
      {/* Реализация модальных окон потребовала бы добавления отдельных компонентов */}
    </div>
  );
} 