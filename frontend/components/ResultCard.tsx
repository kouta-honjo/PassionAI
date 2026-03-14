'use client';

import { useState } from 'react';
import type { Farmland, Confidence, AnalysisEntry, AnalysisResult } from '@/types/farmland';
import DeltaView from '@/components/DeltaView';

interface ResultCardProps {
  farmland: Farmland;
  onDelete: (id: string) => void;
}

const confidenceStyle: Record<Confidence, { bg: string; color: string }> = {
  '高': { bg: '#22c55e20', color: '#22c55e' },
  '中': { bg: '#f59e0b20', color: '#f59e0b' },
  '低': { bg: '#ef444420', color: '#ef4444' },
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '不明';
  if (typeof value === 'boolean') return value ? '✓ あり' : '✗ なし';
  return String(value);
}

type SectionData = Record<string, unknown>;

function Section({ label, data }: { label: string; data: SectionData }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        textTransform: 'uppercase',
        fontSize: 11,
        color: '#6b7280',
        letterSpacing: 1,
        marginBottom: 6,
        fontWeight: 600,
      }}>
        {label}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '4px 16px',
        fontSize: 13,
      }}>
        {Object.entries(data).map(([key, val]) => (
          <div key={key} style={{ display: 'contents' }}>
            <span style={{ color: '#6b7280' }}>{key}</span>
            <span style={{ color: formatValue(val) === '不明' ? '#9ca3af' : '#111827' }}>
              {formatValue(val)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisContent({ data, prevData }: { data: AnalysisResult; prevData?: AnalysisResult }) {
  return (
    <>
      {data.地形 && <Section label="地形" data={data.地形 as unknown as SectionData} />}
      {data.インフラ && <Section label="インフラ" data={data.インフラ as unknown as SectionData} />}
      {data.土壌表面 && <Section label="土壌表面" data={data.土壌表面 as unknown as SectionData} />}
      {data.土地利用履歴 && <Section label="土地利用履歴" data={data.土地利用履歴 as unknown as SectionData} />}
      {data.周辺環境 && <Section label="周辺環境" data={data.周辺環境 as unknown as SectionData} />}

      {data.注意点 && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fcd34d',
          borderRadius: 7,
          padding: '8px 12px',
          fontSize: 13,
          color: '#92400e',
          marginTop: 8,
        }}>
          ⚠ {data.注意点}
        </div>
      )}

      {prevData && <DeltaView current={data} previous={prevData} />}
    </>
  );
}

export default function ResultCard({ farmland, onDelete }: ResultCardProps) {
  const [open, setOpen] = useState(false);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const { data } = farmland;
  const badge = confidenceStyle[data.信頼度];

  const analyses = farmland.analyses ?? [];
  const hasHistory = analyses.length > 0;

  // Determine which data to display: selected history entry or latest
  const displayData = historyIndex !== null && analyses[historyIndex]
    ? analyses[historyIndex].data
    : data;

  // Previous data for delta comparison
  const getPrevData = (): AnalysisResult | undefined => {
    if (historyIndex !== null) {
      // Viewing a history entry - show delta against the next older one
      const olderIndex = historyIndex + 1;
      if (olderIndex < analyses.length) return analyses[olderIndex].data;
      return undefined;
    }
    // Viewing latest - show delta against first history entry
    if (analyses.length >= 1) return analyses[0].data;
    return undefined;
  };

  const prevData = getPrevData();

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e5e7eb',
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 12,
    }}>
      {/* Header */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          background: '#f9fafb',
          padding: '10px 14px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        {farmland.imageUrls[0] && (
          <img
            src={farmland.imageUrls[0]}
            alt={farmland.name}
            style={{
              width: 64,
              height: 48,
              borderRadius: 6,
              objectFit: 'cover',
              flexShrink: 0,
            }}
          />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 'bold',
            fontSize: 14,
            color: '#111827',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {farmland.name}
            {hasHistory && (
              <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 'normal', marginLeft: 6 }}>
                ({analyses.length + 1}回解析)
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#6b7280' }}>
            {farmland.analyzedAt}
          </div>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 'bold' }}>
            適性: {data.適性作物推定.join(', ')}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{
            fontSize: 11,
            borderRadius: 20,
            padding: '2px 8px',
            fontWeight: 'bold',
            background: badge.bg,
            color: badge.color,
          }}>
            {data.信頼度}
          </span>
          <span style={{ fontSize: 18, color: '#9ca3af' }}>
            {open ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div style={{ padding: 14, borderTop: '1px solid #e5e7eb' }}>
          <AnalysisContent data={displayData} prevData={prevData} />

          {/* History section */}
          {hasHistory && (
            <div style={{
              marginTop: 16,
              padding: 12,
              background: '#f9fafb',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: '#374151',
                marginBottom: 8,
              }}>
                過去の解析履歴
              </div>
              <div
                onClick={() => setHistoryIndex(null)}
                style={{
                  fontSize: 12,
                  padding: '6px 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: historyIndex === null ? '#ea580c15' : 'transparent',
                  color: historyIndex === null ? '#ea580c' : '#6b7280',
                  fontWeight: historyIndex === null ? 600 : 400,
                  marginBottom: 2,
                }}
              >
                最新 - {farmland.analyzedAt}
              </div>
              {analyses.map((entry, i) => (
                <div
                  key={entry.id}
                  onClick={() => setHistoryIndex(i)}
                  style={{
                    fontSize: 12,
                    padding: '6px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: historyIndex === i ? '#ea580c15' : 'transparent',
                    color: historyIndex === i ? '#ea580c' : '#6b7280',
                    fontWeight: historyIndex === i ? 600 : 400,
                    marginBottom: 2,
                  }}
                >
                  #{analyses.length - i} - {entry.analyzedAt}
                </div>
              ))}
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('この農地データを削除しますか？')) {
                onDelete(farmland.id);
              }
            }}
            style={{
              marginTop: 12,
              fontSize: 12,
              color: '#ef4444',
              border: '1px solid #fca5a5',
              borderRadius: 6,
              padding: '4px 12px',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            削除
          </button>
        </div>
      )}
    </div>
  );
}
