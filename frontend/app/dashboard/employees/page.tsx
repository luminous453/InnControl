'use client';

import { useState, useEffect } from 'react';
import { FaUserTie, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

// Типы для сотрудников
interface Employee {
  employee_id: number;
  first_name: string;
  last_name: string;
  status: string;
  position: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([
    {
      employee_id: 1,
      first_name: 'Елена',
      last_name: 'Смирнова',
      status: 'Активен',
      position: 'Горничная'
    },
    {
      employee_id: 2,
      first_name: 'Иван',
      last_name: 'Петров',
      status: 'Активен',
      position: 'Горничная'
    },
    {
      employee_id: 3,
      first_name: 'Анна',
      last_name: 'Козлова',
      status: 'Активен',
      position: 'Горничная'
    },
    {
      employee_id: 4,
      first_name: 'Михаил',
      last_name: 'Соколов',
      status: 'В отпуске',
      position: 'Администратор'
    },
    {
      employee_id: 5,
      first_name: 'Сергей',
      last_name: 'Новиков',
      status: 'Уволен',
      position: 'Техник'
    }
  ]);
  
  // В реальном проекте здесь будет загрузка данных с API
  // useEffect(() => {
  //   fetch('/api/employees')
  //     .then(res => res.json())
  //     .then(data => setEmployees(data));
  // }, []);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Активен':
        return 'text-green-600';
      case 'В отпуске':
        return 'text-orange-500';
      case 'Уволен':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Сотрудники</h2>
        <button className="btn-primary flex items-center space-x-2">
          <FaPlus />
          <span>Добавить сотрудника</span>
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Фамилия</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Должность</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map(employee => (
              <tr key={employee.employee_id}>
                <td className="px-6 py-4 whitespace-nowrap">{employee.employee_id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{employee.first_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{employee.last_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{employee.position}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center ${getStatusColor(employee.status)}`}>
                    {employee.status === 'Активен' ? <FaCheck className="mr-1" /> : 
                     employee.status === 'Уволен' ? <FaTimes className="mr-1" /> : null}
                    {employee.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-3">
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
          <p>В этом разделе вы можете управлять данными о сотрудниках гостиницы.</p>
          <p className="mt-2">Для добавления нового сотрудника нажмите кнопку "Добавить сотрудника".</p>
          <p className="mt-2">Для редактирования информации о сотруднике используйте кнопку редактирования в таблице.</p>
        </div>
      </div>
    </div>
  );
} 