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
      console.log(`Получение статистики для гостиницы с ID=${hotelId}...`);
      
      // Получаем базовую статистику по гостинице
      try {
        console.log('Начинаем запрос статистики гостиницы...');
        const hotelStats = await hotelService.getHotelStatistics(hotelId);
        console.log('Получена статистика гостиницы:', hotelStats);
        
        console.log('Начинаем запрос всех бронирований...');
        // Получаем все бронирования
        const bookings = await bookingService.getAllBookings();
        console.log(`Получено ${bookings.length} бронирований`);
        
        // Получаем активные бронирования (со статусом "Подтверждено" или "Оплачено")
        const activeBookings = bookings.filter(
          booking => booking.status === 'Подтверждено' || booking.status === 'Оплачено'
        );
        console.log(`Из них активных: ${activeBookings.length}`);
        
        console.log('Начинаем запрос всех клиентов...');
        // Получаем всех клиентов
        const clients = await clientService.getAllClients();
        console.log(`Получено ${clients.length} клиентов`);
        
        // Фиксированное значение для среднего рейтинга (в будущем можно добавить функционал отзывов)
        const averageRating = 4.7;
        
        const result = {
          ...hotelStats,
          totalBookings: activeBookings.length,
          totalClients: clients.length,
          averageRating
        };
        
        console.log('Итоговая статистика для главной страницы:', result);
        return result;
      } catch (error) {
        console.error('Ошибка при получении статистики гостиницы:', error);
        if (error instanceof Error) {
          console.error(`Детали ошибки: ${error.message}`);
          console.error(`Стек вызовов: ${error.stack}`);
        }
        throw error;
      }
    } catch (error) {
      console.error('Ошибка при получении статистики для панели:', error);
      throw error;
    }
  },
  
  // Получить последние бронирования
  getRecentBookings: async (limit = 3): Promise<RecentBooking[]> => {
    try {
      console.log(`Получение последних ${limit} бронирований...`);
      
      // Получаем все бронирования
      const bookings = await bookingService.getAllBookings();
      console.log(`Получено всего ${bookings.length} бронирований`);
      
      if (!bookings || bookings.length === 0) {
        console.log('Бронирования не найдены, возвращаем пустой массив');
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
          console.log(`Получение деталей бронирования ${booking.booking_id}...`);
          const bookingDetails = await bookingService.getBooking(booking.booking_id);
          
          if (!bookingDetails || !bookingDetails.client || !bookingDetails.room) {
            console.log(`Пропускаем бронирование ${booking.booking_id} из-за отсутствия данных`);
            continue;
          }
          
          bookingsWithDetails.push({
            clientName: `${bookingDetails.client.last_name} ${bookingDetails.client.first_name.charAt(0)}.`,
            roomNumber: bookingDetails.room.room_number,
            checkInDate: booking.check_in_date,
            checkOutDate: booking.check_out_date
          });
        } catch (err) {
          console.error(`Ошибка при получении деталей бронирования ${booking.booking_id}:`, err);
        }
      }
      
      console.log(`Подготовлено ${bookingsWithDetails.length} бронирований для отображения`);
      return bookingsWithDetails;
      
    } catch (error) {
      console.error('Ошибка при получении последних бронирований:', error);
      return []; // Возвращаем пустой массив вместо выброса исключения
    }
  },
  
  // Получить сегодняшние уборки
  getTodayCleanings: async (limit = 3): Promise<RecentCleaning[]> => {
    try {
      console.log(`Получение ${limit} уборок на сегодня...`);
      
      // Получаем все записи журнала уборок
      const cleaningLogs = await cleaningService.getAllCleaningLogs();
      console.log(`Получено всего ${cleaningLogs.length} записей журнала уборок`);
      
      if (!cleaningLogs || cleaningLogs.length === 0) {
        console.log('Записи уборок не найдены, возвращаем пустой массив');
        return [];
      }
      
      // Получаем текущую дату в формате YYYY-MM-DD
      const today = new Date().toISOString().split('T')[0];
      console.log(`Сегодняшняя дата: ${today}`);
      
      // Фильтруем уборки на сегодня
      const todayCleanings = cleaningLogs.filter(log => 
        log.cleaning_date === today
      );
      console.log(`Уборок на сегодня: ${todayCleanings.length}`);
      
      // Берём только последние n уборок
      const recentCleanings = todayCleanings.slice(0, limit);
      
      // Получаем детали по каждой уборке
      const cleaningsWithDetails: RecentCleaning[] = [];
      
      for (const log of recentCleanings) {
        try {
          console.log(`Получение деталей уборки ${log.log_id}...`);
          const logDetails = await cleaningService.getCleaningLog(log.log_id);
          
          if (!logDetails || !logDetails.room || !logDetails.employee) {
            console.log(`Пропускаем уборку ${log.log_id} из-за отсутствия данных`);
            continue;
          }
          
          cleaningsWithDetails.push({
            roomNumber: logDetails.room.room_number,
            employeeName: `${logDetails.employee.last_name} ${logDetails.employee.first_name.charAt(0)}.`,
            status: log.status
          });
        } catch (err) {
          console.error(`Ошибка при получении деталей уборки ${log.log_id}:`, err);
        }
      }
      
      console.log(`Подготовлено ${cleaningsWithDetails.length} уборок для отображения`);
      return cleaningsWithDetails;
    } catch (error) {
      console.error('Ошибка при получении уборок на сегодня:', error);
      return []; // Возвращаем пустой массив вместо выброса исключения
    }
  }
}; 