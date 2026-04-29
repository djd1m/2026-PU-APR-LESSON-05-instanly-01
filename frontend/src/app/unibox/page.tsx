'use client';

import { useState } from 'react';

const MOCK_MESSAGES = [
  { id: '1', from: 'Алексей Смирнов', company: 'ТехноСтарт', subject: 'Re: Предложение по автоматизации', snippet: 'Добрый день! Интересно, давайте обсудим...', status: 'interested', time: '14:32', unread: true },
  { id: '2', from: 'Мария Иванова', company: 'ДатаПро', subject: 'Re: CRM для вашей команды', snippet: 'Спасибо за предложение, но сейчас не актуально...', status: 'not_interested', time: '12:05', unread: false },
  { id: '3', from: 'Дмитрий Козлов', company: 'Рога и Копыта', subject: 'Re: Оптимизация продаж', snippet: 'Да, это именно то что нам нужно! Когда можем...', status: 'meeting_booked', time: 'Вчера', unread: true },
];

export default function UniboxPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const selected = MOCK_MESSAGES.find((m) => m.id === selectedId);
  const filtered = statusFilter === 'all' ? MOCK_MESSAGES : MOCK_MESSAGES.filter((m) => m.status === statusFilter);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Status sidebar */}
      <div className="w-48 border-r border-[#2a2d34] p-4 space-y-1">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Статус</h3>
        {[
          { id: 'all', label: 'Все', count: 3 },
          { id: 'interested', label: 'Заинтересованы', count: 1 },
          { id: 'meeting_booked', label: 'Встреча', count: 1 },
          { id: 'not_interested', label: 'Не интересно', count: 1 },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
              statusFilter === s.id ? 'bg-blue-600/20 text-blue-300' : 'text-gray-400 hover:bg-white/5'
            }`}
          >
            {s.label} <span className="text-xs text-gray-600">({s.count})</span>
          </button>
        ))}
      </div>

      {/* Message list */}
      <div className="w-80 border-r border-[#2a2d34] overflow-y-auto">
        <div className="p-3">
          <input
            type="text"
            placeholder="Поиск..."
            className="w-full bg-[#111318] border border-[#2a2d34] rounded-lg h-9 px-3 text-sm text-white focus:border-blue-500 focus:outline-none"
          />
        </div>
        {filtered.map((msg) => (
          <div
            key={msg.id}
            onClick={() => setSelectedId(msg.id)}
            className={`px-4 py-3 border-b border-[#2a2d34] cursor-pointer transition ${
              selectedId === msg.id ? 'bg-blue-600/10' : 'hover:bg-white/3'
            } ${msg.unread ? 'border-l-2 border-l-blue-500' : ''}`}
          >
            <div className="flex justify-between items-start">
              <span className={`text-sm ${msg.unread ? 'font-semibold text-white' : 'text-gray-300'}`}>
                {msg.from}
              </span>
              <span className="text-xs text-gray-500">{msg.time}</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{msg.company}</p>
            <p className="text-xs text-gray-400 mt-1 truncate">{msg.snippet}</p>
          </div>
        ))}
      </div>

      {/* Reading pane */}
      <div className="flex-1 p-6">
        {selected ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{selected.from}</h2>
                <p className="text-sm text-gray-400">{selected.company} — {selected.subject}</p>
              </div>
              <select className="bg-[#111318] border border-[#2a2d34] rounded-lg px-3 py-1.5 text-sm text-gray-300">
                <option>Заинтересован</option>
                <option>Встреча назначена</option>
                <option>Сделка</option>
                <option>Не интересно</option>
              </select>
            </div>
            <div className="bg-[#15171c] border border-[#2a2d34] rounded-xl p-5 text-sm text-gray-300 leading-relaxed">
              {selected.snippet}
            </div>
            <div className="mt-4">
              <textarea
                placeholder="Ответить..."
                className="w-full bg-[#111318] border border-[#2a2d34] rounded-xl p-4 text-sm text-white h-24 resize-none focus:border-blue-500 focus:outline-none"
              />
              <button className="mt-2 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm">
                Отправить
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-4xl mb-3">📬</div>
            <h3 className="text-lg font-medium text-gray-300">Unibox</h3>
            <p className="text-sm text-gray-500">Выберите сообщение для просмотра</p>
          </div>
        )}
      </div>
    </div>
  );
}
