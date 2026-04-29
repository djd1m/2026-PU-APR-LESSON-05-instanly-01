'use client';

import { useState } from 'react';

export default function AiGeneratorPage() {
  const [productDescription, setProductDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState<'formal' | 'casual' | 'friendly'>('formal');
  const [result, setResult] = useState<{ subject: string; body: string; ai_score: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/ai/generate-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ product_description: productDescription, target_audience: targetAudience, tone, language: 'ru' }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data.data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">AI-генератор писем</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Описание продукта</label>
            <textarea
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="CRM-система для малого бизнеса с интеграцией 1С..."
              className="w-full bg-[#111318] border border-[#2a2d34] rounded-xl p-4 text-sm text-white h-32 resize-none focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Целевая аудитория</label>
            <textarea
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Директора малого бизнеса, 30-50 лет, Москва..."
              className="w-full bg-[#111318] border border-[#2a2d34] rounded-xl p-4 text-sm text-white h-20 resize-none focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Тон</label>
            <div className="flex gap-2">
              {(['formal', 'casual', 'friendly'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    tone === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#111318] border border-[#2a2d34] text-gray-400 hover:text-white'
                  }`}
                >
                  {t === 'formal' ? 'Деловой' : t === 'casual' ? 'Свободный' : 'Дружелюбный'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !productDescription}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Генерирую...' : '✨ Сгенерировать письмо'}
          </button>
        </div>

        {/* Output */}
        <div className="bg-[#15171c] border border-[#2a2d34] rounded-2xl p-6">
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-400">Результат</h3>
                <span className="px-2 py-1 rounded-md text-xs bg-emerald-500/20 text-emerald-300">
                  AI Score: {result.ai_score}/10
                </span>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Тема</label>
                <div className="p-3 bg-[#111318] border border-[#2a2d34] rounded-lg text-white text-sm">
                  {result.subject}
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Текст письма</label>
                <div className="p-4 bg-[#111318] border border-[#2a2d34] rounded-lg text-white text-sm whitespace-pre-wrap leading-relaxed">
                  {result.body}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-lg bg-blue-600/20 text-blue-300 text-sm font-medium hover:bg-blue-600/30">
                  Использовать в кампании
                </button>
                <button className="flex-1 py-2 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10">
                  Перегенерировать
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="text-4xl mb-3">✨</div>
              <h3 className="text-lg font-medium text-gray-300">AI-генератор</h3>
              <p className="text-sm text-gray-500 mt-1">Опишите продукт и аудиторию, AI напишет персональное письмо</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
