import type { AnalysisResult } from '@/types/farmland';

export interface FieldDelta {
  key: string;
  prev: string;
  curr: string;
  type: 'improved' | 'worsened' | 'changed';
}

export interface SectionDelta {
  label: string;
  fields: FieldDelta[];
}

export interface CropDelta {
  added: string[];
  removed: string[];
}

/** Value rankings for qualitative improvement detection */
const RANKINGS: Record<string, string[]> = {
  '傾斜': ['急傾斜', '緩傾斜', '平坦'],
  '道路アクセス': ['不良', '普通', '良好'],
  '農業機械アクセス': ['困難', '可能'],
  '水分状態推定': ['過湿', '乾燥', '適湿'],
  '日照条件推定': ['不良', '普通', '良好'],
};

function classifyChange(key: string, prev: string, curr: string): 'improved' | 'worsened' | 'changed' {
  const ranking = RANKINGS[key];
  if (!ranking) return 'changed';
  const prevIdx = ranking.indexOf(prev);
  const currIdx = ranking.indexOf(curr);
  if (prevIdx === -1 || currIdx === -1) return 'changed';
  if (currIdx > prevIdx) return 'improved';
  if (currIdx < prevIdx) return 'worsened';
  return 'changed';
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return '不明';
  if (typeof val === 'boolean') return val ? 'あり' : 'なし';
  return String(val);
}

export function computeSectionDelta(
  label: string,
  prev: Record<string, unknown> | undefined,
  curr: Record<string, unknown> | undefined
): SectionDelta | null {
  if (!prev || !curr) return null;

  const fields: FieldDelta[] = [];
  const allKeys = new Set([...Object.keys(prev), ...Object.keys(curr)]);

  for (const key of allKeys) {
    const prevStr = formatValue(prev[key]);
    const currStr = formatValue(curr[key]);
    if (prevStr !== currStr) {
      fields.push({
        key,
        prev: prevStr,
        curr: currStr,
        type: classifyChange(key, prevStr, currStr),
      });
    }
  }

  return fields.length > 0 ? { label, fields } : null;
}

export function computeCropDelta(prev: string[], curr: string[]): CropDelta {
  const prevSet = new Set(prev);
  const currSet = new Set(curr);
  return {
    added: curr.filter(c => !prevSet.has(c)),
    removed: prev.filter(c => !currSet.has(c)),
  };
}

export function computeAllDeltas(
  current: AnalysisResult,
  previous: AnalysisResult
): { sections: SectionDelta[]; crops: CropDelta } {
  const sections: SectionDelta[] = [];

  const pairs: [string, Record<string, unknown> | undefined, Record<string, unknown> | undefined][] = [
    ['地形', previous.地形 as unknown as Record<string, unknown>, current.地形 as unknown as Record<string, unknown>],
    ['インフラ', previous.インフラ as unknown as Record<string, unknown>, current.インフラ as unknown as Record<string, unknown>],
    ['土壌表面', previous.土壌表面 as unknown as Record<string, unknown>, current.土壌表面 as unknown as Record<string, unknown>],
    ['土地利用履歴', previous.土地利用履歴 as unknown as Record<string, unknown>, current.土地利用履歴 as unknown as Record<string, unknown>],
    ['周辺環境', previous.周辺環境 as unknown as Record<string, unknown>, current.周辺環境 as unknown as Record<string, unknown>],
  ];

  for (const [label, prev, curr] of pairs) {
    const delta = computeSectionDelta(label, prev, curr);
    if (delta) sections.push(delta);
  }

  const crops = computeCropDelta(
    previous.適性作物推定 ?? [],
    current.適性作物推定 ?? [],
  );

  return { sections, crops };
}
