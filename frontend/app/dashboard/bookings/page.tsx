'use client';

import { useState } from 'react';
import { FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaCalendarAlt, FaRegCalendarCheck, FaRegCalendarTimes } from 'react-icons/fa';

// Типы для бронирований
interface Client {
  client_id: number;
  first_name: string;
  last_name: string;
}

interface Room {
  room_id: number;
  room_number: string;
  floor: number;
  type: string;
}

interface Booking {
  booking_id: number;
  client: Client;
  room: Room;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_price: number;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([
    {
      booking_id: 1,
      client: {
        client_id: 1,
        first_name: 'Александр',
        last_name: 'Иванов'
      },
      room: {
        room_id: 1,
        room_number: '101',
        floor: 1,
        type: 'Стандарт'
      },
      check_in_date: '2023-10-15',
      check_out_date: '2023-10-18',
      status: 'Завершено',
      total_price: 9000
    },
    {
      booking_id: 2,
      client: {
        client_id: 2,
        first_name: 'Елена',
        last_name: 'Петрова'
      },
      room: {
        room_id: 2,
        room_number: '205',
        floor: 2,
        type: 'Полулюкс'
      },
      check_in_date: '2023-10-20',
      check_out_date: '2023-10-25',
      status: 'Подтверждено',
      total_price: 20000
    },
    {
      booking_id: 3,
      client: {
        client_id: 3,
        first_name: 'Иван',
        last_name: 'Сидоров'
      },
      room: {
        room_id: 3,
        room_number: '301',
        floor: 3,
        type: 'Люкс'
      },
      check_in_date: '2023-10-18',
      check_out_date: '2023-10-22',
      status: 'Активно',
      total_price: 25000
    },
    {
      booking_id: 4,
      client: {
        client_id: 4,
        first_name: 'Мария',
        last_name: 'Козлова'
      },
      room: {
        room_id: 4,
        room_number: '102',
        floor: 1,
        type: 'Стандарт'
      },
      check_in_date: '2023-11-01',
      check_out_date: '2023-11-05',
      status: 'Подтверждено',
      total_price: 12000
    },
    {
      booking_id: 5,
      client: {
        client_id: 5,
        first_name: 'Дмитрий',
        last_name: 'Новиков'
      },
      room: {
        room_id: 5,
        room_number: '202',
        floor: 2,
        type: 'Полулюкс'
      },
      check_in_date: '2023-10-10',
      check_out_date: '2023-10-12',
      status: 'Отменено',
      total_price: 8000
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // В реальном проекте здесь будет загрузка данных с API
  // useEffect(() => {
  //   fetch('/api/bookings')
  //     .then(res => res.json())
  //     .then(data => setBookings(data));
  // }, []);
  
  // Фильтрация бронирований
  const filteredBookings = bookings.filter(booking => {
    const clientName = `${booking.client.first_name} ${booking.client.last_name}`.toLowerCase();
    const roomInfo = `${booking.room.room_number} ${booking.room.type}`.toLowerCase();
    
    const matchesSearch = 
      clientName.includes(searchTerm.toLowerCase()) ||
      roomInfo.includes(searchTerm.toLowerCase());
    
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

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Бронирования</h2>
        <button className="btn-primary flex items-center space-x-2">
          <FaPlus />
          <span>Новое бронирование</span>
        </button>
      </div>
      
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
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <FaFilter className="absolute left-3 top-3 text-gray-400" />
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Номер</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Заезд</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Выезд</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBookings.map(booking => (
              <tr key={booking.booking_id}>
                <td className="px-6 py-4 whitespace-nowrap">{booking.booking_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {booking.client.first_name} {booking.client.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {booking.room.room_number} ({booking.room.type})
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{booking.check_in_date}</td>
                <td className="px-6 py-4 whitespace-nowrap">{booking.check_out_date}</td>
                <td className="px-6 py-4 whitespace-nowrap">{booking.total_price} ₽</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                    {getStatusIcon(booking.status)}
                    {booking.status}
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
      
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Информация</h3>
        <div className="bg-white p-4 rounded-lg shadow">
          <p>В этом разделе вы можете управлять бронированиями номеров гостиницы.</p>
          <p className="mt-2">Для создания нового бронирования нажмите кнопку "Новое бронирование".</p>
          <p className="mt-2">Для редактирования бронирования используйте кнопку редактирования в таблице.</p>
        </div>
      </div>
    </div>
  );
} 