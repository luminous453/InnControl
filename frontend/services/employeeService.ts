import api from './api';

// Интерфейсы для типов данных
export interface Employee {
  employee_id: number;
  hotel_id: number;
  first_name: string;
  last_name: string;
  status: string;
}

export interface EmployeeCreate {
  hotel_id: number;
  first_name: string;
  last_name: string;
  status?: string;
}

export interface EmployeeStatusUpdate {
  status: string;
}

// Сервис для работы с API сотрудников
export const employeeService = {
  // Получить всех сотрудников
  getAllEmployees: () => {
    return api.get<Employee[]>('/employees/');
  },
  
  // Получить сотрудника по ID
  getEmployee: (id: number) => {
    return api.get<Employee>(`/employees/${id}`);
  },
  
  // Создать нового сотрудника
  createEmployee: (employee: EmployeeCreate) => {
    return api.post<Employee>('/employees/', employee);
  },
  
  // Обновить сотрудника
  updateEmployee: (id: number, employee: EmployeeCreate) => {
    return api.put<Employee>(`/employees/${id}`, employee);
  },
  
  // Обновить статус сотрудника
  updateEmployeeStatus: (id: number, status: EmployeeStatusUpdate) => {
    return api.put<Employee>(`/employees/${id}/status/`, status);
  },
  
  // Удалить сотрудника
  deleteEmployee: (id: number) => {
    return api.delete<Employee>(`/employees/${id}`);
  },
  
  // Получить сотрудников гостиницы
  getEmployeesByHotel: (hotelId: number) => {
    return api.get<Employee[]>(`/hotels/${hotelId}/employees/`);
  }
};

export default employeeService; 