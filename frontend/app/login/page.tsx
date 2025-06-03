'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaUser, FaLock } from 'react-icons/fa';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Пожалуйста, введите имя пользователя и пароль');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Отправляем запрос на сервер для получения токена
      const response = await fetch('http://localhost:8000/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          username,
          password
        }).toString()
      });
      
      if (!response.ok) {
        throw new Error('Ошибка авторизации');
      }
      
      const data = await response.json();
      
      // Сохраняем токен в localStorage
      localStorage.setItem('accessToken', data.access_token);
      
      // Редирект на панель администратора
      router.push('/dashboard');
    } catch (err) {
      console.error('Ошибка входа:', err);
      setError('Ошибка при попытке входа в систему');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">InnControl</h1>
          <p className="text-gray-600">Авторизация в системе управления гостиницей</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Имя пользователя
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <FaUser />
              </div>
              <input
                id="username"
                type="text"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Введите имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Пароль
            </label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-gray-400">
                <FaLock />
              </div>
              <input
                id="password"
                type="password"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className={`w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Гостиница "Маяк" &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
} 