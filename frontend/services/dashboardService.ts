import { hotelService } from './hotelService';
import { bookingService } from './bookingService';
import { clientService } from './clientService';
import { cleaningService } from './cleaningService';
import { Booking } from './bookingService';
import { CleaningLog } from './cleaningService';

// Интерфейс для статистики на главной странице
export interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  totalBookings: number;
  totalClients: number;
  totalEmployees: number;
  occupancyRate: number;
  averageRating: number;
}

// Интерфейс для получения последних бронирований
export interface RecentBooking {
  clientName: string;
  roomNumber: string;
  checkInDate: string;
  checkOutDate: string;
}

// Интерфейс для получения последних уборок
export interface RecentCleaning {
  roomNumber: string;
  employeeName: string;
  status: string;
}

// Сервис для получения данных для панели администратора
export const dashboardService = {
  // Получить статистику для главной страницы
  getDashboardStats: async (hotelId: number): Promise<DashboardStats> => {
    try {
      // Получаем базовую статистику по гостинице
      const hotelStats = await hotelService.getHotelStatistics(hotelId);
      
      // Получаем все бронирования
      const bookings = await bookingService.getAllBookings();
      
      // Получаем активные бронирования (со статусом "Подтверждено" или "Заселен")
      const activeBookings = bookings.filter(
        booking => booking.status === 'Подтверждено' || booking.status === 'Заселен'
      );
      
      // Получаем всех клиентов
      const clients = await clientService.getAllClients();
      
      // Рассчитываем средний рейтинг на основе данных бронирований
      // (в будущем можно заменить на реальный расчет рейтинга)
      const averageRating = 0;
      
      return {
        ...hotelStats,
        totalBookings: activeBookings.length,
        totalClients: clients.length,
        averageRating
      };
    } catch (error) {
      console.error('Ошибка при получении статистики для панели управления:', error);
      throw error;
    }
  },
  
  // Получить последние бронирования
  getRecentBookings: async (limit = 5): Promise<RecentBooking[]> => {
    try {
      // Получаем все бронирования
      const bookings = await bookingService.getAllBookings();
      
      if (!bookings || bookings.length === 0) {
        return [];
      }
      
      // Сортируем по дате заезда (от новых к старым)
      const sortedBookings = [...bookings].sort(
        (a, b) => new Date(b.check_in_date).getTime() - new Date(a.check_in_date).getTime()
      );
      
      // Берём только последние n бронирований
      const recentBookings = sortedBookings.slice(0, limit);
      
      // Получаем детали по каждому бронированию
      const bookingsWithDetails: RecentBooking[] = [];
      
      for (const booking of recentBookings) {
        try {
          const bookingDetails = await bookingService.getBooking(booking.booking_id);
          
          if (!bookingDetails || !bookingDetails.client || !bookingDetails.room) {
            continue;
          }
          
          bookingsWithDetails.push({
            clientName: `${bookingDetails.client.last_name} ${bookingDetails.client.first_name.charAt(0)}.`,
            roomNumber: `Номер ${bookingDetails.room.room_number}`,
            checkInDate: booking.check_in_date,
            checkOutDate: booking.check_out_date
          });
        } catch (err) {
          console.error(`Ошибка при получении деталей бронирования ${booking.booking_id}:`, err);
        }
      }
      
      return bookingsWithDetails;
    } catch (error) {
      console.error('Ошибка при получении последних бронирований:', error);
      return []; // Возвращаем пустой массив вместо выброса исключения
    }
  },
  
  // Получить сегодняшние уборки
  getTodayCleanings: async (limit = 5): Promise<RecentCleaning[]> => {
    try {
      // Получаем текущую дату в формате YYYY-MM-DD
      const currentDate = new Date();
      const today = currentDate.toISOString().split('T')[0];
      
      // Получаем список уборок на текущую дату
      const cleaningLogs = await cleaningService.getCleaningLogsByDate(today);
      
      if (!cleaningLogs || cleaningLogs.length === 0) {
        return [];
      }
      
      // Получаем детали для каждой уборки
      const cleaningsWithDetails: RecentCleaning[] = [];
      
      // Ограничиваем количество уборок
      const limitedCleanings = cleaningLogs.slice(0, limit);
      
      for (const cleaning of limitedCleanings) {
        try {
          // Получаем детали уборки
          const cleaningDetails = await cleaningService.getCleaningLog(cleaning.log_id);
          
          if (!cleaningDetails || !cleaningDetails.employee) {
            continue;
          }
          
          // Добавляем информацию об уборке
          cleaningsWithDetails.push({
            roomNumber: `Этаж ${cleaning.floor_id}`,
            employeeName: `${cleaningDetails.employee.last_name} ${cleaningDetails.employee.first_name.charAt(0)}.`,
            status: cleaning.status
          });
        } catch (err) {
          console.error(`Ошибка при получении деталей уборки ${cleaning.log_id}:`, err);
        }
      }
      
      return cleaningsWithDetails;
    } catch (error) {
      console.error('Ошибка при получении уборок на сегодня:', error);
      return []; // Возвращаем пустой массив вместо выброса исключения
    }
  }
}; 