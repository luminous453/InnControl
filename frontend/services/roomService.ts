import api from './api';
import { Room } from './cleaningService';

// Интерфейсы для типов данных
export interface RoomType {
  type_id: number;
  name: string;
  capacity: number;
  price_per_night: number;
}

export interface RoomWithDetails extends Room {
  room_type: RoomType;
}

export interface RoomCreate {
  hotel_id: number;
  type_id: number;
  floor: number;
  room_number: string;
  status?: string;
}

export interface RoomStatusUpdate {
  status: string;
}

// Сервис для работы с API номеров
export const roomService = {
  // Получить все номера
  getAllRooms: () => {
    return api.get<Room[]>('/rooms/');
  },
  
  // Получить номер по ID
  getRoom: (id: number) => {
    return api.get<RoomWithDetails>(`/rooms/${id}`);
  },
  
  // Создать новый номер
  createRoom: (room: RoomCreate) => {
    return api.post<Room>('/rooms/', room);
  },
  
  // Обновить существующий номер
  updateRoom: (id: number, room: RoomCreate) => {
    return api.put<Room>(`/rooms/${id}`, room);
  },
  
  // Обновить статус номера
  updateRoomStatus: (id: number, status: RoomStatusUpdate) => {
    return api.put<Room>(`/rooms/${id}/status`, status);
  },
  
  // Удалить номер
  deleteRoom: (id: number) => {
    return api.delete<Room>(`/rooms/${id}`);
  },
  
  // Получить номера отеля
  getRoomsByHotel: (hotelId: number) => {
    return api.get<Room[]>(`/hotels/${hotelId}/rooms/`);
  },
  
  // Функция для запуска автоматического обновления статусов всех номеров
  updateAllRoomStatuses: () => {
    return api.post<{updated_rooms_count: number}>('/update-room-statuses/', {});
  },
  
  // Получить типы номеров
  getAllRoomTypes: () => {
    return api.get<RoomType[]>('/room-types/');
  },
  
  // Получить тип номера по ID
  getRoomType: (id: number) => {
    return api.get<RoomType>(`/room-types/${id}`);
  },
  
  // Создать новый тип номера
  createRoomType: (roomType: Omit<RoomType, 'type_id'>) => {
    return api.post<RoomType>('/room-types/', roomType);
  }
};

export default roomService; 