'use client';

import { useState, useEffect } from 'react';
import { FaBroom, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { cleaningService, CleaningScheduleWithDetails } from '@/services/cleaningService';
import { employeeService, Employee } from '@/services/employeeService';
import { roomService } from '@/services/roomService';

// Функция для обработки удаления записей сотрудника из журнала уборок
const handleDeleteScheduleAndCleaningLogs = async (scheduleId: number, employeeId: number, floor: number, dayOfWeek: string): Promise<boolean> => {
  try {
    // Сначала удаляем расписание
    await cleaningService.deleteCleaningSchedule(scheduleId);
    
    // Получаем все будущие записи журнала уборок для этого сотрудника
    const logsForEmployee = await cleaningService.getCleaningLogsByEmployee(employeeId);
    
    // Получаем текущую дату
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Выбираем будущие записи со статусом "Не начата" и соответствующие удаленному расписанию
    const logsToDelete = logsForEmployee.filter(log => {
      // Преобразуем дату лога
      const logDate = new Date(log.cleaning_date);
      logDate.setHours(0, 0, 0, 0);
      
      // Получаем день недели для этой даты
      const logDayOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'][logDate.getDay()];
      
      return log.status === 'Не начата' && // Только записи со статусом "Не начата"
             logDate > today && // Только будущие даты
             log.floor_id === floor && // Тот же этаж
             logDayOfWeek === dayOfWeek; // Тот же день недели
    });
    
    // Удаляем найденные записи
    for (const log of logsToDelete) {
      try {
        await cleaningService.deleteCleaningLog(log.log_id);
        console.log(`Удалена запись уборки ID ${log.log_id} для этажа ${log.floor_id} на ${log.cleaning_date}`);
      } catch (err) {
        console.error(`Ошибка при удалении записи уборки ID ${log.log_id}:`, err);
      }
    }
    
    if (logsToDelete.length > 0) {
      console.log(`Удалено ${logsToDelete.length} будущих записей уборок для сотрудника ID ${employeeId}`);
    }
    
    return true;
  } catch (err) {
    console.error('Ошибка при удалении расписания и связанных записей:', err);
    return false;
  }
};

export default function CleaningSchedulePage() {
  const [schedules, setSchedules] = useState<CleaningScheduleWithDetails[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [floors, setFloors] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<CleaningScheduleWithDetails | null>(null);
  const [newSchedule, setNewSchedule] = useState({
    employee_id: 0,
    floor: 0,
    day_of_week: ''
  });
  
  const weekdays = [
    'Понедельник',
    'Вторник',
    'Среда',
    'Четверг',
    'Пятница',
    'Суббота',
    'Воскресенье'
  ];
  
  // Загрузка данных с API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Получаем все этажи из номеров
        const roomsData = await roomService.getAllRooms();
        if (roomsData && roomsData.length > 0) {
          // Получаем уникальные этажи и сортируем их
          const uniqueFloors = Array.from(new Set(roomsData.map(room => room.floor))).sort((a, b) => a - b);
          setFloors(uniqueFloors);
        }
        
        // Получаем всех сотрудников с повторными попытками при необходимости
        let employeesData: Employee[] = [];
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts) {
          try {
            employeesData = await employeeService.getAllEmployees();
            if (employeesData && employeesData.length > 0) {
              console.log(`Успешно загружены ${employeesData.length} сотрудников из БД`);
              // Фильтруем сотрудников только с активным статусом
              employeesData = employeesData.filter(emp => emp.status === 'Активен');
              console.log(`Отфильтровано ${employeesData.length} активных сотрудников`);
              break;
            } else {
              console.warn('Получен пустой список сотрудников, повторная попытка...');
              attempts++;
            }
          } catch (err) {
            console.error(`Ошибка при загрузке сотрудников (попытка ${attempts + 1}/${maxAttempts}):`, err);
            attempts++;
            if (attempts === maxAttempts) {
              throw new Error('Не удалось загрузить список сотрудников после нескольких попыток');
            }
            // Ждем перед повторной попыткой
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        setEmployees(employeesData);
        
        // Получаем все расписания уборок
        const schedulesData = await cleaningService.getAllCleaningSchedules();
        
        // Получаем детали для каждого расписания
        const schedulesWithDetails = await Promise.all(
          schedulesData.map(async (schedule) => {
            try {
              return await cleaningService.getCleaningSchedule(schedule.schedule_id);
            } catch (err) {
              console.error(`Ошибка при получении деталей расписания ${schedule.schedule_id}:`, err);
              return null;
            }
          })
        );
        
        // Фильтруем null значения
        setSchedules(schedulesWithDetails.filter(Boolean) as CleaningScheduleWithDetails[]);
      } catch (err) {
        console.error('Ошибка при загрузке данных:', err);
        setError('Не удалось загрузить данные расписания');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Проверка на возможность добавления сотрудника в расписание
  const canAssignEmployee = (employeeId: number, floor: number, dayOfWeek: string): boolean => {
    // Проверяем, не назначен ли сотрудник на другой этаж в этот день
    const employeeSchedulesForDay = schedules.filter(
      schedule => 
        schedule.employee.employee_id === employeeId && 
        schedule.day_of_week === dayOfWeek
    );
    
    // Если у сотрудника нет расписаний в этот день, то можно назначить
    if (employeeSchedulesForDay.length === 0) {
      return true;
    }
    
    // Если редактируем и пытаемся назначить сотрудника на тот же этаж, что и раньше
    if (currentSchedule && 
        currentSchedule.employee.employee_id === employeeId && 
        currentSchedule.day_of_week === dayOfWeek && 
        currentSchedule.floor === floor) {
      return true;
    }
    
    // Если у сотрудника уже есть назначение на другой этаж в этот день
    return !employeeSchedulesForDay.some(schedule => schedule.floor !== floor);
  };
  
  // Добавление сотрудника в расписание
  const handleAddSchedule = async () => {
    try {
      if (!newSchedule.employee_id || !newSchedule.floor || !newSchedule.day_of_week) {
        setError('Заполните все поля');
        return;
      }
      
      // Проверяем, можно ли добавить сотрудника
      if (!canAssignEmployee(newSchedule.employee_id, newSchedule.floor, newSchedule.day_of_week)) {
        setError('Этот сотрудник уже назначен на другой этаж в этот день');
        return;
      }
      
      // Проверяем, нет ли уже назначения на этот этаж в этот день
      const existingScheduleForFloor = schedules.find(
        schedule => schedule.floor === newSchedule.floor && schedule.day_of_week === newSchedule.day_of_week
      );
      
      if (existingScheduleForFloor) {
        setError('На этот этаж уже назначен другой сотрудник в этот день');
        return;
      }
      
      // Создаем новое расписание
      const createdSchedule = await cleaningService.createCleaningSchedule(newSchedule);
      
      // Получаем детали созданного расписания
      const scheduleWithDetails = await cleaningService.getCleaningSchedule(createdSchedule.schedule_id);
      
      // Добавляем в список
      setSchedules(prev => [...prev, scheduleWithDetails]);
      
      // Сбрасываем форму и закрываем модальное окно
      setNewSchedule({
        employee_id: 0,
        floor: 0,
        day_of_week: ''
      });
      setShowAddModal(false);
      setError(null);
    } catch (err) {
      console.error('Ошибка при создании расписания:', err);
      setError('Не удалось создать расписание');
    }
  };
  
  // Обновление расписания
  const handleEditSchedule = async () => {
    try {
      if (!currentSchedule) return;
      
      const updateData = {
        employee_id: currentSchedule.employee.employee_id,
        floor: currentSchedule.floor,
        day_of_week: currentSchedule.day_of_week
      };
      
      // Проверяем, можно ли обновить сотрудника
      if (!canAssignEmployee(updateData.employee_id, updateData.floor, updateData.day_of_week)) {
        setError('Этот сотрудник уже назначен на другой этаж в этот день');
        return;
      }
      
      // Проверяем, нет ли уже назначения на этот этаж в этот день (кроме текущего расписания)
      const existingScheduleForFloor = schedules.find(
        schedule => 
          schedule.floor === updateData.floor && 
          schedule.day_of_week === updateData.day_of_week &&
          schedule.schedule_id !== currentSchedule.schedule_id
      );
      
      if (existingScheduleForFloor) {
        setError('На этот этаж уже назначен другой сотрудник в этот день');
        return;
      }
      
      // Обновляем расписание
      await cleaningService.updateCleaningSchedule(currentSchedule.schedule_id, updateData);
      
      // Получаем обновленные данные
      const updatedSchedule = await cleaningService.getCleaningSchedule(currentSchedule.schedule_id);
      
      // Обновляем в списке
      setSchedules(prev => 
        prev.map(schedule => 
          schedule.schedule_id === currentSchedule.schedule_id ? updatedSchedule : schedule
        )
      );
      
      // Закрываем модальное окно
      setShowEditModal(false);
      setCurrentSchedule(null);
      setError(null);
    } catch (err) {
      console.error('Ошибка при обновлении расписания:', err);
      setError('Не удалось обновить расписание');
    }
  };
  
  // Удаление расписания
  const handleDeleteSchedule = async () => {
    try {
      if (!currentSchedule) return;
      
      // Используем функцию для удаления расписания и связанных записей уборок
      const success = await handleDeleteScheduleAndCleaningLogs(
        currentSchedule.schedule_id,
        currentSchedule.employee.employee_id,
        currentSchedule.floor,
        currentSchedule.day_of_week
      );
      
      if (success) {
        // Обновляем список
        setSchedules(prev => 
          prev.filter(schedule => schedule.schedule_id !== currentSchedule.schedule_id)
        );
        
        // Закрываем модальное окно
        setShowDeleteModal(false);
        setCurrentSchedule(null);
      } else {
        setError('Не удалось удалить расписание');
      }
    } catch (err) {
      console.error('Ошибка при удалении расписания:', err);
      setError('Не удалось удалить расписание');
    }
  };
  
  // Группировка расписания по дням недели и этажам
  const getSchedulesByWeekdayAndFloor = (weekday: string, floor: number) => {
    return schedules.filter(schedule => schedule.day_of_week === weekday && schedule.floor === floor);
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Расписание уборок</h2>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={() => setShowAddModal(true)}
        >
          <FaPlus />
          <span>Добавить расписание</span>
        </button>
      </div>
      
      {error && error !== 'Этот сотрудник уже назначен на другой этаж в этот день' && 
       error !== 'На этот этаж уже назначен другой сотрудник в этот день' && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : employees.length === 0 ? (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-md">
          Не найдено активных сотрудников. Добавление новых записей в расписание недоступно.
        </div>
      ) : (
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
                              <div key={schedule.schedule_id} className="flex items-center justify-between bg-cream p-2 rounded">
                                <div className="flex items-center">
                                  <FaBroom className="text-accent mr-2" />
                                  <span>{schedule.employee.first_name} {schedule.employee.last_name}</span>
                                </div>
                                <div className="flex space-x-2">
                                  <button 
                                    className="text-secondary hover:text-secondary-hover flex items-center cursor-pointer"
                                    onClick={() => {
                                      setCurrentSchedule(schedule);
                                      setShowEditModal(true);
                                    }}
                                  >
                                    <FaEdit className="text-xl" />
                                  </button>
                                  <button 
                                    className="text-red-600 hover:text-red-800 flex items-center cursor-pointer"
                                    onClick={() => {
                                      setCurrentSchedule(schedule);
                                      setShowDeleteModal(true);
                                    }}
                                  >
                                    <FaTrash className="text-xl" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <button 
                            className="p-2 border border-dashed border-gray-300 rounded w-full text-center text-gray-500 hover:bg-gray-50"
                            onClick={() => {
                              setNewSchedule({
                                employee_id: 0,
                                floor: floor,
                                day_of_week: weekday
                              });
                              setShowAddModal(true);
                            }}
                          >
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
      )}
      
      {/* Модальное окно для добавления расписания */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Добавить расписание уборки</h3>
            
            {employees.length === 0 ? (
              <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-md">
                Не удалось загрузить список сотрудников из базы данных. 
                Пожалуйста, проверьте соединение с сервером и повторите попытку.
              </div>
            ) : (
              <>
                {(error === 'Этот сотрудник уже назначен на другой этаж в этот день' || 
                  error === 'На этот этаж уже назначен другой сотрудник в этот день') && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
                <div className="mb-4">
                  <label className="label">Сотрудник</label>
                  <select 
                    className="select w-full"
                    value={newSchedule.employee_id}
                    onChange={(e) => setNewSchedule({...newSchedule, employee_id: parseInt(e.target.value)})}
                  >
                    <option value={0}>Выберите сотрудника</option>
                    {employees.map(employee => (
                      <option key={employee.employee_id} value={employee.employee_id}>
                        {employee.first_name} {employee.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="label">Этаж</label>
                  <select 
                    className="select w-full"
                    value={newSchedule.floor}
                    onChange={(e) => setNewSchedule({...newSchedule, floor: parseInt(e.target.value)})}
                  >
                    <option value={0}>Выберите этаж</option>
                    {floors.map(floor => (
                      <option key={floor} value={floor}>
                        Этаж {floor}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="label">День недели</label>
                  <select 
                    className="select w-full"
                    value={newSchedule.day_of_week}
                    onChange={(e) => setNewSchedule({...newSchedule, day_of_week: e.target.value})}
                  >
                    <option value="">Выберите день недели</option>
                    {weekdays.map(weekday => (
                      <option key={weekday} value={weekday}>
                        {weekday}
                      </option>
                    ))}
                  </select>
                </div>
              </>
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
                onClick={handleAddSchedule}
                disabled={employees.length === 0 || !newSchedule.employee_id || !newSchedule.floor || !newSchedule.day_of_week}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно для редактирования расписания */}
      {showEditModal && currentSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Редактировать расписание</h3>
            
            {employees.length === 0 ? (
              <div className="mb-4 p-3 bg-yellow-100 text-yellow-700 rounded-md">
                Не удалось загрузить список сотрудников из базы данных. 
                Редактирование может быть недоступно.
              </div>
            ) : (
              <>
                {(error === 'Этот сотрудник уже назначен на другой этаж в этот день' || 
                  error === 'На этот этаж уже назначен другой сотрудник в этот день') && (
                  <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                    {error}
                  </div>
                )}
                <div className="mb-4">
                  <label className="label">Сотрудник</label>
                  <select 
                    className="select w-full"
                    value={currentSchedule.employee.employee_id}
                    onChange={(e) => setCurrentSchedule({
                      ...currentSchedule, 
                      employee: {
                        ...currentSchedule.employee,
                        employee_id: parseInt(e.target.value),
                        first_name: employees.find(emp => emp.employee_id === parseInt(e.target.value))?.first_name || '',
                        last_name: employees.find(emp => emp.employee_id === parseInt(e.target.value))?.last_name || ''
                      }
                    })}
                  >
                    {employees.map(employee => (
                      <option key={employee.employee_id} value={employee.employee_id}>
                        {employee.first_name} {employee.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="label">Этаж</label>
                  <div className="px-3 py-2 border border-gray-300 rounded bg-gray-50">
                    Этаж {currentSchedule.floor}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="label">День недели</label>
                  <div className="px-3 py-2 border border-gray-300 rounded bg-gray-50">
                    {currentSchedule.day_of_week}
                  </div>
                </div>
              </>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setCurrentSchedule(null);
                }}
              >
                Отмена
              </button>
              <button 
                className="btn-primary"
                onClick={handleEditSchedule}
                disabled={employees.length === 0}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Модальное окно для подтверждения удаления */}
      {showDeleteModal && currentSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Подтверждение удаления</h3>
            <p>
              Вы уверены, что хотите удалить расписание уборки для сотрудника {currentSchedule.employee.first_name} {currentSchedule.employee.last_name} на этаже {currentSchedule.floor} в {currentSchedule.day_of_week}?
            </p>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowDeleteModal(false);
                  setCurrentSchedule(null);
                }}
              >
                Отмена
              </button>
              <button 
                className="btn-primary bg-red-600 hover:bg-red-700"
                onClick={handleDeleteSchedule}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Пояснения</h3>
        <div className="bg-white p-4 rounded-lg shadow">
          <p>В этом разделе вы можете назначить сотрудников для уборки этажей в определенные дни недели.</p>
          <p className="mt-2">Каждый сотрудник может быть назначен на несколько дней недели и этажей, но не может убирать разные этажи в один день.</p>
          <p className="mt-2">Чтобы назначить сотрудника, нажмите на ячейку соответствующего дня и этажа или на кнопку "Добавить расписание".</p>
        </div>
      </div>
    </div>
  );
} 