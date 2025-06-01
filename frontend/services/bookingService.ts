import api from './api';
import { Client } from './clientService';
import { Room } from './cleaningService';

// Интерфейсы для типов данных
export interface Booking {
  booking_id: number;
  room_id: number;
  client_id: number;
  check_in_date: string;
  check_out_date: string;
  status: string;
}

export interface BookingWithDetails extends Booking {
  client: Client;
  room: Room;
}

export interface BookingCreate {
  room_id: number;
  client_id: number;
  check_in_date: string;
  check_out_date: string;
  status?: string;
}

export interface BookingStatusUpdate {
  status: string;
}

// Сервис для работы с API бронирований
export const bookingService = {
  // Получить все бронирования
  getAllBookings: () => {
    return api.get<Booking[]>('/bookings/');
  },
  
  // Получить бронирование по ID
  getBooking: (id: number) => {
    return api.get<BookingWithDetails>(`/bookings/${id}`);
  },
  
  // Создать новое бронирование
  createBooking: (booking: BookingCreate) => {
    return api.post<Booking>('/bookings/', booking);
  },
  
  // Обновить бронирование
  updateBooking: (id: number, booking: BookingCreate) => {
    return api.put<Booking>(`/bookings/${id}`, booking);
  },
  
  // Обновить статус бронирования
  updateBookingStatus: (id: number, status: BookingStatusUpdate) => {
    return api.put<Booking>(`/bookings/${id}/status`, status);
  },
  
  // Удалить бронирование
  deleteBooking: (id: number) => {
    return api.delete<Booking>(`/bookings/${id}`);
  },
  
  // Получить бронирования клиента
  getBookingsByClient: (clientId: number) => {
    return api.get<Booking[]>(`/clients/${clientId}/bookings/`);
  },
  
  // Получить бронирования номера
  getBookingsByRoom: (roomId: number) => {
    return api.get<Booking[]>(`/rooms/${roomId}/bookings/`);
  },
  
  // Получить доступные номера на даты
  getAvailableRooms: (checkInDate: string, checkOutDate: string) => {
    return api.get<Room[]>(`/available-rooms/?check_in_date=${checkInDate}&check_out_date=${checkOutDate}`);
  }
};

export default bookingService; 