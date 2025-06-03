'use client';

import { useState, useEffect } from 'react';
import { FaCalendarAlt, FaSearch, FaFileExport, FaMoneyBillWave } from 'react-icons/fa';
import { bookingService } from '@/services/bookingService';
import { roomService } from '@/services/roomService';

// Тип для отображения финансовой информации
interface FinancialData {
  booking_id: number;
  client_name: string;
  room_number: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  price_per_night: number;
  total_amount: number;
}

export default function ReportsPage() {
  const [financialData, setFinancialData] = useState<FinancialData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [averageBookingValue, setAverageBookingValue] = useState(0);

  // Добавляем стили для скрытия боковой панели при печати/экспорте в PDF
  useEffect(() => {
    // Создаем элемент стиля
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        nav, aside, .sidebar, .navbar, header, footer, button, .print-hide {
          display: none !important;
        }
        body {
          padding: 0 !important;
          margin: 0 !important;
          overflow: visible !important;
          width: 100% !important;
        }
        html {
          overflow: visible !important;
        }
        main {
          margin-left: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          overflow: visible !important;
          display: block !important;
        }
        .print-only {
          display: block !important;
        }
        .container, .content, .report {
          width: 100% !important;
          margin: 0 !important;
          padding: 0.5cm !important;
          overflow: visible !important;
        }
        h1, h2, h3, h4 {
          margin-top: 0.5cm !important;
        }
        h1 {
          font-size: 1.5rem !important;
        }
        h2 {
          font-size: 1.2rem !important;
        }
        @page {
          size: A4 landscape;
          margin: 1cm;
        }
        table {
          page-break-inside: auto;
          width: 100% !important;
          font-size: 0.9rem !important;
          table-layout: fixed !important;
          display: table !important;
          visibility: visible !important;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
          display: table-row !important;
          visibility: visible !important;
        }
        th, td {
          padding: 0.25cm 0.2cm !important;
          word-wrap: break-word !important;
          max-width: 150px !important;
          display: table-cell !important;
          visibility: visible !important;
        }
        thead {
          display: table-header-group !important;
          visibility: visible !important;
        }
        tbody {
          display: table-row-group !important;
          visibility: visible !important;
        }
        tfoot {
          display: table-footer-group !important;
          visibility: visible !important;
        }
        .whitespace-nowrap {
          white-space: normal !important;
        }
        .overflow-hidden {
          overflow: visible !important;
        }
        .print-title {
          text-align: center;
          font-size: 1.2rem;
          margin-bottom: 0.5cm !important;
        }
        .print-table-wrapper {
          overflow: visible !important;
          display: block !important;
          width: 100% !important;
          margin-top: 0.5cm !important;
        }
        .mb-6, .mb-4 {
          margin-bottom: 0.3cm !important;
        }
        .grid {
          display: block !important;
        }
        .print-summary {
          margin: 0.3cm 0;
          display: flex;
          justify-content: space-around;
          border-top: 1px solid #eaeaea;
          border-bottom: 1px solid #eaeaea;
          padding: 0.2cm 0;
        }
        .print-summary p {
          margin: 0;
        }
        * {
          overflow: visible !important;
        }
        div[class*="overflow"] {
          overflow: visible !important;
        }
        .print-financial-table {
          display: table !important;
          width: 100% !important;
          border-collapse: collapse !important;
        }
        .print-financial-table th,
        .print-financial-table td {
          border: 1px solid #ddd !important;
          padding: 0.3cm !important;
          text-align: left !important;
        }
        .print-table-container {
          display: block !important; 
          margin: 0.5cm 0 !important;
          page-break-inside: avoid !important;
          width: 100% !important;
        }
        /* Скрываем информационный блок */
        .info-section {
          display: none !important;
        }
        /* Специально скрываем кнопку "Выйти" */
        a[href="/"] {
          display: none !important;
        }
        /* Перенос общего дохода на следующую страницу */
        .print-page-break {
          page-break-before: always !important;
        }
      }
    `;
    
    // Добавляем стиль в head документа
    document.head.appendChild(style);
    
    // Удаляем стиль при размонтировании компонента
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Функция для загрузки данных с указанными фильтрами
  const loadFinancialData = async () => {
    if (!startDate || !endDate) {
      setError('Пожалуйста, выберите начальную и конечную даты');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Получаем все бронирования
      const bookings = await bookingService.getAllBookings();
      
      // Фильтруем бронирования с некорректными статусами
      const bookingsWithValidStatus = bookings.filter(booking => {
        // Проверяем, что статус содержит только кириллицу или латинские буквы
        const validStatusRegex = /^[а-яА-Яa-zA-Z\s]+$/;
        return booking.status && validStatusRegex.test(booking.status);
      });
      
      // Фильтруем бронирования по датам
      const filteredBookings = bookingsWithValidStatus.filter(booking => {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        
        // Бронирование попадает в период, если дата заезда или выезда находится в выбранном периоде
        // или если период бронирования полностью содержит выбранный период
        return (checkIn >= filterStart && checkIn <= filterEnd) || 
               (checkOut >= filterStart && checkOut <= filterEnd) ||
               (checkIn <= filterStart && checkOut >= filterEnd);
      });

      // Подготавливаем данные о бронированиях с финансовой информацией
      const financialDetails = await Promise.all(
        filteredBookings.map(async (booking) => {
          try {
            // Получаем детали бронирования
            const bookingDetails = await bookingService.getBooking(booking.booking_id);
            
            // Получаем информацию о номере и типе номера
            const roomDetails = await roomService.getRoom(booking.room_id);
            const roomType = await roomService.getRoomType(roomDetails.type_id);
            
            // Рассчитываем количество ночей
            const checkIn = new Date(booking.check_in_date);
            const checkOut = new Date(booking.check_out_date);
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
            
            // Рассчитываем общую стоимость
            const totalAmount = nights * roomType.price_per_night;
            
            return {
              booking_id: booking.booking_id,
              client_name: `${bookingDetails.client.first_name} ${bookingDetails.client.last_name}`,
              room_number: roomDetails.room_number,
              check_in_date: booking.check_in_date,
              check_out_date: booking.check_out_date,
              nights,
              price_per_night: roomType.price_per_night,
              total_amount: totalAmount
            };
          } catch (err) {
            console.error(`Ошибка при получении данных для бронирования ${booking.booking_id}:`, err);
            return null;
          }
        })
      );

      // Фильтруем отсутствующие данные и сортируем по номеру комнаты
      const validData = financialDetails
        .filter((data): data is FinancialData => data !== null)
        .sort((a, b) => {
          // Извлекаем числовую часть из номера комнаты, если она есть
          const roomNumA = parseInt(a.room_number.replace(/\D/g, ''));
          const roomNumB = parseInt(b.room_number.replace(/\D/g, ''));
          
          // Если оба номера корректно преобразованы в числа, сравниваем их
          if (!isNaN(roomNumA) && !isNaN(roomNumB)) {
            return roomNumA - roomNumB;
          }
          
          // Иначе используем строковое сравнение
          return a.room_number.localeCompare(b.room_number);
        });
      
      setFinancialData(validData);
      
      // Рассчитываем общую сумму дохода
      const total = validData.reduce((sum, item) => sum + item.total_amount, 0);
      setTotalIncome(total);
      
      // Общее количество бронирований
      setTotalBookings(validData.length);
      
      // Средняя стоимость бронирования
      setAverageBookingValue(validData.length > 0 ? total / validData.length : 0);
      
    } catch (err) {
      console.error('Ошибка при загрузке финансовых данных:', err);
      setError('Не удалось загрузить финансовые данные');
    } finally {
      setLoading(false);
    }
  };

  // Эффект для автоматической загрузки данных при изменении дат
  useEffect(() => {
    if (startDate && endDate) {
      // Проверяем, что даты корректные и конечная дата не раньше начальной
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start) {
        loadFinancialData();
      }
    }
  }, [startDate, endDate]);

  // Форматирование числа в денежный формат
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { 
      style: 'currency', 
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Форматирование даты
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Функция для экспорта в PDF
  const handlePrintReport = () => {
    // Используем встроенный API браузера для печати
    window.print();
  };
  
  const getCurrentDateString = () => {
    const now = new Date();
    return now.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Финансовые отчеты</h2>
        <button 
          className="btn-primary flex items-center space-x-2"
          onClick={() => window.print()}
        >
          <FaFileExport />
          <span>Экспорт отчета</span>
        </button>
      </div>
      
      {/* Заголовок для печатной версии */}
      <div className="hidden print-only print-title">
        <h1 className="text-center font-bold">InnControl Система управления гостиницей</h1>
        <h2 className="text-center">Финансовый отчет</h2>
        {startDate && endDate && (
          <p className="text-center">
            Период: {formatDate(startDate)} - {formatDate(endDate)}
          </p>
        )}
        
        {financialData.length > 0 && (
          <div className="print-summary">
            <p><strong>Общий доход:</strong> {formatCurrency(totalIncome)}</p>
            <p><strong>Количество бронирований:</strong> {totalBookings}</p>
            <p><strong>Средняя стоимость бронирования:</strong> {formatCurrency(averageBookingValue)}</p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Параметры отчета</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Начальная дата</label>
            <div className="relative">
              <input
                type="date"
                className="input pl-10 w-full"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Конечная дата</label>
            <div className="relative">
              <input
                type="date"
                className="input pl-10 w-full"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
      
      {financialData.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Общий доход</h3>
              <div className="flex items-center mt-2">
                <FaMoneyBillWave className="text-green-500 mr-2" />
                <span className="text-2xl font-bold">{formatCurrency(totalIncome)}</span>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Количество бронирований</h3>
              <div className="flex items-center mt-2">
                <FaCalendarAlt className="text-blue-500 mr-2" />
                <span className="text-2xl font-bold">{totalBookings}</span>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Средняя стоимость бронирования</h3>
              <div className="flex items-center mt-2">
                <FaMoneyBillWave className="text-yellow-500 mr-2" />
                <span className="text-2xl font-bold">{formatCurrency(averageBookingValue)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden print-table-wrapper">
            <table className="min-w-full divide-y divide-gray-200 print-financial-table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Номер</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата заезда</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата выезда</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ночей</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена за ночь</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {financialData.map((booking) => (
                  <tr key={booking.booking_id}>
                    <td className="px-6 py-4 whitespace-nowrap">{booking.booking_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{booking.client_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{booking.room_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(booking.check_in_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(booking.check_out_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{booking.nights}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(booking.price_per_night)}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">
                      {formatCurrency(booking.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-right font-bold">
                    Итого:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">
                    {formatCurrency(totalIncome)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
      
      {!loading && financialData.length === 0 && startDate && endDate && (
        <div className="bg-white rounded-lg shadow p-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Номер</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата заезда</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата выезда</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ночей</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена за ночь</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                  Для выбранного периода бронирований не найдено
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      
      {loading && (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}
      
      <div className="mt-8 info-section">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Информация</h3>
        <div className="bg-white p-4 rounded-lg shadow">
          <p>В этом разделе вы можете формировать финансовые отчеты по бронированиям за выбранный период.</p>
          <p className="mt-2">Для создания отчета выберите начальную и конечную даты. Отчет сформируется автоматически.</p>
          <p className="mt-2">Для экспорта отчета в PDF нажмите кнопку "Экспорт отчета".</p>
        </div>
      </div>
      
      {/* Таблица специально для печати */}
      {financialData.length > 0 && (
        <div className="print-table-container hidden print-only print-page-break">
          <table className="print-financial-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Клиент</th>
                <th>Номер</th>
                <th>Дата заезда</th>
                <th>Дата выезда</th>
                <th>Ночей</th>
                <th>Цена за ночь</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {financialData.map((booking) => (
                <tr key={`print-${booking.booking_id}`}>
                  <td>{booking.booking_id}</td>
                  <td>{booking.client_name}</td>
                  <td>{booking.room_number}</td>
                  <td>{formatDate(booking.check_in_date)}</td>
                  <td>{formatDate(booking.check_out_date)}</td>
                  <td>{booking.nights}</td>
                  <td>{formatCurrency(booking.price_per_night)}</td>
                  <td>{formatCurrency(booking.total_amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7} style={{textAlign: 'right'}}><strong>Итого:</strong></td>
                <td><strong>{formatCurrency(totalIncome)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
} 