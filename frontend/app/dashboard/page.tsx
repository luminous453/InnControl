'use client';

import { useState, useEffect } from 'react';
import { FaBed, FaCalendarAlt, FaUsers, FaUserTie, FaChartLine, FaPercent } from 'react-icons/fa';

// Типы для статистики
interface StatsData {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  totalBookings: number;
  totalClients: number;
  totalEmployees: number;
  occupancyRate: number;
  averageRating: number;
}

export default function DashboardPage() {
  const [statsData, setStatsData] = useState<StatsData>({
    totalRooms: 50,
    occupiedRooms: 35,
    availableRooms: 15,
    totalBookings: 42,
    totalClients: 38,
    totalEmployees: 15,
    occupancyRate: 70,
    averageRating: 4.7
  });
  
  // В реальном проекте здесь будет загрузка данных с API
  // useEffect(() => {
  //   fetch('/api/dashboard/stats')
  //     .then(res => res.json())
  //     .then(data => setStatsData(data));
  // }, []);
  
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
          <div className="space-y-3">
            <div className="flex justify-between p-2 bg-cream rounded">
              <p>Иванов И.И.</p>
              <p>Номер 102</p>
              <p>12.10.2023 - 15.10.2023</p>
            </div>
            <div className="flex justify-between p-2 bg-cream rounded">
              <p>Петров П.П.</p>
              <p>Номер 205</p>
              <p>14.10.2023 - 16.10.2023</p>
            </div>
            <div className="flex justify-between p-2 bg-cream rounded">
              <p>Сидорова А.В.</p>
              <p>Номер 301</p>
              <p>15.10.2023 - 20.10.2023</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Уборка на сегодня</h3>
          <div className="space-y-3">
            <div className="flex justify-between p-2 bg-cream rounded">
              <p>Номер 101</p>
              <p>Смирнова Е.В.</p>
              <p className="text-green-600">Завершена</p>
            </div>
            <div className="flex justify-between p-2 bg-cream rounded">
              <p>Номер 203</p>
              <p>Козлов А.А.</p>
              <p className="text-yellow-600">В процессе</p>
            </div>
            <div className="flex justify-between p-2 bg-cream rounded">
              <p>Номер 305</p>
              <p>Новикова И.П.</p>
              <p className="text-gray-600">Ожидает</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 