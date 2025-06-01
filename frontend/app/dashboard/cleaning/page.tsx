'use client';

import { useState } from 'react';
import { FaBroom, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

// Типы для расписания уборок
interface Employee {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
}

interface CleaningSchedule {
  id: number;
  employee: Employee;
  floor: number;
  weekday: string;
}

export default function CleaningSchedulePage() {
  const [schedules, setSchedules] = useState<CleaningSchedule[]>([
    {
      id: 1,
      employee: {
        id: 1,
        first_name: 'Елена',
        last_name: 'Смирнова',
        position: 'Горничная'
      },
      floor: 1,
      weekday: 'Понедельник'
    },
    {
      id: 2,
      employee: {
        id: 2,
        first_name: 'Иван',
        last_name: 'Петров',
        position: 'Горничная'
      },
      floor: 2,
      weekday: 'Понедельник'
    },
    {
      id: 3,
      employee: {
        id: 1,
        first_name: 'Елена',
        last_name: 'Смирнова',
        position: 'Горничная'
      },
      floor: 3,
      weekday: 'Вторник'
    },
    {
      id: 4,
      employee: {
        id: 3,
        first_name: 'Анна',
        last_name: 'Козлова',
        position: 'Горничная'
      },
      floor: 1,
      weekday: 'Среда'
    },
    {
      id: 5,
      employee: {
        id: 2,
        first_name: 'Иван',
        last_name: 'Петров',
        position: 'Горничная'
      },
      floor: 2,
      weekday: 'Среда'
    }
  ]);
  
  const weekdays = [
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
    'Воскресенье'
  ];
  
  const floors = [1, 2, 3];
  
  // Группировка расписания по дням недели и этажам
  const getSchedulesByWeekdayAndFloor = (weekday: string, floor: number) => {
    return schedules.filter(schedule => schedule.weekday === weekday && schedule.floor === floor);
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Расписание уборок</h2>
        <button className="btn-primary flex items-center space-x-2">
          <FaPlus />
          <span>Добавить расписание</span>
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Этаж / День</th>
              {weekdays.map(weekday => (
                <th key={weekday} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {weekday}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {floors.map(floor => (
              <tr key={floor}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">Этаж {floor}</td>
                {weekdays.map(weekday => {
                  const scheduleItems = getSchedulesByWeekdayAndFloor(weekday, floor);
                  return (
                    <td key={`${floor}-${weekday}`} className="px-6 py-4">
                      {scheduleItems.length > 0 ? (
                        <div className="space-y-2">
                          {scheduleItems.map(schedule => (
                            <div key={schedule.id} className="flex items-center justify-between bg-cream p-2 rounded">
                              <div className="flex items-center">
                                <FaBroom className="text-accent mr-2" />
                                <span>{schedule.employee.first_name} {schedule.employee.last_name}</span>
                              </div>
                              <div className="flex space-x-2">
                                <button className="text-secondary hover:text-secondary-hover">
                                  <FaEdit className="text-xl" />
                                </button>
                                <button className="text-red-600 hover:text-red-800">
                                  <FaTrash className="text-xl" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <button className="p-2 border border-dashed border-gray-300 rounded w-full text-center text-gray-500 hover:bg-gray-50">
                          Назначить сотрудника
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Пояснения</h3>
        <div className="bg-white p-4 rounded-lg shadow">
          <p>В этом разделе вы можете назначить сотрудников для уборки этажей в определенные дни недели.</p>
          <p className="mt-2">Каждый сотрудник может быть назначен на несколько дней недели и этажей.</p>
          <p className="mt-2">Чтобы назначить сотрудника, нажмите на ячейку соответствующего дня и этажа.</p>
        </div>
      </div>
    </div>
  );
} 