import api from './api';
import { Room } from './cleaningService';
import { Employee } from './employeeService';

// Интерфейсы для типов данных
export interface Hotel {
  hotel_id: number;
  name: string;
  total_rooms: number;
}

export interface HotelWithDetails extends Hotel {
  rooms: Room[];
  employees: Employee[];
}

// Сервис для работы с API гостиниц
export const hotelService = {
  // Получить все гостиницы
  getAllHotels: () => {
    return api.get<Hotel[]>('/hotels/');
  },
  
  // Получить гостиницу по ID
  getHotel: (id: number) => {
    return api.get<Hotel>(`/hotels/${id}`);
  },
  
  // Получить номера гостиницы
  getHotelRooms: (hotelId: number) => {
    return api.get<Room[]>(`/hotels/${hotelId}/rooms/`);
  },
  
  // Получить сотрудников гостиницы
  getHotelEmployees: (hotelId: number) => {
    return api.get<Employee[]>(`/hotels/${hotelId}/employees/`);
  },
  
  // Получить статистику по гостинице
  getHotelStatistics: async (hotelId: number) => {
    try {
      // Получаем данные о гостинице
      const hotel = await hotelService.getHotel(hotelId);
      
      // Получаем номера гостиницы
      const rooms = await hotelService.getHotelRooms(hotelId);
      
      // Получаем сотрудников гостиницы
      const employees = await hotelService.getHotelEmployees(hotelId);
      
      // Количество занятых номеров
      const occupiedRooms = rooms.filter(room => room.status === 'Занят').length;
      
      // Количество доступных номеров
      const availableRooms = rooms.filter(room => room.status === 'Свободен').length;
      
      // Заполняемость
      const occupancyRate = rooms.length > 0 
        ? Math.round((occupiedRooms / rooms.length) * 100) 
        : 0;
      
      return {
        totalRooms: rooms.length,
        occupiedRooms,
        availableRooms,
        totalEmployees: employees.length,
        occupancyRate,
        // Дополнительные поля для совместимости с интерфейсом
        totalBookings: 0,
        totalClients: 0,
        averageRating: 0
      };
    } catch (error) {
      console.error('Ошибка при получении статистики гостиницы:', error);
      
      // В случае ошибки возвращаем нулевые значения
      return {
        totalRooms: 0,
        occupiedRooms: 0,
        availableRooms: 0,
        totalEmployees: 0,
        occupancyRate: 0,
        totalBookings: 0,
        totalClients: 0,
        averageRating: 0
      };
    }
  }
}; 