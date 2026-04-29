'use client';

import { useState } from 'react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'integrations' | 'billing'>('profile');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Настройки</h1>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-[#2a2d34] mb-6">
        {[
          { id: 'profile', label: 'Профиль' },
          { id: 'integrations', label: 'Интеграции' },
          { id: 'billing', label: 'Тариф и оплата' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`pb-3 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile */}
      {activeTab === 'profile' && (
        <div className="max-w-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Имя</label>
              <input
                type="text"
                defaultValue="Иван"
                className="w-full bg-[#111318] border border-[#2a2d34] rounded-xl h-11 px-4 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Фамилия</label>
              <input
                type="text"
                defaultValue="Петров"
                className="w-full bg-[#111318] border border-[#2a2d34] rounded-xl h-11 px-4 text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              defaultValue="ivan@company.ru"
              className="w-full bg-[#111318] border border-[#2a2d34] rounded-xl h-11 px-4 text-sm text-white focus:border-blue-500 focus:outline-none"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Компания</label>
            <input
              type="text"
              defaultValue=""
              placeholder="ООО Ваша Компания"
              className="w-full bg-[#111318] border border-[#2a2d34] rounded-xl h-11 px-4 text-sm text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Пароль</label>
            <button className="text-sm text-blue-400 hover:text-blue-300">Изменить пароль</button>
          </div>
          <button className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition">
            Сохранить
          </button>
        </div>
      )}

      {/* Integrations */}
      {activeTab === 'integrations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'AmoCRM', desc: 'Синхронизация лидов и сделок', status: 'not_connected' },
            { name: 'Bitrix24', desc: 'Интеграция с CRM', status: 'not_connected' },
            { name: 'Webhook', desc: 'Уведомления о событиях', status: 'not_connected' },
          ].map((integration) => (
            <div key={integration.name} className="p-5 bg-[#15171c] border border-[#2a2d34] rounded-2xl">
              <h3 className="text-white font-semibold mb-1">{integration.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{integration.desc}</p>
              <button className="px-4 py-2 rounded-lg bg-blue-600/20 text-blue-300 text-sm font-medium hover:bg-blue-600/30">
                Подключить
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Billing */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="p-6 bg-[#15171c] border border-[#2a2d34] rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold">Текущий план: Free</h3>
                <p className="text-sm text-gray-400">500 писем/мес, 3 аккаунта</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-300 text-xs font-medium">FREE</span>
            </div>
            <div className="h-2 bg-[#111318] rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '12%' }} />
            </div>
            <p className="text-xs text-gray-500 mt-2">60 / 500 писем использовано</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Growth', price: '3 900 ₽/мес', features: ['5,000 писем/мес', 'Безлимит аккаунтов', 'AI-генерация', 'Warmup'] },
              { name: 'Pro', price: '7 900 ₽/мес', features: ['50,000 писем/мес', 'Безлимит аккаунтов', 'AI + A/B тесты', 'API доступ'] },
              { name: 'Agency', price: '14 900 ₽/мес', features: ['100,000 писем/мес', 'Мульти-клиент', 'White-label', 'Приоритетная поддержка'] },
            ].map((plan) => (
              <div key={plan.name} className="p-5 bg-[#15171c] border border-[#2a2d34] rounded-2xl">
                <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                <p className="text-blue-400 font-semibold mt-1">{plan.price}</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-gray-300 flex items-center gap-2">
                      <span className="text-emerald-400">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <button className="mt-4 w-full py-2 rounded-lg border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-500/10">
                  Выбрать
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
