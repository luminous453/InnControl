'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // В реальном проекте здесь должна быть интеграция с API
      // Для примера сделаем простую проверку
      if (username === 'admin' && password === 'admin') {
        router.push('/dashboard');
      } else {
        setError('Неверное имя пользователя или пароль');
      }
    } catch (err) {
      setError('Ошибка авторизации. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex bg-cream">
      <div className="w-1/2 bg-secondary hidden md:flex flex-col justify-center items-center p-10">
        <div className="max-w-md text-white">
          <h1 className="text-4xl font-bold mb-6">InnControl</h1>
          <p className="text-xl mb-8">Система администрирования гостиниц</p>
          <p className="mb-4">InnControl предоставляет инструменты для эффективного управления:</p>
          <ul className="space-y-2 list-disc pl-5">
            <li>Бронирование и учет номеров</li>
            <li>Управление клиентами</li>
            <li>Контроль персонала</li>
            <li>Расписание уборок</li>
            <li>Аналитика и отчеты</li>
          </ul>
        </div>
      </div>
      
      <div className="w-full md:w-1/2 flex justify-center items-center p-10">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-primary">Вход в систему</h2>
            <p className="text-gray-600 mt-2">Введите данные для доступа</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}
            
            <div>
              <label htmlFor="username" className="label">Имя пользователя</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="label">Пароль</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Подождите...' : 'Войти'}
              </button>
            </div>
            
            <div className="text-center text-sm text-gray-600">
              <p>Для демо-версии используйте:</p>
              <p>Логин: admin / Пароль: admin</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 