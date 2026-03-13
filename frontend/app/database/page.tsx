'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import ResultCard from '@/components/ResultCard';
import ExportBanner from '@/components/ExportBanner';
import { farmlandApi, DEMO_DATA, generateCSV } from '@/lib/api';
import type { Farmland } from '@/types/farmland';

export default function DatabasePage() {
  const [farmlands, setFarmlands] = useState<Farmland[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await farmlandApi.list();
      setFarmlands(data);
      localStorage.setItem('farmlands', JSON.stringify(data));
    } catch {
      // API未接続時: localStorageから読み取り、なければデモデータ
      const stored = localStorage.getItem('farmlands');
      if (stored) {
        try {
          setFarmlands(JSON.parse(stored));
        } catch {
          setFarmlands(DEMO_DATA);
          localStorage.setItem('farmlands', JSON.stringify(DEMO_DATA));
        }
      } else {
        setFarmlands(DEMO_DATA);
        localStorage.setItem('farmlands', JSON.stringify(DEMO_DATA));
      }
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string) => {
    try {
      await farmlandApi.delete(id);
    } catch {
      // API未接続時: ローカルのみ削除
    }
    const updated = farmlands.filter(f => f.id !== id);
    setFarmlands(updated);
    localStorage.setItem('farmlands', JSON.stringify(updated));
  };

  const handleExport = async () => {
    try {
      await farmlandApi.exportCSV();
    } catch {
      // API未接続時: フロントエンドでCSV生成
      generateCSV(farmlands);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {/* Header */}
      <header style={{ background: '#15803d', padding: '12px 20px' }}>
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
        <Link href="/" style={{
          flex: 1,
          textAlign: 'center',
          padding: '12px 0',
          fontSize: 14,
          color: '#6b7280',
          textDecoration: 'none',
          cursor: 'pointer',
        }}>
          📷 解析
        </Link>
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
          🗂 データベース ({farmlands.length}件)
        </div>
      </nav>

      {/* Main */}
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '16px 16px 32px' }}>
        <ExportBanner count={farmlands.length} onExport={handleExport} />

        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
          {farmlands.length}件の農地データ
        </div>

        {loaded && farmlands.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#9ca3af',
          }}>
            <div style={{ fontSize: 40 }}>🌱</div>
            <div style={{ marginTop: 12, fontWeight: 'bold' }}>まだデータがありません</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              農地の写真を解析すると、ここに記録されます
            </div>
          </div>
        ) : (
          farmlands.map(f => (
            <ResultCard key={f.id} farmland={f} onDelete={handleDelete} />
          ))
        )}
      </main>
    </div>
  );
}
