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
    console.log('Запрос всех гостиниц...');
    return api.get<Hotel[]>('/hotels/');
  },
  
  // Получить гостиницу по ID
  getHotel: (id: number) => {
    console.log(`Запрос гостиницы с ID=${id}...`);
    return api.get<Hotel>(`/hotels/${id}`);
  },
  
  // Получить номера гостиницы
  getHotelRooms: (hotelId: number) => {
    console.log(`Запрос номеров гостиницы с ID=${hotelId}...`);
    return api.get<Room[]>(`/hotels/${hotelId}/rooms/`);
  },
  
  // Получить сотрудников гостиницы
  getHotelEmployees: (hotelId: number) => {
    console.log(`Запрос сотрудников гостиницы с ID=${hotelId}...`);
    return api.get<Employee[]>(`/hotels/${hotelId}/employees/`);
  },
  
  // Получить статистику по гостинице
  getHotelStatistics: async (hotelId: number) => {
    try {
      console.log(`Получение статистики для гостиницы с ID=${hotelId}...`);
      
      // Делаем запросы к API
      console.log('Отправка запросов к API...');
      
      // Используем последовательные запросы вместо Promise.all для лучшей обработки ошибок
      try {
        console.log(`Запрос информации о гостинице с ID=${hotelId}...`);
        const hotel = await hotelService.getHotel(hotelId);
        console.log('Получены данные о гостинице:', hotel);
        
        console.log(`Запрос номеров гостиницы с ID=${hotelId}...`);
        const rooms = await hotelService.getHotelRooms(hotelId);
        console.log(`Получено ${rooms.length} номеров`);
        
        console.log(`Запрос сотрудников гостиницы с ID=${hotelId}...`);
        const employees = await hotelService.getHotelEmployees(hotelId);
        console.log(`Получено ${employees.length} сотрудников`);
        
        // Количество занятых номеров
        const occupiedRooms = rooms.filter(room => room.status === 'Занят').length;
        console.log(`Занятых номеров: ${occupiedRooms}`);
        
        // Количество доступных номеров
        const availableRooms = rooms.filter(room => room.status === 'Свободен').length;
        console.log(`Свободных номеров: ${availableRooms}`);
        
        // Заполняемость
        const occupancyRate = rooms.length > 0 
          ? Math.round((occupiedRooms / rooms.length) * 100) 
          : 0;
        console.log(`Заполняемость: ${occupancyRate}%`);
        
        const result = {
          totalRooms: hotel.total_rooms,
          occupiedRooms,
          availableRooms,
          totalEmployees: employees.length,
          occupancyRate,
          // Дополнительные поля для совместимости с интерфейсом
          totalBookings: 0,
          totalClients: 0,
          averageRating: 0
        };
        
        console.log('Результат статистики:', result);
        return result;
      } catch (error) {
        console.error('Ошибка при получении данных гостиницы:', error);
        
        // Возвращаем пустую статистику в случае ошибки
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
    } catch (error) {
      console.error('Ошибка при получении статистики:', error);
      throw error;
    }
  }
}; 