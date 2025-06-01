import api from './api';
import { Employee } from './employeeService';

// Интерфейсы для типов данных
export interface Room {
  room_id: number;
  hotel_id: number;
  type_id: number;
  floor: number;
  room_number: string;
  status: string;
}

export interface CleaningSchedule {
  schedule_id: number;
  employee_id: number;
  floor: number;
  day_of_week: string;
}

export interface CleaningScheduleWithDetails extends CleaningSchedule {
  employee: Employee;
}

export interface CleaningScheduleCreate {
  employee_id: number;
  floor: number;
  day_of_week: string;
}

export interface CleaningLog {
  log_id: number;
  room_id: number;
  employee_id: number;
  cleaning_date: string;
  start_time?: string;
  end_time?: string;
  status: string;
}

export interface CleaningLogWithDetails extends CleaningLog {
  room: Room;
  employee: Employee;
}

export interface CleaningLogCreate {
  room_id: number;
  employee_id: number;
  cleaning_date: string;
  status?: string;
}

export interface CleaningLogStatusUpdate {
  status: string;
}

// Сервис для работы с API уборок
export const cleaningService = {
  // Получить все расписания уборок
  getAllCleaningSchedules: () => {
    return api.get<CleaningSchedule[]>('/cleaning-schedules/');
  },
  
  // Получить расписание уборки по ID
  getCleaningSchedule: (id: number) => {
    return api.get<CleaningScheduleWithDetails>(`/cleaning-schedules/${id}`);
  },
  
  // Создать новое расписание уборки
  createCleaningSchedule: (schedule: CleaningScheduleCreate) => {
    return api.post<CleaningSchedule>('/cleaning-schedules/', schedule);
  },
  
  // Обновить расписание уборки
  updateCleaningSchedule: (id: number, schedule: CleaningScheduleCreate) => {
    return api.put<CleaningSchedule>(`/cleaning-schedules/${id}`, schedule);
  },
  
  // Удалить расписание уборки
  deleteCleaningSchedule: (id: number) => {
    return api.delete<CleaningSchedule>(`/cleaning-schedules/${id}`);
  },
  
  // Получить расписания уборок по сотруднику
  getCleaningSchedulesByEmployee: (employeeId: number) => {
    return api.get<CleaningSchedule[]>(`/employees/${employeeId}/cleaning-schedules/`);
  },
  
  // Получить расписания уборок по дню недели
  getCleaningSchedulesByDay: (day: string) => {
    return api.get<CleaningSchedule[]>(`/cleaning-schedules/day/${day}/`);
  },
  
  // Получить все журналы уборок
  getAllCleaningLogs: () => {
    return api.get<CleaningLog[]>('/cleaning-logs/');
  },
  
  // Получить журнал уборки по ID
  getCleaningLog: (id: number) => {
    return api.get<CleaningLogWithDetails>(`/cleaning-logs/${id}`);
  },
  
  // Создать новый журнал уборки
  createCleaningLog: (log: CleaningLogCreate) => {
    return api.post<CleaningLog>('/cleaning-logs/', log);
  },
  
  // Обновить журнал уборки
  updateCleaningLog: (id: number, log: CleaningLogCreate) => {
    return api.put<CleaningLog>(`/cleaning-logs/${id}`, log);
  },
  
  // Обновить статус уборки
  updateCleaningLogStatus: (id: number, status: CleaningLogStatusUpdate) => {
    return api.put<CleaningLog>(`/cleaning-logs/${id}/status`, status);
  },
  
  // Удалить журнал уборки
  deleteCleaningLog: (id: number) => {
    return api.delete<CleaningLog>(`/cleaning-logs/${id}`);
  },
  
  // Получить журналы уборок по номеру
  getCleaningLogsByRoom: (roomId: number) => {
    return api.get<CleaningLog[]>(`/rooms/${roomId}/cleaning-logs/`);
  },
  
  // Получить журналы уборок по сотруднику
  getCleaningLogsByEmployee: (employeeId: number) => {
    return api.get<CleaningLog[]>(`/employees/${employeeId}/cleaning-logs/`);
  },
  
  // Получить журналы уборок по дате
  getCleaningLogsByDate: (date: string) => {
    return api.get<CleaningLog[]>(`/cleaning-logs/date/${date}/`);
  },
  
  // Завершить уборку
  completeCleaningLog: (id: number) => {
    return api.post<CleaningLog>(`/cleaning-logs/${id}/complete/`, {});
  }
};

export default cleaningService; 