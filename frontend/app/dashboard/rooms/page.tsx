'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
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
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentRoom, setCurrentRoom] = useState<RoomWithDetails | null>(null);
  
  const [newRoom, setNewRoom] = useState<{
    hotel_id: number;
    type_id: number;
    room_number: string;
    floor: number;
    status: string;
  }>({
    hotel_id: 1, // По умолчанию
    type_id: 0,
    room_number: '',
    floor: 1,
    status: 'Свободен'
  });
  
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  
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
        
        // Получаем все типы номеров
        const typesData = await roomService.getAllRoomTypes();
        setRoomTypes(typesData);
        
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
  })
  // Сортировка номеров по возрастанию
  .sort((a, b) => {
    // Извлекаем числовую часть из номера комнаты
    const roomNumA = parseInt(a.room_number.replace(/\D/g, ''));
    const roomNumB = parseInt(b.room_number.replace(/\D/g, ''));
    
    // Если оба номера корректно преобразованы в числа, сравниваем их
    if (!isNaN(roomNumA) && !isNaN(roomNumB)) {
      return roomNumA - roomNumB;
    }
    
    // Иначе используем строковое сравнение
    return a.room_number.localeCompare(b.room_number);
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
  
  // Функция для создания нового номера
  const handleCreateRoom = async () => {
    try {
      setError(null);
      
      if (!newRoom.room_number || !newRoom.floor || !newRoom.type_id) {
        setError('Заполните все обязательные поля');
        return;
      }
      
      const roomData: RoomCreate = {
        hotel_id: newRoom.hotel_id,
        type_id: newRoom.type_id,
        room_number: newRoom.room_number,
        floor: newRoom.floor,
        status: newRoom.status
      };
      
      // Создаем номер
      const createdRoom = await roomService.createRoom(roomData);
      
      // Получаем детальную информацию о созданном номере
      const roomDetails = await roomService.getRoom(createdRoom.room_id);
      
      // Добавляем новый номер в список
      setRooms(prevRooms => [...prevRooms, roomDetails]);
      
      // Сбрасываем форму и закрываем модальное окно
      setNewRoom({
        hotel_id: 1,
        type_id: 0,
        room_number: '',
        floor: 1,
        status: 'Свободен'
      });
      
      setShowAddModal(false);
      
      // Показываем сообщение об успешном создании
      setSuccessMessage('Номер успешно добавлен');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      
    } catch (err) {
      console.error('Ошибка при создании номера:', err);
      setError('Не удалось создать новый номер');
    }
  };
  
  // Функция для редактирования номера
  const handleEditRoom = async () => {
    try {
      setError(null);
      
      if (!currentRoom || !currentRoom.room_number || !currentRoom.floor) {
        setError('Заполните все обязательные поля');
        return;
      }
      
      const roomData: RoomCreate = {
        hotel_id: currentRoom.hotel_id,
        type_id: currentRoom.room_type.type_id,
        room_number: currentRoom.room_number,
        floor: currentRoom.floor,
        status: currentRoom.status
      };
      
      // Обновляем номер
      await roomService.updateRoom(currentRoom.room_id, roomData);
      
      // Получаем обновленную информацию о номере
      const updatedRoom = await roomService.getRoom(currentRoom.room_id);
      
      // Обновляем номер в списке
      setRooms(prevRooms => 
        prevRooms.map(room => 
          room.room_id === currentRoom.room_id ? updatedRoom : room
        )
      );
      
      // Закрываем модальное окно
      setShowEditModal(false);
      setCurrentRoom(null);
      
      // Показываем сообщение об успешном обновлении
      setSuccessMessage('Номер успешно обновлен');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      
    } catch (err) {
      console.error('Ошибка при обновлении номера:', err);
      setError('Не удалось обновить номер');
    }
  };
  
  // Функция для удаления номера
  const handleDeleteRoom = async () => {
    if (!currentRoom) return;
    
    try {
      setError(null);
      await roomService.deleteRoom(currentRoom.room_id);
      
      // Обновление списка номеров
      setRooms(prevRooms => prevRooms.filter(room => room.room_id !== currentRoom.room_id));
      
      // Закрываем модальное окно
      setShowDeleteModal(false);
      setCurrentRoom(null);
      
      // Показываем сообщение об успехе
      setSuccessMessage('Номер успешно удален');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
    } catch (err) {
      console.error('Ошибка при удалении номера:', err);
      setError('Не удалось удалить номер. Возможно, он используется в бронированиях.');
      setShowDeleteModal(false);
    }
  };

  // Содержимое компонента
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
            placeholder="Поиск по номеру..."
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <select
              className="select pl-10 appearance-none pr-8 min-w-[180px] w-[180px]"
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
              className="select pl-10 appearance-none pr-8 min-w-[180px] w-[180px]"
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
                        <FaEdit className="text-xl" />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-800"
                        onClick={() => {
                          setCurrentRoom(room);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FaTrash className="text-xl" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Номера не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Модальное окно для добавления номера */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Добавить новый номер</h3>
            
            <div className="mb-4">
              <label className="label">Номер комнаты*</label>
              <input 
                type="text" 
                className="input w-full" 
                value={newRoom.room_number}
                onChange={(e) => setNewRoom({...newRoom, room_number: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Этаж*</label>
              <input 
                type="number" 
                min="1"
                className="input w-full" 
                value={newRoom.floor}
                onChange={(e) => setNewRoom({...newRoom, floor: parseInt(e.target.value) || 1})}
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Тип номера*</label>
              <select 
                className="select w-full"
                value={newRoom.type_id}
                onChange={(e) => setNewRoom({...newRoom, type_id: parseInt(e.target.value)})}
              >
                <option value="0">Выберите тип номера</option>
                {roomTypes.map(type => (
                  <option key={type.type_id} value={type.type_id}>
                    {type.name} ({type.capacity} чел., {type.price_per_night} ₽/ночь)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="label">Статус</label>
              <select 
                className="select w-full"
                value={newRoom.status}
                onChange={(e) => setNewRoom({...newRoom, status: e.target.value})}
              >
                <option value="Свободен">Свободен</option>
                <option value="Занят">Занят</option>
                <option value="Уборка">Уборка</option>
                <option value="Техобслуживание">Техобслуживание</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Отмена
              </button>
              <button 
                className="btn-primary"
                onClick={handleCreateRoom}
                disabled={!newRoom.room_number || !newRoom.floor || newRoom.type_id === 0}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно для редактирования номера */}
      {showEditModal && currentRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Редактировать номер</h3>
            
            <div className="mb-4">
              <label className="label">Номер комнаты*</label>
              <input 
                type="text" 
                className="input w-full" 
                value={currentRoom.room_number}
                onChange={(e) => setCurrentRoom({...currentRoom, room_number: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Этаж*</label>
              <input 
                type="number" 
                min="1"
                className="input w-full" 
                value={currentRoom.floor}
                onChange={(e) => setCurrentRoom({...currentRoom, floor: parseInt(e.target.value) || currentRoom.floor})}
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Тип номера*</label>
              <select 
                className="select w-full"
                value={currentRoom.room_type.type_id}
                onChange={(e) => {
                  const typeId = parseInt(e.target.value);
                  const selectedType = roomTypes.find(t => t.type_id === typeId);
                  if (selectedType) {
                    setCurrentRoom({
                      ...currentRoom, 
                      room_type: {
                        ...selectedType,
                        type_id: typeId
                      }
                    });
                  }
                }}
              >
                {roomTypes.map(type => (
                  <option key={type.type_id} value={type.type_id}>
                    {type.name} ({type.capacity} чел., {type.price_per_night} ₽/ночь)
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="label">Статус</label>
              <select 
                className="select w-full"
                value={currentRoom.status}
                onChange={(e) => setCurrentRoom({...currentRoom, status: e.target.value})}
              >
                <option value="Свободен">Свободен</option>
                <option value="Занят">Занят</option>
                <option value="Уборка">Уборка</option>
                <option value="Техобслуживание">Техобслуживание</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setCurrentRoom(null);
                }}
              >
                Отмена
              </button>
              <button 
                className="btn-primary"
                onClick={handleEditRoom}
                disabled={!currentRoom.room_number || !currentRoom.floor}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно для подтверждения удаления */}
      {showDeleteModal && currentRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Подтверждение удаления</h3>
            <p className="mb-6">Вы действительно хотите удалить номер {currentRoom.room_number}?</p>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Отмена
              </button>
              <button 
                className="btn-danger"
                onClick={handleDeleteRoom}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно успешного действия */}
      {showSuccessModal && (
        <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 p-4 rounded-lg shadow-lg z-50 flex items-center">
          <FaCheck className="mr-2" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
} 