'use client';

import { usePathname } from 'next/navigation';
import { FaBell, FaUser } from 'react-icons/fa';

const Header = () => {
  const pathname = usePathname();
  
  // Определяем текущий заголовок на основе пути
  const getPageTitle = () => {
    const path = pathname.split('/').pop();
    
    switch(path) {
      case 'dashboard':
        return 'Панель управления';
      case 'rooms':
        return 'Управление номерами';
      case 'bookings':
        return 'Управление бронированиями';
      case 'clients':
        return 'Клиенты';
      case 'employees':
        return 'Персонал';
      case 'cleaning':
        return 'Расписание уборок';
      case 'cleaning-logs':
        return 'История уборок';
      default:
        return 'InnControl';
    }
  };

  return (
    <header className="bg-white shadow-sm p-4 flex justify-between items-center">
      <h1 className="text-xl font-semibold text-primary">{getPageTitle()}</h1>
      
      <div className="flex items-center space-x-4">
        <button className="relative p-2 rounded-full hover:bg-cream">
          <FaBell className="w-5 h-5 text-primary" />
          <span className="absolute top-0 right-0 inline-block w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <FaUser className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium">Администратор</p>
            <p className="text-xs text-gray-500">admin@inncontrol.com</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header; 