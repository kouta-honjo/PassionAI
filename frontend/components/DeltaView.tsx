'use client';

import type { AnalysisResult } from '@/types/farmland';
import { computeAllDeltas } from '@/lib/delta';
import type { FieldDelta } from '@/lib/delta';

interface DeltaViewProps {
  current: AnalysisResult;
  previous: AnalysisResult;
}

const deltaColors: Record<FieldDelta['type'], { bg: string; color: string; label: string }> = {
  improved: { bg: '#dcfce7', color: '#16a34a', label: '改善' },
  worsened: { bg: '#fef2f2', color: '#dc2626', label: '悪化' },
  changed: { bg: '#f3f4f6', color: '#6b7280', label: '変化' },
};

export default function DeltaView({ current, previous }: DeltaViewProps) {
  const { sections, crops } = computeAllDeltas(current, previous);

  const hasChanges = sections.length > 0 || crops.added.length > 0 || crops.removed.length > 0;
  if (!hasChanges) return null;

  return (
    <div style={{
      marginTop: 14,
      padding: 12,
      background: '#f0fdf4',
      borderRadius: 8,
      border: '1px solid #bbf7d0',
    }}>
      <div style={{
        fontSize: 12,
        fontWeight: 'bold',
        color: '#374151',
        marginBottom: 8,
      }}>
        前回からの変化
      </div>

      {sections.map(section => (
        <div key={section.label} style={{ marginBottom: 8 }}>
          <div style={{
            fontSize: 11,
            color: '#6b7280',
            fontWeight: 600,
            marginBottom: 4,
          }}>
            {section.label}
          </div>
          {section.fields.map(field => {
            const style = deltaColors[field.type];
            return (
              <div key={field.key} style={{
                fontSize: 12,
                padding: '3px 8px',
                marginBottom: 2,
                borderRadius: 4,
                background: style.bg,
                color: style.color,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span>{field.key}</span>
                <span style={{ fontSize: 11 }}>
                  {field.prev} → {field.curr}
                </span>
              </div>
            );
          })}
        </div>
      ))}

      {(crops.added.length > 0 || crops.removed.length > 0) && (
        <div style={{ marginBottom: 4 }}>
          <div style={{
            fontSize: 11,
            color: '#6b7280',
            fontWeight: 600,
            marginBottom: 4,
          }}>
            適性作物
          </div>
          {crops.added.map(c => (
            <span key={`+${c}`} style={{
              display: 'inline-block',
              fontSize: 11,
              padding: '2px 8px',
              marginRight: 4,
              marginBottom: 2,
              borderRadius: 10,
              background: '#dcfce7',
              color: '#16a34a',
              fontWeight: 600,
            }}>
              + {c}
            </span>
          ))}
          {crops.removed.map(c => (
            <span key={`-${c}`} style={{
              display: 'inline-block',
              fontSize: 11,
              padding: '2px 8px',
              marginRight: 4,
              marginBottom: 2,
              borderRadius: 10,
              background: '#fef2f2',
              color: '#dc2626',
              fontWeight: 600,
            }}>
              - {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
