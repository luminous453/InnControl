'use client';

import { useState, useEffect } from 'react';
import { FaUserTie, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { employeeService, Employee as ApiEmployee } from '@/services/employeeService';
import { cleaningService } from '@/services/cleaningService';

// Расширенный интерфейс сотрудника для отображения
interface EmployeeDisplay extends ApiEmployee {
  cleaning_count?: number;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeDisplay | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    first_name: '',
    last_name: '',
    hotel_id: 1
  });
  
  // Загрузка данных с API
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        const data = await employeeService.getAllEmployees();
        
        // Загружаем количество уборок для каждого сотрудника
        const employeesWithCleaningCounts = await Promise.all(
          data.map(async (emp) => {
            try {
              // Получаем журнал уборок для сотрудника
              const cleaningLogs = await cleaningService.getCleaningLogsByEmployee(emp.employee_id);
              
              // Считаем только завершенные уборки
              const completedCleanings = cleaningLogs.filter(log => log.status === 'Завершена').length;
              
              return {
                ...emp,
                cleaning_count: completedCleanings
              };
            } catch (err) {
              console.error(`Ошибка при получении уборок для сотрудника ${emp.employee_id}:`, err);
              return {
                ...emp,
                cleaning_count: 0
              };
            }
          })
        );
        
        setEmployees(employeesWithCleaningCounts);
        setError(null);
      } catch (err) {
        console.error('Ошибка при загрузке сотрудников:', err);
        setError('Не удалось загрузить данные сотрудников');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  // Функция для создания нового сотрудника
  const handleCreateEmployee = async () => {
    try {
      // Проверяем наличие обязательных полей
      if (!newEmployee.first_name || !newEmployee.last_name) {
        setError('Пожалуйста, заполните имя и фамилию сотрудника');
        return;
      }

      // Подготавливаем данные сотрудника
      const employeeData = {
        hotel_id: newEmployee.hotel_id,
        first_name: newEmployee.first_name,
        last_name: newEmployee.last_name,
        status: 'Активен'
      };
      
      console.log('Отправляем данные сотрудника:', employeeData);
      
      // Отправляем запрос на создание сотрудника
      const createdEmployee = await employeeService.createEmployee(employeeData);
      console.log('Получен ответ от сервера:', createdEmployee);
      
      // Добавляем созданного сотрудника в список
      setEmployees(prev => [...prev, {
        ...createdEmployee,
        cleaning_count: 0
      }]);
      
      // Сбрасываем форму и закрываем модальное окно
      setNewEmployee({
        first_name: '',
        last_name: '',
        hotel_id: 1
      });
      setShowModal(false);
      setError(null); // Сбрасываем ошибку при успешном создании
    } catch (err) {
      console.error('Ошибка при создании сотрудника:', err);
      // Более подробная информация об ошибке
      if (err instanceof Error) {
        setError(`Не удалось создать сотрудника: ${err.message}`);
      } else {
        setError('Не удалось создать сотрудника. Проверьте соединение с сервером.');
      }
    }
  };

  // Функция для обновления статуса сотрудника
  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const statusUpdate = { status }; // Создаем объект с полем status
      await employeeService.updateEmployeeStatus(id, statusUpdate);
      
      // Обновляем статус в локальном состоянии
      setEmployees(prev => 
        prev.map(emp => 
          emp.employee_id === id ? { ...emp, status } : emp
        )
      );

      // Если статус изменен на "Уволен", показываем сообщение об успехе
      if (status === 'Уволен') {
        setShowSuccessModal(true);
        setTimeout(() => setShowSuccessModal(false), 3000); // Скрываем через 3 секунды
      }
    } catch (err) {
      console.error('Ошибка при обновлении статуса:', err);
      setError('Не удалось обновить статус сотрудника');
    }
  };
  
  // Функция для редактирования сотрудника
  const handleEditEmployee = async () => {
    if (!editingEmployee) return;
    
    try {
      const employeeData = {
        hotel_id: editingEmployee.hotel_id,
        first_name: editingEmployee.first_name,
        last_name: editingEmployee.last_name,
        status: editingEmployee.status
      };
      
      await employeeService.updateEmployee(editingEmployee.employee_id, employeeData);
      
      // Обновляем сотрудника в списке
      setEmployees(prev => 
        prev.map(emp => 
          emp.employee_id === editingEmployee.employee_id ? editingEmployee : emp
        )
      );
      
      // Закрываем модальное окно
      setEditingEmployee(null);
      setShowEditModal(false);
    } catch (err) {
      console.error('Ошибка при редактировании сотрудника:', err);
      setError('Не удалось обновить данные сотрудника');
    }
  };
  
  // Функция для открытия модального окна редактирования
  const openEditModal = (employee: EmployeeDisplay) => {
    setEditingEmployee(employee);
    setShowEditModal(true);
  };
  
  // Функция для открытия модального окна подтверждения увольнения
  const openDeleteConfirmation = (id: number) => {
    setSelectedEmployeeId(id);
    setShowDeleteModal(true);
  };
  
  // Функция для удаления сотрудника
  const handleDeleteEmployee = async () => {
    if (!selectedEmployeeId) return;
    
    try {
      await employeeService.deleteEmployee(selectedEmployeeId);
      
      // Удаляем сотрудника из списка
      setEmployees(prev => prev.filter(emp => emp.employee_id !== selectedEmployeeId));
      
      // Закрываем модальное окно подтверждения и показываем сообщение об успехе
      setShowDeleteModal(false);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 3000); // Скрываем через 3 секунды
    } catch (err) {
      console.error('Ошибка при удалении сотрудника:', err);
      setError('Не удалось удалить сотрудника');
      setShowDeleteModal(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Сотрудники</h2>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={() => setShowModal(true)}
        >
          <FaPlus />
          <span>Добавить сотрудника</span>
        </button>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Фамилия</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Уборок</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map(employee => (
                <tr key={employee.employee_id}>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.first_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.last_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      className="px-3 py-2 text-sm font-medium rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      value={employee.status}
                      onChange={(e) => handleUpdateStatus(employee.employee_id, e.target.value)}
                    >
                      <option value="Активен">Активен</option>
                      <option value="В отпуске">В отпуске</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.cleaning_count || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        className="text-secondary hover:text-secondary-hover"
                        onClick={() => openEditModal(employee)}
                      >
                        <FaEdit className="text-xl" />
                      </button>
                      {employee.status === 'Активен' ? (
                        <button 
                          className="text-yellow-500 hover:text-yellow-700"
                          onClick={() => handleUpdateStatus(employee.employee_id, 'В отпуске')}
                          title="Отправить в отпуск"
                        >
                          <FaTimes />
                        </button>
                      ) : (
                        <button 
                          className="text-green-500 hover:text-green-700"
                          onClick={() => handleUpdateStatus(employee.employee_id, 'Активен')}
                          title="Вернуть к работе"
                        >
                          <FaCheck />
                        </button>
                      )}
                      <button 
                        className="text-red-600 hover:text-red-800"
                        onClick={() => openDeleteConfirmation(employee.employee_id)}
                        title="Удалить сотрудника"
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
          <p>В этом разделе вы можете управлять данными о сотрудниках гостиницы.</p>
          <p className="mt-2">Для добавления нового сотрудника нажмите кнопку "Добавить сотрудника".</p>
          <p className="mt-2">Для управления статусом или редактирования сотрудника используйте кнопки в таблице.</p>
        </div>
      </div>
      
      {/* Модальное окно для добавления сотрудника */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Добавить сотрудника</h3>
            
            <div className="mb-4">
              <label className="label">Имя</label>
              <input 
                type="text" 
                className="input w-full" 
                value={newEmployee.first_name}
                onChange={(e) => setNewEmployee({...newEmployee, first_name: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Фамилия</label>
              <input 
                type="text" 
                className="input w-full" 
                value={newEmployee.last_name}
                onChange={(e) => setNewEmployee({...newEmployee, last_name: e.target.value})}
              />
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Отмена
              </button>
              <button 
                className="btn-primary"
                onClick={handleCreateEmployee}
                disabled={!newEmployee.first_name || !newEmployee.last_name}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно для редактирования сотрудника */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Редактировать сотрудника</h3>
            
            <div className="mb-4">
              <label className="label">Имя</label>
              <input 
                type="text" 
                className="input w-full" 
                value={editingEmployee.first_name}
                onChange={(e) => setEditingEmployee({...editingEmployee, first_name: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Фамилия</label>
              <input 
                type="text" 
                className="input w-full" 
                value={editingEmployee.last_name}
                onChange={(e) => setEditingEmployee({...editingEmployee, last_name: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="label">Статус</label>
              <select 
                className="select w-full"
                value={editingEmployee.status}
                onChange={(e) => setEditingEmployee({...editingEmployee, status: e.target.value})}
              >
                <option value="Активен">Активен</option>
                <option value="В отпуске">В отпуске</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setEditingEmployee(null);
                  setShowEditModal(false);
                }}
              >
                Отмена
              </button>
              <button 
                className="btn-primary"
                onClick={handleEditEmployee}
                disabled={!editingEmployee.first_name || !editingEmployee.last_name}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно подтверждения увольнения сотрудника */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Подтверждение</h3>
            <p className="mb-6">Вы уверены, что хотите уволить выбранного сотрудника?</p>
            
            <div className="flex justify-end space-x-3">
              <button 
                className="btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Отмена
              </button>
              <button 
                className="btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500"
                onClick={handleDeleteEmployee}
              >
                Уволить
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно успешного увольнения сотрудника */}
      {showSuccessModal && (
        <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 p-4 rounded-lg shadow-lg z-50 flex items-center">
          <FaCheck className="mr-2" />
          <span>Сотрудник успешно уволен</span>
        </div>
      )}
    </div>
  );
} 