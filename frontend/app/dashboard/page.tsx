'use client';

import { useState, useEffect } from 'react';
import { FaBed, FaCalendarAlt, FaUsers, FaUserTie, FaChartLine, FaPercent } from 'react-icons/fa';
import { dashboardService } from '@/services/dashboardService';
import { DashboardStats, RecentBooking, RecentCleaning } from '@/services/dashboardService';
import { hotelService } from '@/services/hotelService';

export default function DashboardPage() {
  const [statsData, setStatsData] = useState<DashboardStats>({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    totalBookings: 0,
    totalClients: 0,
    totalEmployees: 0,
    occupancyRate: 0,
    averageRating: 0
  });
  
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [todayCleanings, setTodayCleanings] = useState<RecentCleaning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Загрузка данных с API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Добавляем больше проверок и логирования
        console.log('Начинаем загрузку данных панели управления...');
        
        try {
          // Сначала получаем список всех гостиниц
          console.log('Загрузка списка гостиниц...');
          const hotels = await hotelService.getAllHotels();
          console.log('Получены гостиницы:', hotels);
          
          // Если нет гостиниц, показываем ошибку
          if (!hotels || hotels.length === 0) {
            setError('В базе данных нет гостиниц. Пожалуйста, добавьте хотя бы одну гостиницу.');
            setLoading(false);
            return;
          }
          
          // Берем ID первой гостиницы в списке
          const hotelId = hotels[0].hotel_id;
          console.log(`Используем гостиницу с ID=${hotelId}`);
          
          // Загружаем статистику
          console.log('Загрузка статистики...');
          try {
            const stats = await dashboardService.getDashboardStats(hotelId);
            console.log('Получена статистика:', stats);
            setStatsData(stats);
          } catch (statsError) {
            console.error('Ошибка при загрузке статистики:', statsError);
            // Продолжаем загрузку других данных, даже если статистика не загрузилась
          }
          
          // Загружаем последние бронирования
          console.log('Загрузка последних бронирований...');
          try {
            const bookings = await dashboardService.getRecentBookings();
            console.log('Получены бронирования:', bookings);
            setRecentBookings(bookings);
          } catch (bookingsError) {
            console.error('Ошибка при загрузке бронирований:', bookingsError);
            // Продолжаем загрузку, даже если бронирования не загрузились
          }
          
          // Загружаем уборки на сегодня
          console.log('Загрузка уборок на сегодня...');
          try {
            const cleanings = await dashboardService.getTodayCleanings();
            console.log('Получены уборки:', cleanings);
            setTodayCleanings(cleanings);
          } catch (cleaningsError) {
            console.error('Ошибка при загрузке уборок:', cleaningsError);
            // Продолжаем работу даже если уборки не загрузились
          }
          
        } catch (err) {
          console.error('Общая ошибка при загрузке данных:', err);
          if (err instanceof Error) {
            if (err.message.includes('Failed to fetch')) {
              setError('Не удалось подключиться к API серверу. Пожалуйста, убедитесь, что бэкенд запущен.');
            } else {
              setError(`Ошибка при загрузке данных: ${err.message}`);
            }
          } else {
            setError('Ошибка при загрузке данных. Пожалуйста, проверьте работу сервера API и подключение к базе данных.');
          }
        }
      } catch (err) {
        console.error('Критическая ошибка при загрузке данных:', err);
        
        // Показываем пользователю детали ошибки
        if (err instanceof Error) {
          setError(`Не удалось загрузить данные: ${err.message}`);
        } else {
          setError('Не удалось загрузить данные. Пожалуйста, проверьте подключение к базе данных и запуск сервера API.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };
  
  const statCards = [
    {
      title: 'Всего номеров',
      value: statsData.totalRooms,
      icon: <FaBed className="w-8 h-8 text-secondary" />,
      color: 'bg-secondary-hover'
    },
    {
      title: 'Занято номеров',
      value: statsData.occupiedRooms,
      icon: <FaBed className="w-8 h-8 text-primary" />,
      color: 'bg-primary-hover'
    },
    {
      title: 'Свободно номеров',
      value: statsData.availableRooms,
      icon: <FaBed className="w-8 h-8 text-accent" />,
      color: 'bg-accent-hover'
    },
    {
      title: 'Активных бронирований',
      value: statsData.totalBookings,
      icon: <FaCalendarAlt className="w-8 h-8 text-primary" />,
      color: 'bg-primary-hover'
    },
    {
      title: 'Всего клиентов',
      value: statsData.totalClients,
      icon: <FaUsers className="w-8 h-8 text-secondary" />,
      color: 'bg-secondary-hover'
    },
    {
      title: 'Количество сотрудников',
      value: statsData.totalEmployees,
      icon: <FaUserTie className="w-8 h-8 text-accent" />,
      color: 'bg-accent-hover'
    },
    {
      title: 'Заполняемость',
      value: `${statsData.occupancyRate}%`,
      icon: <FaPercent className="w-8 h-8 text-primary" />,
      color: 'bg-primary-hover'
    },
    {
      title: 'Средний рейтинг',
      value: statsData.averageRating,
      icon: <FaChartLine className="w-8 h-8 text-secondary" />,
      color: 'bg-secondary-hover'
    }
  ];

  // Отображение состояния загрузки
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Отображение ошибки
  if (error) {
    return (
      <div className="bg-red-100 p-4 rounded-md text-red-700">
        <h2 className="text-lg font-semibold">Ошибка</h2>
        <p>{error}</p>
        <div className="mt-4">
          <p className="text-sm">Возможные причины:</p>
          <ul className="list-disc list-inside text-sm mt-2">
            <li>Не запущен бэкенд-сервер (uvicorn)</li>
            <li>Нет подключения к базе данных PostgreSQL</li>
            <li>В базе данных нет гостиницы</li>
            <li>Проблема с API-запросами</li>
          </ul>
        </div>
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => window.location.reload()}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Добро пожаловать, Администратор!</h2>
        <p className="text-gray-600">Обзор текущего состояния гостиницы</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="card flex items-center space-x-4">
            <div className={`p-3 rounded-full ${card.color}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm text-gray-600">{card.title}</p>
              <p className="text-2xl font-semibold">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Последние бронирования</h3>
          {recentBookings.length > 0 ? (
            <div className="space-y-3">
              {recentBookings.map((booking, index) => (
                <div key={index} className="flex justify-between p-2 bg-cream rounded">
                  <p>{booking.clientName}</p>
                  <p>Номер {booking.roomNumber}</p>
                  <p>{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Нет активных бронирований</p>
          )}
        </div>
        
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Уборка на сегодня</h3>
          {todayCleanings.length > 0 ? (
            <div className="space-y-3">
              {todayCleanings.map((cleaning, index) => (
                <div key={index} className="flex justify-between p-2 bg-cream rounded">
                  <p>Номер {cleaning.roomNumber}</p>
                  <p>{cleaning.employeeName}</p>
                  <p className={`
                    ${cleaning.status === 'Завершена' ? 'text-green-600' : ''}
                    ${cleaning.status === 'В процессе' ? 'text-yellow-600' : ''}
                    ${cleaning.status === 'Ожидает' ? 'text-gray-600' : ''}
                  `}>
                    {cleaning.status}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Нет уборок на сегодня</p>
          )}
        </div>
      </div>
    </div>
  );
} 