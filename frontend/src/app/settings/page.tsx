'use client';

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://212.192.0.33:4000';

type TabId = 'profile' | 'system' | 'integrations' | 'billing';

interface UserSettings {
  openai_api_key: string | null;
  openai_model: string;
  ai_max_tokens: number;
  ai_temperature: number;
  timezone: string;
  sending_start_hour: number;
  sending_end_hour: number;
  daily_limit_per_account: number;
  default_smtp_host: string | null;
  default_smtp_port: number;
  email_provider: string;
  resend_api_key: string | null;
  resend_from_email: string | null;
  tracking_domain: string | null;
  auto_unsubscribe_link: boolean;
  sender_company_name: string | null;
  sender_contact_info: string | null;
}

const TIMEZONES = [
  'Europe/Moscow',
  'Europe/Kaliningrad',
  'Europe/Samara',
  'Asia/Yekaterinburg',
  'Asia/Omsk',
  'Asia/Krasnoyarsk',
  'Asia/Irkutsk',
  'Asia/Yakutsk',
  'Asia/Vladivostok',
  'Asia/Magadan',
  'Asia/Kamchatka',
  'UTC',
];

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="p-6 bg-[#15171c] border border-[#2a2d34] rounded-2xl space-y-4">
      <div>
        <h3 className="text-white font-semibold text-base">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ label, description }: { label: string; description?: string }) {
  return (
    <div className="mb-1">
      <label className="block text-sm text-gray-400">{label}</label>
      {description && <span className="text-xs text-gray-600">{description}</span>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full bg-[#111318] border border-[#2a2d34] rounded-xl h-11 px-4 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#111318] border border-[#2a2d34] rounded-xl h-11 px-4 text-sm text-white focus:border-blue-500 focus:outline-none appearance-none"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-[#2a2d34]'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`}
      />
    </button>
  );
}

function SaveButton({ onClick, loading, label = 'Сохранить' }: { onClick: () => void; loading: boolean; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition disabled:opacity-50"
    >
      {loading ? 'Сохраняю...' : label}
    </button>
  );
}

function TestButton({ onClick, loading, label }: { onClick: () => void; loading: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-4 py-2 rounded-lg border border-[#2a2d34] text-gray-300 text-sm font-medium hover:bg-[#1a1d24] transition disabled:opacity-50"
    >
      {loading ? 'Проверяю...' : label}
    </button>
  );
}

function StatusMessage({ message, type }: { message: string; type: 'success' | 'error' }) {
  return (
    <div
      className={`px-4 py-2 rounded-lg text-sm ${
        type === 'success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-red-900/30 text-red-400 border border-red-800'
      }`}
    >
      {message}
    </div>
  );
}

function RadioOption({
  value,
  selected,
  onChange,
  label,
  description,
}: {
  value: string;
  selected: boolean;
  onChange: (v: string) => void;
  label: string;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`flex items-start gap-3 p-4 rounded-xl border transition cursor-pointer ${
        selected
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-[#2a2d34] bg-[#111318] hover:border-[#3a3d44]'
      }`}
    >
      <div
        className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? 'border-blue-500' : 'border-[#4a4d54]'
        }`}
      >
        {selected && <div className="w-2 h-2 rounded-full bg-blue-500" />}
      </div>
      <div className="text-left">
        <div className="text-sm text-white font-medium">{label}</div>
        {description && <div className="text-xs text-gray-500 mt-0.5">{description}</div>}
      </div>
    </button>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);

  // Section save states
  const [savingAi, setSavingAi] = useState(false);
  const [savingSending, setSavingSending] = useState(false);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [savingTracking, setSavingTracking] = useState(false);
  const [savingCompliance, setSavingCompliance] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);

  // Test states
  const [testingOpenai, setTestingOpenai] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testingResend, setTestingResend] = useState(false);

  // Status messages
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Local form state for system tab
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [aiMaxTokens, setAiMaxTokens] = useState(500);
  const [aiTemperature, setAiTemperature] = useState(0.7);
  const [timezone, setTimezone] = useState('Europe/Moscow');
  const [sendingStart, setSendingStart] = useState(9);
  const [sendingEnd, setSendingEnd] = useState(18);
  const [dailyLimit, setDailyLimit] = useState(50);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState(587);
  const [trackingDomain, setTrackingDomain] = useState('');
  const [autoUnsubscribe, setAutoUnsubscribe] = useState(true);
  const [companyName, setCompanyName] = useState('');
  const [contactInfo, setContactInfo] = useState('');

  // Email provider state
  const [emailProvider, setEmailProvider] = useState('smtp');
  const [resendApiKey, setResendApiKey] = useState('');
  const [resendFromEmail, setResendFromEmail] = useState('');

  // SMTP test fields
  const [testSmtpHost, setTestSmtpHost] = useState('');
  const [testSmtpPort, setTestSmtpPort] = useState(587);
  const [testSmtpUser, setTestSmtpUser] = useState('');
  const [testSmtpPass, setTestSmtpPass] = useState('');

  const showStatus = useCallback((text: string, type: 'success' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/settings`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data: UserSettings = await res.json();
      setSettings(data);
      setOpenaiKey(data.openai_api_key || '');
      setOpenaiModel(data.openai_model);
      setAiMaxTokens(data.ai_max_tokens);
      setAiTemperature(data.ai_temperature);
      setTimezone(data.timezone);
      setSendingStart(data.sending_start_hour);
      setSendingEnd(data.sending_end_hour);
      setDailyLimit(data.daily_limit_per_account);
      setSmtpHost(data.default_smtp_host || '');
      setSmtpPort(data.default_smtp_port);
      setTrackingDomain(data.tracking_domain || '');
      setAutoUnsubscribe(data.auto_unsubscribe_link);
      setCompanyName(data.sender_company_name || '');
      setContactInfo(data.sender_contact_info || '');
      setEmailProvider(data.email_provider || 'smtp');
      setResendApiKey(data.resend_api_key || '');
      setResendFromEmail(data.resend_from_email || '');
    } catch {
      // Settings not loaded — user might not be logged in
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'system') {
      fetchSettings();
    }
  }, [activeTab, fetchSettings]);

  const saveSection = async (fields: Partial<UserSettings>, setLoading: (v: boolean) => void) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(fields),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as any).message || 'Ошибка сохранения');
      }
      const data: UserSettings = await res.json();
      setSettings(data);
      showStatus('Настройки сохранены', 'success');
    } catch (err) {
      showStatus((err as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestOpenai = async () => {
    if (!openaiKey || openaiKey.includes('***')) {
      showStatus('Введите OpenAI API ключ для проверки', 'error');
      return;
    }
    setTestingOpenai(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/settings/test-openai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ api_key: openaiKey }),
      });
      const data = await res.json();
      showStatus(data.message, data.success ? 'success' : 'error');
    } catch {
      showStatus('Ошибка проверки API ключа', 'error');
    } finally {
      setTestingOpenai(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!testSmtpHost || !testSmtpUser) {
      showStatus('Заполните все поля SMTP для проверки', 'error');
      return;
    }
    setTestingSmtp(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/settings/test-smtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          host: testSmtpHost,
          port: testSmtpPort,
          username: testSmtpUser,
          password: testSmtpPass,
        }),
      });
      const data = await res.json();
      showStatus(data.message, data.success ? 'success' : 'error');
    } catch {
      showStatus('Ошибка проверки SMTP', 'error');
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleTestResend = async () => {
    if (!resendApiKey || resendApiKey.includes('***')) {
      showStatus('Введите Resend API ключ для проверки', 'error');
      return;
    }
    setTestingResend(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/settings/test-resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ api_key: resendApiKey }),
      });
      const data = await res.json();
      showStatus(data.message, data.success ? 'success' : 'error');
    } catch {
      showStatus('Ошибка проверки Resend API ключа', 'error');
    } finally {
      setTestingResend(false);
    }
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'profile', label: 'Профиль' },
    { id: 'system', label: 'Системные переменные' },
    { id: 'integrations', label: 'Интеграции' },
    { id: 'billing', label: 'Тариф и оплата' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Настройки</h1>

      {/* Status message */}
      {statusMessage && (
        <div className="mb-4">
          <StatusMessage message={statusMessage.text} type={statusMessage.type} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-8 border-b border-[#2a2d34] mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      {/* Profile Tab */}
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

      {/* System Variables Tab */}
      {activeTab === 'system' && (
        <div className="max-w-2xl space-y-6">
          {loadingSettings ? (
            <div className="text-gray-400 text-sm">Загрузка настроек...</div>
          ) : (
            <>
              {/* OpenAI Section */}
              <SectionCard title="OpenAI" description="Настройки AI-генерации писем и персонализации">
                <div>
                  <FieldLabel label="API Key" description="Ваш персональный ключ OpenAI" />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <TextInput
                        value={openaiKey}
                        onChange={setOpenaiKey}
                        placeholder="sk-..."
                        type="password"
                      />
                    </div>
                    <TestButton onClick={handleTestOpenai} loading={testingOpenai} label="Проверить" />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <FieldLabel label="Модель" />
                    <SelectInput
                      value={openaiModel}
                      onChange={setOpenaiModel}
                      options={[
                        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
                        { value: 'gpt-4o', label: 'GPT-4o' },
                        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                      ]}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Max tokens" />
                    <TextInput
                      value={String(aiMaxTokens)}
                      onChange={(v) => setAiMaxTokens(Number(v) || 500)}
                      type="number"
                    />
                  </div>
                  <div>
                    <FieldLabel label="Temperature" />
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={aiTemperature}
                        onChange={(e) => setAiTemperature(Number(e.target.value))}
                        className="flex-1 accent-blue-500"
                      />
                      <span className="text-sm text-gray-400 w-8">{aiTemperature}</span>
                    </div>
                  </div>
                </div>
                <SaveButton
                  onClick={() =>
                    saveSection(
                      {
                        openai_api_key: openaiKey,
                        openai_model: openaiModel,
                        ai_max_tokens: aiMaxTokens,
                        ai_temperature: aiTemperature,
                      } as Partial<UserSettings>,
                      setSavingAi,
                    )
                  }
                  loading={savingAi}
                />
              </SectionCard>

              {/* Sending Settings */}
              <SectionCard title="Настройки отправки" description="Параметры по умолчанию для рассылок">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel label="Часовой пояс" />
                    <SelectInput
                      value={timezone}
                      onChange={setTimezone}
                      options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Лимит писем в день (на аккаунт)" />
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="500"
                        value={dailyLimit}
                        onChange={(e) => setDailyLimit(Number(e.target.value))}
                        className="flex-1 accent-blue-500"
                      />
                      <span className="text-sm text-gray-400 w-10 text-right">{dailyLimit}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel label="Начало отправки (час)" />
                    <SelectInput
                      value={String(sendingStart)}
                      onChange={(v) => setSendingStart(Number(v))}
                      options={Array.from({ length: 24 }, (_, i) => ({
                        value: String(i),
                        label: `${String(i).padStart(2, '0')}:00`,
                      }))}
                    />
                  </div>
                  <div>
                    <FieldLabel label="Конец отправки (час)" />
                    <SelectInput
                      value={String(sendingEnd)}
                      onChange={(v) => setSendingEnd(Number(v))}
                      options={Array.from({ length: 24 }, (_, i) => ({
                        value: String(i),
                        label: `${String(i).padStart(2, '0')}:00`,
                      }))}
                    />
                  </div>
                </div>
                <SaveButton
                  onClick={() =>
                    saveSection(
                      {
                        timezone,
                        sending_start_hour: sendingStart,
                        sending_end_hour: sendingEnd,
                        daily_limit_per_account: dailyLimit,
                      } as Partial<UserSettings>,
                      setSavingSending,
                    )
                  }
                  loading={savingSending}
                />
              </SectionCard>

              {/* Email Provider */}
              <SectionCard title="Email провайдер" description="Выберите способ отправки писем">
                <div className="grid grid-cols-2 gap-3">
                  <RadioOption
                    value="smtp"
                    selected={emailProvider === 'smtp'}
                    onChange={setEmailProvider}
                    label="SMTP"
                    description="Стандартная отправка через SMTP сервер"
                  />
                  <RadioOption
                    value="resend"
                    selected={emailProvider === 'resend'}
                    onChange={setEmailProvider}
                    label="Resend"
                    description="Отправка через Resend API (resend.com)"
                  />
                </div>

                {emailProvider === 'resend' && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <FieldLabel label="Resend API Key" description="Ваш API ключ из resend.com/api-keys" />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <TextInput
                            value={resendApiKey}
                            onChange={setResendApiKey}
                            placeholder="re_..."
                            type="password"
                          />
                        </div>
                        <TestButton onClick={handleTestResend} loading={testingResend} label="Проверить" />
                      </div>
                    </div>
                    <div>
                      <FieldLabel label="From Email" description="Верифицированный email отправителя в Resend" />
                      <TextInput
                        value={resendFromEmail}
                        onChange={setResendFromEmail}
                        placeholder="noreply@yourdomain.com"
                      />
                    </div>
                  </div>
                )}

                <SaveButton
                  onClick={() =>
                    saveSection(
                      {
                        email_provider: emailProvider,
                        resend_api_key: resendApiKey || null,
                        resend_from_email: resendFromEmail || null,
                      } as Partial<UserSettings>,
                      setSavingProvider,
                    )
                  }
                  loading={savingProvider}
                />
              </SectionCard>

              {/* SMTP Defaults — shown when SMTP provider selected */}
              {emailProvider === 'smtp' && (
                <SectionCard title="SMTP по умолчанию" description="Настройки SMTP для новых аккаунтов">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel label="SMTP хост" />
                      <TextInput value={smtpHost} onChange={setSmtpHost} placeholder="smtp.yandex.ru" />
                    </div>
                    <div>
                      <FieldLabel label="Порт" />
                      <TextInput
                        value={String(smtpPort)}
                        onChange={(v) => setSmtpPort(Number(v) || 587)}
                        type="number"
                      />
                    </div>
                  </div>
                  <SaveButton
                    onClick={() =>
                      saveSection(
                        {
                          default_smtp_host: smtpHost || null,
                          default_smtp_port: smtpPort,
                        } as Partial<UserSettings>,
                        setSavingSmtp,
                      )
                    }
                    loading={savingSmtp}
                  />
                  {/* SMTP Test */}
                  <div className="border-t border-[#2a2d34] pt-4 mt-2">
                    <h4 className="text-sm text-gray-400 mb-3">Проверить SMTP подключение</h4>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <TextInput value={testSmtpHost} onChange={setTestSmtpHost} placeholder="smtp.yandex.ru" />
                      <TextInput
                        value={String(testSmtpPort)}
                        onChange={(v) => setTestSmtpPort(Number(v) || 587)}
                        type="number"
                        placeholder="587"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <TextInput value={testSmtpUser} onChange={setTestSmtpUser} placeholder="user@domain.ru" />
                      <TextInput value={testSmtpPass} onChange={setTestSmtpPass} placeholder="Пароль" type="password" />
                    </div>
                    <TestButton onClick={handleTestSmtp} loading={testingSmtp} label="Проверить подключение" />
                  </div>
                </SectionCard>
              )}

              {/* Tracking */}
              <SectionCard title="Трекинг" description="Домен для отслеживания открытий и кликов">
                <div>
                  <FieldLabel label="Трекинг домен" description="Укажите домен, настроенный для трекинга" />
                  <TextInput value={trackingDomain} onChange={setTrackingDomain} placeholder="track.coldmail.ru" />
                </div>
                <SaveButton
                  onClick={() =>
                    saveSection({ tracking_domain: trackingDomain || null } as Partial<UserSettings>, setSavingTracking)
                  }
                  loading={savingTracking}
                />
              </SectionCard>

              {/* Compliance (38-FZ) */}
              <SectionCard title="Соответствие 38-ФЗ" description="Настройки для соответствия законодательству РФ о рекламе">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-white">Автоматическая ссылка отписки</span>
                    <p className="text-xs text-gray-500">Добавлять ссылку для отписки в каждое письмо</p>
                  </div>
                  <Toggle checked={autoUnsubscribe} onChange={setAutoUnsubscribe} />
                </div>
                <div>
                  <FieldLabel label="Наименование компании-отправителя" description="Обязательно по 38-ФЗ для идентификации рекламодателя" />
                  <TextInput value={companyName} onChange={setCompanyName} placeholder='ООО "Ваша Компания"' />
                </div>
                <div>
                  <FieldLabel label="Контактная информация" description="Адрес, телефон или email для связи с отправителем" />
                  <TextInput value={contactInfo} onChange={setContactInfo} placeholder="г. Москва, ул. Примерная, д. 1, info@company.ru" />
                </div>
                <SaveButton
                  onClick={() =>
                    saveSection(
                      {
                        auto_unsubscribe_link: autoUnsubscribe,
                        sender_company_name: companyName || null,
                        sender_contact_info: contactInfo || null,
                      } as Partial<UserSettings>,
                      setSavingCompliance,
                    )
                  }
                  loading={savingCompliance}
                />
              </SectionCard>
            </>
          )}
        </div>
      )}

      {/* Integrations Tab */}
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

      {/* Billing Tab */}
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
              { name: 'Growth', price: '3 900 руб/мес', features: ['5,000 писем/мес', 'Безлимит аккаунтов', 'AI-генерация', 'Warmup'] },
              { name: 'Pro', price: '7 900 руб/мес', features: ['50,000 писем/мес', 'Безлимит аккаунтов', 'AI + A/B тесты', 'API доступ'] },
              { name: 'Agency', price: '14 900 руб/мес', features: ['100,000 писем/мес', 'Мульти-клиент', 'White-label', 'Приоритетная поддержка'] },
            ].map((plan) => (
              <div key={plan.name} className="p-5 bg-[#15171c] border border-[#2a2d34] rounded-2xl">
                <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                <p className="text-blue-400 font-semibold mt-1">{plan.price}</p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="text-sm text-gray-300 flex items-center gap-2">
                      <span className="text-emerald-400">&#10003;</span> {f}
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
