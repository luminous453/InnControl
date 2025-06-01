'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaRegCalendarCheck, FaRegCalendarTimes, FaCheck } from 'react-icons/fa';
import { bookingService, BookingWithDetails } from '@/services/bookingService';
import { roomService, RoomType } from '@/services/roomService';
import { clientService } from '@/services/clientService';

// Расширенный интерфейс бронирования для отображения
interface BookingDisplay extends BookingWithDetails {
  total_price: number; // Дополнительное поле для отображения
}

// Функция для форматирования даты
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// Функция для расчета количества ночей
const calculateNights = (checkInDate: string, checkOutDate: string): number => {
  try {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    // Проверяем корректность дат
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return 0;
    }
    
    // Проверяем, что дата выезда не раньше даты заезда
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  } catch (err) {
    console.error('Ошибка при расчете количества ночей:', err);
    return 0;
  }
};

// Функция для расчета общей стоимости
const calculateTotal = (booking: BookingDisplay): number => {
  return booking.total_price;
};

// Функция для обновления статуса бронирования
const handleStatusChange = async (bookingId: number, newStatus: string) => {
  try {
    const statusUpdate = { status: newStatus };
    await bookingService.updateBookingStatus(bookingId, statusUpdate);
    
    // В реальном приложении здесь должно быть обновление состояния
    window.location.reload(); // Временное решение для обновления UI
  } catch (err) {
    console.error('Ошибка при изменении статуса бронирования:', err);
    alert('Не удалось изменить статус бронирования');
  }
};

// Функция для проверки корректности дат
const areDatesValid = (checkInDate: string, checkOutDate: string): boolean => {
  try {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    // Проверяем корректность дат
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return false;
    }
    
    // Проверяем, что дата выезда не раньше даты заезда
    return checkOut > checkIn;
  } catch (err) {
    console.error('Ошибка при проверке дат:', err);
    return false;
  }
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentBooking, setCurrentBooking] = useState<BookingDisplay | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [newBooking, setNewBooking] = useState({
    client_id: 0,
    room_id: 0,
    check_in_date: '',
    check_out_date: '',
    status: 'Подтверждено'
  });
  
  // Загрузка данных с API
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Начинаем загрузку бронирований...');
        
        // Получаем все бронирования
        const bookingsData = await bookingService.getAllBookings();
        console.log('Получены бронирования:', bookingsData);
        
        if (!bookingsData || bookingsData.length === 0) {
          console.log('Бронирования не найдены или пустой массив');
          setBookings([]);
          setLoading(false);
          return;
        }
        
        // Получаем типы номеров для расчета цены
        console.log('Загрузка типов номеров...');
        const roomTypesData = await roomService.getAllRoomTypes();
        console.log('Получены типы номеров:', roomTypesData);
        setRoomTypes(roomTypesData);
        
        // Получаем клиентов для формы создания
        console.log('Загрузка клиентов...');
        const clientsData = await clientService.getAllClients();
        console.log('Получены клиенты:', clientsData);
        setClients(clientsData);
        
        // Получаем детали для каждого бронирования
        console.log('Загрузка деталей бронирований...');
        const bookingsWithDetails: BookingDisplay[] = [];
        
        for (const booking of bookingsData) {
          try {
            console.log(`Загрузка деталей для бронирования ${booking.booking_id}...`);
            // Получаем детали бронирования
            const bookingDetails = await bookingService.getBooking(booking.booking_id);
            console.log(`Получены детали бронирования ${booking.booking_id}:`, bookingDetails);
            
            // Находим тип номера для расчета цены
            const roomType = roomTypesData.find(rt => rt.type_id === bookingDetails.room.type_id);
            
            if (!roomType) {
              console.error(`Не найден тип номера для номера ${bookingDetails.room.room_id}`);
              continue;
            }
            
            // Рассчитываем общую стоимость бронирования
            const nights = calculateNights(booking.check_in_date, booking.check_out_date);
            const totalPrice = nights * roomType.price_per_night;
            
            // Добавляем бронирование с деталями
            bookingsWithDetails.push({
              ...bookingDetails,
              total_price: totalPrice
            });
          } catch (err) {
            console.error(`Ошибка при получении деталей для бронирования ${booking.booking_id}:`, err);
          }
        }
        
        console.log(`Обработано ${bookingsWithDetails.length} из ${bookingsData.length} бронирований`);
        setBookings(bookingsWithDetails);
      } catch (err) {
        console.error('Ошибка при загрузке бронирований:', err);
        if (err instanceof Error) {
          setError(`Не удалось загрузить данные бронирований: ${err.message}`);
        } else {
          setError('Не удалось загрузить данные бронирований');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);
  
  // Функция для проверки доступности номеров при изменении дат
  useEffect(() => {
    const checkAvailableRooms = async () => {
      if (newBooking.check_in_date && newBooking.check_out_date) {
        // Проверяем корректность введенных дат
        if (!areDatesValid(newBooking.check_in_date, newBooking.check_out_date)) {
          setError('Дата выезда должна быть позже даты заезда');
          setAvailableRooms([]);
          return;
        }
        
        try {
          setError(null); // Сбрасываем ошибку, если даты корректны
          const rooms = await bookingService.getAvailableRooms(
            newBooking.check_in_date,
            newBooking.check_out_date
          );
          setAvailableRooms(rooms);
        } catch (err) {
          console.error('Ошибка при проверке доступных номеров:', err);
          setAvailableRooms([]);
        }
      }
    };
    
    checkAvailableRooms();
  }, [newBooking.check_in_date, newBooking.check_out_date]);
  
  // Функция для создания нового бронирования
  const handleCreateBooking = async () => {
    try {
      if (!newBooking.check_in_date || !newBooking.check_out_date || !newBooking.client_id || !newBooking.room_id) {
        setError('Заполните все поля');
        return;
      }
      
      // Проверяем корректность введенных дат
      if (!areDatesValid(newBooking.check_in_date, newBooking.check_out_date)) {
        setError('Дата выезда должна быть позже даты заезда');
        return;
      }
      
      const bookingData = {
        client_id: newBooking.client_id,
        room_id: newBooking.room_id,
        check_in_date: newBooking.check_in_date,
        check_out_date: newBooking.check_out_date,
        status: newBooking.status
      };
      
      const createdBooking = await bookingService.createBooking(bookingData);
      
      // Получаем данные о клиенте и номере
      const clientData = await clientService.getClient(createdBooking.client_id);
      const roomData = await roomService.getRoom(createdBooking.room_id);
      
      // Рассчитываем общую стоимость бронирования
      const checkIn = new Date(createdBooking.check_in_date);
      const checkOut = new Date(createdBooking.check_out_date);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      const totalPrice = nights * roomData.room_type.price_per_night;
      
      // Добавляем новое бронирование в список
      const newBookingWithDetails: BookingDisplay = {
        ...createdBooking,
        client: clientData,
        room: roomData,
        total_price: totalPrice
      };
      
      setBookings(prev => [...prev, newBookingWithDetails]);
      
      // Сбрасываем форму и закрываем модальное окно
      setNewBooking({
        client_id: 0,
        room_id: 0,
        check_in_date: '',
        check_out_date: '',
        status: 'Подтверждено'
      });
      setShowAddModal(false);
    } catch (err) {
      console.error('Ошибка при создании бронирования:', err);
      setError('Не удалось создать бронирование');
    }
  };
  
  // Функция для расчета предварительной стоимости
  const calculatePreviewPrice = () => {
    if (!newBooking.check_in_date || !newBooking.check_out_date || !newBooking.room_id) {
      return 0;
    }
    
    // Проверяем корректность введенных дат
    if (!areDatesValid(newBooking.check_in_date, newBooking.check_out_date)) {
      return 0;
    }
    
    const room = availableRooms.find(r => r.room_id === newBooking.room_id);
    if (!room) return 0;
    
    const roomType = roomTypes.find(rt => rt.type_id === room.type_id);
    if (!roomType) return 0;
    
    const nights = calculateNights(newBooking.check_in_date, newBooking.check_out_date);
    if (nights <= 0) return 0;
    
    return nights * roomType.price_per_night;
  };
  
  // Фильтрация бронирований
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.room.room_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
      `${booking.client.first_name} ${booking.client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus ? booking.status === filterStatus : true;
    
    return matchesSearch && matchesStatus;
  });
  
  // Получение уникальных статусов для фильтра
  const statuses = Array.from(new Set(bookings.map(booking => booking.status)));

  // Функция для определения цвета статуса
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Активно': return 'bg-green-100 text-green-800';
      case 'Подтверждено': return 'bg-blue-100 text-blue-800';
      case 'Завершено': return 'bg-gray-100 text-gray-800';
      case 'Отменено': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Функция для определения иконки статуса
  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Активно': 
      case 'Подтверждено': 
        return <FaRegCalendarCheck className="mr-1" />;
      case 'Отменено': 
        return <FaRegCalendarTimes className="mr-1" />;
      default: 
        return <FaCalendarAlt className="mr-1" />;
    }
  };

  // Функция для редактирования бронирования
  const handleEditBooking = async () => {
    try {
      if (!currentBooking) return;
      
      // Проверяем корректность введенных данных
      if (!currentBooking.client || !currentBooking.room || !currentBooking.check_in_date || !currentBooking.check_out_date) {
        setError('Заполните все обязательные поля');
        return;
      }
      
      // Проверяем корректность введенных дат
      if (!areDatesValid(currentBooking.check_in_date, currentBooking.check_out_date)) {
        setError('Дата выезда должна быть позже даты заезда');
        return;
      }
      
      // Подготавливаем данные для отправки
      const bookingData = {
        client_id: currentBooking.client.client_id,
        room_id: currentBooking.room.room_id,
        check_in_date: currentBooking.check_in_date,
        check_out_date: currentBooking.check_out_date,
        status: currentBooking.status
      };
      
      // Обновляем бронирование
      await bookingService.updateBooking(currentBooking.booking_id, bookingData);
      
      // Получаем обновленные данные
      const updatedBooking = await bookingService.getBooking(currentBooking.booking_id);
      
      // Рассчитываем цену
      const nights = calculateNights(updatedBooking.check_in_date, updatedBooking.check_out_date);
      const roomTypeData = await roomService.getRoomType(updatedBooking.room.type_id);
      const totalPrice = nights * roomTypeData.price_per_night;
      
      // Обновляем бронирование в списке
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.booking_id === currentBooking.booking_id 
            ? { ...updatedBooking, total_price: totalPrice } 
            : booking
        )
      );
      
      // Закрываем модальное окно
      setShowEditModal(false);
      setCurrentBooking(null);
      
      // Показываем сообщение об успешном обновлении
      setSuccessMessage('Бронирование успешно обновлено');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      
    } catch (err) {
      console.error('Ошибка при редактировании бронирования:', err);
      setError('Не удалось обновить бронирование');
    }
  };
  
  // Функция для удаления бронирования
  const handleDeleteBooking = async () => {
    if (!currentBooking) return;
    
    try {
      // Удаляем бронирование
      await bookingService.deleteBooking(currentBooking.booking_id);
      
      // Обновляем список бронирований
      setBookings(prevBookings => 
        prevBookings.filter(booking => booking.booking_id !== currentBooking.booking_id)
      );
      
      // Закрываем модальное окно
      setShowDeleteModal(false);
      setCurrentBooking(null);
      
      // Показываем сообщение об успешном удалении
      setSuccessMessage('Бронирование успешно удалено');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000);
      
    } catch (err) {
      console.error('Ошибка при удалении бронирования:', err);
      setError('Не удалось удалить бронирование');
      setShowDeleteModal(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Бронирования</h2>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={() => setShowAddModal(true)}
        >
          <FaPlus />
          <span>Новое бронирование</span>
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
            placeholder="Поиск по клиенту или номеру..."
            className="input pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <select
            className="select pl-10 appearance-none pr-8"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Все статусы</option>
            <option value="Заселен">Заселен</option>
            <option value="Подтверждено">Подтверждено</option>
            <option value="Выселен">Выселен</option>
            <option value="Отменено">Отменено</option>
          </select>
          <FaFilter className="absolute left-3 top-3 text-gray-400" />
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Номер</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Заезд</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Выезд</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ночей</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.map(booking => (
                <tr key={booking.booking_id}>
                  <td className="px-6 py-4 whitespace-nowrap">{booking.room.room_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {booking.client.first_name} {booking.client.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(booking.check_in_date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatDate(booking.check_out_date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{calculateNights(booking.check_in_date, booking.check_out_date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{calculateTotal(booking)} ₽</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      className="px-3 py-2 text-sm font-medium rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      value={booking.status}
                      onChange={(e) => handleStatusChange(booking.booking_id, e.target.value)}
                    >
                      <option value="Подтверждено">Подтверждено</option>
                      <option value="Заселен">Заселен</option>
                      <option value="Выселен">Выселен</option>
                      <option value="Отменено">Отменено</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        className="text-secondary hover:text-secondary-hover"
                        onClick={() => {
                          setCurrentBooking(booking);
                          setShowEditModal(true);
                        }}
                      >
                        <FaEdit className="text-xl" />
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-800"
                        onClick={() => {
                          setCurrentBooking(booking);
                          setShowDeleteModal(true);
                        }}
                      >
                        <FaTrash className="text-xl" />
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
          <p>В этом разделе вы можете управлять бронированиями номеров гостиницы.</p>
          <p className="mt-2">Для создания нового бронирования нажмите кнопку "Новое бронирование".</p>
          <p className="mt-2">Для редактирования бронирования используйте кнопку редактирования в таблице.</p>
        </div>
      </div>
      
      {/* Модальное окно для создания бронирования */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Новое бронирование</h3>
            
            <div className="mb-4">
              <label className="label">Клиент</label>
              <select 
                className="select w-full"
                value={newBooking.client_id}
                onChange={(e) => setNewBooking({...newBooking, client_id: parseInt(e.target.value)})}
              >
                <option value={0}>Выберите клиента</option>
                {clients.map(client => (
                  <option key={client.client_id} value={client.client_id}>
                    {client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="label">Дата заезда</label>
              <input 
                type="date" 
                className="input w-full" 
                value={newBooking.check_in_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  const newCheckInDate = e.target.value;
                  setNewBooking(prev => ({
                    ...prev, 
                    check_in_date: newCheckInDate,
                    check_out_date: prev.check_out_date && new Date(prev.check_out_date) <= new Date(newCheckInDate) ? '' : prev.check_out_date
                  }));
                }}
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Дата выезда</label>
              <input 
                type="date" 
                className="input w-full" 
                value={newBooking.check_out_date}
                min={newBooking.check_in_date || new Date().toISOString().split('T')[0]}
                disabled={!newBooking.check_in_date}
                onChange={(e) => setNewBooking({...newBooking, check_out_date: e.target.value})}
              />
              {!newBooking.check_in_date && (
                <p className="text-sm text-gray-500 mt-1">Сначала выберите дату заезда</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="label">Номер</label>
              <select 
                className="select w-full"
                value={newBooking.room_id}
                onChange={(e) => setNewBooking({...newBooking, room_id: parseInt(e.target.value)})}
                disabled={!newBooking.check_in_date || !newBooking.check_out_date}
              >
                <option value={0}>Выберите номер</option>
                {availableRooms.map(room => (
                  <option key={room.room_id} value={room.room_id}>
                    {room.room_number} (Этаж {room.floor})
                  </option>
                ))}
              </select>
              {(!newBooking.check_in_date || !newBooking.check_out_date) && (
                <p className="text-sm text-gray-500 mt-1">Сначала выберите даты заезда и выезда</p>
              )}
              {newBooking.check_in_date && newBooking.check_out_date && availableRooms.length === 0 && (
                <p className="text-sm text-red-500 mt-1">Нет доступных номеров на выбранные даты</p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="label">Статус</label>
              <select 
                className="select w-full"
                value={newBooking.status}
                onChange={(e) => setNewBooking({...newBooking, status: e.target.value})}
              >
                <option value="Подтверждено">Подтверждено</option>
                <option value="Активно">Активно</option>
              </select>
            </div>
            
            {newBooking.room_id > 0 && (
              <div className="mb-4 p-3 bg-gray-100 rounded-md">
                <p className="font-semibold">Предварительная стоимость: {calculatePreviewPrice()} ₽</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Отмена
              </button>
              <button 
                className="btn-primary"
                onClick={handleCreateBooking}
                disabled={!newBooking.client_id || !newBooking.room_id || !newBooking.check_in_date || !newBooking.check_out_date}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно для редактирования бронирования */}
      {showEditModal && currentBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Редактировать бронирование</h3>
            
            <div className="mb-4">
              <label className="label">Клиент</label>
              <div className="px-3 py-2 border border-gray-300 rounded bg-gray-50">
                {currentBooking.client.first_name} {currentBooking.client.last_name}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="label">Номер</label>
              <div className="px-3 py-2 border border-gray-300 rounded bg-gray-50">
                {currentBooking.room.room_number}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="label">Дата заезда</label>
              <input 
                type="date" 
                className="input w-full" 
                value={currentBooking.check_in_date}
                onChange={(e) => {
                  const newCheckInDate = e.target.value;
                  setCurrentBooking({
                    ...currentBooking,
                    check_in_date: newCheckInDate,
                    check_out_date: currentBooking.check_out_date && 
                      new Date(currentBooking.check_out_date) <= new Date(newCheckInDate) ? 
                      '' : currentBooking.check_out_date
                  });
                }}
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Дата выезда</label>
              <input 
                type="date" 
                className="input w-full" 
                value={currentBooking.check_out_date}
                min={currentBooking.check_in_date}
                onChange={(e) => setCurrentBooking({...currentBooking, check_out_date: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Статус</label>
              <select 
                className="select w-full"
                value={currentBooking.status}
                onChange={(e) => setCurrentBooking({...currentBooking, status: e.target.value})}
              >
                <option value="Подтверждено">Подтверждено</option>
                <option value="Заселен">Заселен</option>
                <option value="Выселен">Выселен</option>
                <option value="Отменено">Отменено</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setCurrentBooking(null);
                }}
              >
                Отмена
              </button>
              <button 
                className="btn-primary"
                onClick={handleEditBooking}
                disabled={!currentBooking.check_in_date || !currentBooking.check_out_date}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно для подтверждения удаления */}
      {showDeleteModal && currentBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Подтверждение удаления</h3>
            <p className="mb-6">Вы действительно хотите удалить бронирование номера {currentBooking.room.room_number} для клиента {currentBooking.client.first_name} {currentBooking.client.last_name}?</p>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Отмена
              </button>
              <button 
                className="btn-danger"
                onClick={handleDeleteBooking}
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