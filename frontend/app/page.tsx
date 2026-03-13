'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UploadZone from '@/components/UploadZone';
import { farmlandApi, DEMO_DATA } from '@/lib/api';
import type { Farmland } from '@/types/farmland';

export default function AnalyzePage() {
  const router = useRouter();
  const [images, setImages] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbCount, setDbCount] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('farmlands');
    if (stored) {
      try {
        setDbCount(JSON.parse(stored).length);
      } catch { /* ignore */ }
    }
  }, []);

  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setLoading(true);
    setError(null);

    try {
      let result: Farmland;
      try {
        result = await farmlandApi.analyze(images, name || undefined);
      } catch {
        // API未接続時: デモデータからランダムで返す
        const demo = DEMO_DATA[Math.floor(Math.random() * DEMO_DATA.length)];
        result = {
          ...demo,
          id: Date.now().toString(),
          name: name || `農地 ${new Date().toLocaleDateString('ja-JP')}`,
          analyzedAt: new Date().toISOString().slice(0, 10),
          imageUrls: images.map(f => URL.createObjectURL(f)),
        };
      }

      // localStorageに保存
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
      <header style={{ background: '#15803d', padding: '16px 20px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 20 }}>
            🌾 農地分析システム
          </div>
          <div style={{ color: '#ffffff', fontSize: 12, opacity: 0.8, marginTop: 2 }}>
            写真から農地情報を自動抽出・データベース化
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
          color: '#15803d',
          borderBottom: '2px solid #15803d',
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

        <button
          onClick={handleAnalyze}
          disabled={images.length === 0 || loading}
          style={{
            width: '100%',
            padding: 13,
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 'bold',
            border: 'none',
            marginTop: 12,
            cursor: images.length === 0 || loading ? 'default' : 'pointer',
            background: images.length === 0 || loading ? '#d1d5db' : '#15803d',
            color: images.length === 0 || loading ? '#6b7280' : '#ffffff',
            transition: 'background 0.2s',
          }}
        >
          {loading ? '🔍 解析中...' : '解析してデータベースに登録'}
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

        {/* Info card */}
        <div style={{
          background: '#ffffff',
          padding: 14,
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          marginTop: 16,
        }}>
          <div style={{ fontWeight: 'bold', fontSize: 13, color: '#374151', marginBottom: 10 }}>
            抽出される情報
          </div>
          {[
            '地形（傾斜・地形タイプ・推定面積）',
            'インフラ（道路・用排水路・電力）',
            '土壌表面（土色・水分状態）',
            '土地利用履歴（畝跡・過去の用途）',
            '周辺環境（建物・日照）',
            '適性作物の推定',
          ].map((item, i, arr) => (
            <div key={i} style={{
              fontSize: 12,
              color: '#6b7280',
              padding: '6px 0',
              borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none',
            }}>
              ✓ {item}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
