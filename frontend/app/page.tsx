'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UploadZone from '@/components/UploadZone';
import CategorySelector from '@/components/CategorySelector';
import { farmlandApi, DEMO_DATA } from '@/lib/api';
import type { Farmland, AnalysisEntry } from '@/types/farmland';

const ALL_CATEGORIES = ['地形', 'インフラ', '土壌表面', '土地利用履歴', '周辺環境', '適性作物推定'];

export default function AnalyzePage() {
  const router = useRouter();
  const [images, setImages] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [dbCount, setDbCount] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(ALL_CATEGORIES);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [existingFields, setExistingFields] = useState<Farmland[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');

  useEffect(() => {
    const stored = localStorage.getItem('farmlands');
    if (stored) {
      try {
        const parsed: Farmland[] = JSON.parse(stored);
        setDbCount(parsed.length);
        setExistingFields(parsed);
      } catch { /* ignore */ }
    }
  }, []);

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    if (mode === 'existing' && !selectedFieldId) return;
    setLoading(true);
    setError(null);
    setRejectionError(null);

    try {
      let result: Farmland;

      if (mode === 'existing' && selectedFieldId) {
        // Add analysis to existing field
        try {
          result = await farmlandApi.addAnalysis(selectedFieldId, images, selectedCategories);
        } catch (err: unknown) {
          // Check for 422 (non-farmland photo)
          if (err && typeof err === 'object' && 'response' in err) {
            const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
            if (axiosErr.response?.status === 422) {
              setRejectionError(axiosErr.response.data?.detail || '圃場の写真ではないと判定されました。');
              setLoading(false);
              return;
            }
          }

          // Demo mode: add to existing field locally
          const stored = localStorage.getItem('farmlands');
          const existing: Farmland[] = stored ? JSON.parse(stored) : [];
          const targetIndex = existing.findIndex(f => f.id === selectedFieldId);
          if (targetIndex === -1) throw new Error('圃場が見つかりません');

          const target = existing[targetIndex];
          const demo = DEMO_DATA[Math.floor(Math.random() * DEMO_DATA.length)];

          // Filter demo data by selected categories
          const filteredData = filterByCategories(demo.data, selectedCategories);

          const newEntry: AnalysisEntry = {
            id: Date.now().toString(),
            analyzedAt: new Date().toISOString().slice(0, 10),
            imageUrls: images.map(f => URL.createObjectURL(f)),
            data: filteredData,
          };

          // Move current data to analyses history
          const prevEntry: AnalysisEntry = {
            id: (Date.now() - 1).toString(),
            analyzedAt: target.analyzedAt,
            imageUrls: target.imageUrls,
            data: target.data,
          };

          const analyses = target.analyses ?? [];

          target.data = filteredData;
          target.analyzedAt = newEntry.analyzedAt;
          target.imageUrls = newEntry.imageUrls;
          target.analyses = [prevEntry, ...analyses];

          existing[targetIndex] = target;
          localStorage.setItem('farmlands', JSON.stringify(existing));
          router.push('/database');
          return;
        }

        // API success - update localStorage
        const stored = localStorage.getItem('farmlands');
        const existing: Farmland[] = stored ? JSON.parse(stored) : [];
        const targetIndex = existing.findIndex(f => f.id === selectedFieldId);
        if (targetIndex !== -1) {
          existing[targetIndex] = result;
        }
        localStorage.setItem('farmlands', JSON.stringify(existing));
        router.push('/database');
        return;
      }

      // New field analysis
      try {
        result = await farmlandApi.analyze(images, name || undefined, undefined, selectedCategories);
      } catch (err: unknown) {
        // Check for 422 (non-farmland photo)
        if (err && typeof err === 'object' && 'response' in err) {
          const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
          if (axiosErr.response?.status === 422) {
            setRejectionError(axiosErr.response.data?.detail || '圃場の写真ではないと判定されました。');
            setLoading(false);
            return;
          }
        }

        // API unavailable: demo mode
        const demo = DEMO_DATA[Math.floor(Math.random() * DEMO_DATA.length)];
        const filteredData = filterByCategories(demo.data, selectedCategories);
        result = {
          ...demo,
          id: Date.now().toString(),
          name: name || `農地 ${new Date().toLocaleDateString('ja-JP')}`,
          analyzedAt: new Date().toISOString().slice(0, 10),
          imageUrls: images.map(f => URL.createObjectURL(f)),
          data: filteredData,
        };
      }

      // Save to localStorage
      const stored = localStorage.getItem('farmlands');
      const existing: Farmland[] = stored ? JSON.parse(stored) : [];
      existing.unshift(result);
      localStorage.setItem('farmlands', JSON.stringify(existing));

      router.push('/database');
    } catch {
      setError('解析に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Header */}
      <header style={{ background: '#ea580c', padding: '12px 20px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/jonetsu-logo.jpg" alt="情熱カンパニー" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          <div>
            <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 20 }}>
              情熱AI
            </div>
            <div style={{ color: '#ffffff', fontSize: 12, opacity: 0.8, marginTop: 2 }}>
              写真から農地情報を自動抽出・データベース化
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        maxWidth: 560,
        margin: '0 auto',
      }}>
        <div style={{
          flex: 1,
          textAlign: 'center',
          padding: '12px 0',
          fontSize: 14,
          fontWeight: 'bold',
          color: '#ea580c',
          borderBottom: '2px solid #ea580c',
          cursor: 'pointer',
        }}>
          📷 解析
        </div>
        <Link href="/database" style={{
          flex: 1,
          textAlign: 'center',
          padding: '12px 0',
          fontSize: 14,
          color: '#6b7280',
          textDecoration: 'none',
          cursor: 'pointer',
        }}>
          🗂 データベース ({dbCount}件)
        </Link>
      </nav>

      {/* Main */}
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px 32px' }}>
        <UploadZone images={images} onImagesChange={setImages} />

        {/* New / Existing toggle */}
        <div style={{
          display: 'flex',
          gap: 0,
          marginTop: 12,
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid #d1d5db',
        }}>
          <button
            onClick={() => { setMode('new'); setSelectedFieldId(''); }}
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: 13,
              fontWeight: mode === 'new' ? 'bold' : 'normal',
              border: 'none',
              cursor: 'pointer',
              background: mode === 'new' ? '#ea580c' : '#ffffff',
              color: mode === 'new' ? '#ffffff' : '#6b7280',
              transition: 'all 0.2s',
            }}
          >
            新規圃場
          </button>
          <button
            onClick={() => setMode('existing')}
            disabled={existingFields.length === 0}
            style={{
              flex: 1,
              padding: '8px 0',
              fontSize: 13,
              fontWeight: mode === 'existing' ? 'bold' : 'normal',
              border: 'none',
              borderLeft: '1px solid #d1d5db',
              cursor: existingFields.length === 0 ? 'default' : 'pointer',
              background: mode === 'existing' ? '#ea580c' : '#ffffff',
              color: mode === 'existing' ? '#ffffff' : existingFields.length === 0 ? '#d1d5db' : '#6b7280',
              transition: 'all 0.2s',
            }}
          >
            既存圃場に追加
          </button>
        </div>

        {mode === 'new' ? (
          <input
            type="text"
            placeholder="農地名（任意）"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
              marginTop: 12,
              outline: 'none',
            }}
          />
        ) : (
          <select
            value={selectedFieldId}
            onChange={(e) => setSelectedFieldId(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: '1px solid #d1d5db',
              borderRadius: 8,
              fontSize: 14,
              marginTop: 12,
              outline: 'none',
              background: '#ffffff',
              color: selectedFieldId ? '#111827' : '#9ca3af',
            }}
          >
            <option value="" disabled>圃場を選択...</option>
            {existingFields.map(f => (
              <option key={f.id} value={f.id}>
                {f.name} ({f.analyzedAt})
              </option>
            ))}
          </select>
        )}

        <button
          onClick={handleAnalyze}
          disabled={images.length === 0 || loading || (mode === 'existing' && !selectedFieldId)}
          style={{
            width: '100%',
            padding: 13,
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 'bold',
            border: 'none',
            marginTop: 12,
            cursor: images.length === 0 || loading || (mode === 'existing' && !selectedFieldId) ? 'default' : 'pointer',
            background: images.length === 0 || loading || (mode === 'existing' && !selectedFieldId) ? '#d1d5db' : '#ea580c',
            color: images.length === 0 || loading || (mode === 'existing' && !selectedFieldId) ? '#6b7280' : '#ffffff',
            transition: 'background 0.2s',
          }}
        >
          {loading ? '🔍 解析中...' : mode === 'existing' ? '解析して履歴に追加' : '解析してデータベースに登録'}
        </button>

        {error && (
          <div style={{
            marginTop: 12,
            padding: '10px 14px',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 8,
            color: '#dc2626',
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {/* Non-farmland rejection error */}
        {rejectionError && (
          <div style={{
            marginTop: 12,
            padding: '14px 16px',
            background: '#fef2f2',
            border: '1px solid #fca5a5',
            borderRadius: 10,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🚫</div>
            <div style={{ fontWeight: 'bold', color: '#dc2626', fontSize: 14, marginBottom: 4 }}>
              圃場の写真ではありません
            </div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>
              {rejectionError}
            </div>
          </div>
        )}

        <CategorySelector
          selected={selectedCategories}
          onChange={setSelectedCategories}
        />
      </main>
    </div>
  );
}

/** Filter AnalysisResult to only include selected categories */
function filterByCategories(
  data: Farmland['data'],
  categories: string[]
): Farmland['data'] {
  return {
    地形: categories.includes('地形') ? data.地形 : undefined,
    インフラ: categories.includes('インフラ') ? data.インフラ : undefined,
    土壌表面: categories.includes('土壌表面') ? data.土壌表面 : undefined,
    土地利用履歴: categories.includes('土地利用履歴') ? data.土地利用履歴 : undefined,
    周辺環境: categories.includes('周辺環境') ? data.周辺環境 : undefined,
    適性作物推定: data.適性作物推定,
    注意点: data.注意点,
    信頼度: data.信頼度,
  };
}
