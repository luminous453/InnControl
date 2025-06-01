'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  FaHome, 
  FaBed, 
  FaCalendarAlt, 
  FaUsers, 
  FaUserTie, 
  FaBroom, 
  FaHistory, 
  FaSignOutAlt,
  FaChartLine
} from 'react-icons/fa';

const Sidebar = () => {
  const pathname = usePathname();
  
  const isActive = (path: string) => {
    return pathname === path;
  };

  const menuItems = [
    {
      name: 'Главная',
      path: '/dashboard',
      icon: <FaHome className="w-5 h-5" />
    },
    {
      name: 'Номера',
      path: '/dashboard/rooms',
      icon: <FaBed className="w-5 h-5" />
    },
    {
      name: 'Бронирования',
      path: '/dashboard/bookings',
      icon: <FaCalendarAlt className="w-5 h-5" />
    },
    {
      name: 'Клиенты',
      path: '/dashboard/clients',
      icon: <FaUsers className="w-5 h-5" />
    },
    {
      name: 'Сотрудники',
      path: '/dashboard/employees',
      icon: <FaUserTie className="w-5 h-5" />
    },
    {
      name: 'Расписание уборок',
      path: '/dashboard/cleaning',
      icon: <FaBroom className="w-5 h-5" />
    },
    {
      name: 'Журнал уборок',
      path: '/dashboard/cleaning/logs',
      icon: <FaHistory className="w-5 h-5" />
    },
    {
      name: 'Финансовые отчеты',
      path: '/dashboard/reports',
      icon: <FaChartLine className="w-5 h-5" />
    }
  ];

  return (
    <div className="w-64 h-screen bg-brown text-white flex flex-col">
      <div className="p-4 border-b border-brown-hover">
        <h1 className="text-2xl font-bold">InnControl</h1>
        <p className="text-sm opacity-75">Система управления гостиницей</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Link 
            href={item.path} 
            key={item.path}
            className={`sidebar-link ${isActive(item.path) ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-brown-hover">
        <Link 
          href="/"
          className="sidebar-link"
        >
          <FaSignOutAlt className="w-5 h-5" />
          <span>Выйти</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar; 