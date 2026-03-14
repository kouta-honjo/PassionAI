import axios from 'axios';
import type { Farmland } from '@/types/farmland';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const DEMO_DATA: Farmland[] = [
  {
    id: '1',
    name: '田中農場 第1圃場',
    imageUrls: ['https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400'],
    analyzedAt: '2026-02-18',
    data: {
      地形: { 傾斜: '平坦', 地形タイプ: '平地', 推定面積: '30〜50アール' },
      インフラ: { 道路アクセス: '良好', 用排水路: true, 電力: true, 農業機械アクセス: '可能' },
      土壌表面: { 土色: '暗褐色', 表面状態: '整地済み・軽く締まった状態', 水分状態推定: '適湿' },
      土壌構造: { 土壌構造: '団粒', 土壌硬度推定: '柔らかい', 礫の密度: 'なし', 粒度推定: 'ローム' },
      排水詳細: { 表面滞水: false, モットル: false, クラスト: false, 侵食痕: 'なし', 暗渠排水: true },
      有機物: { 有機物量推定: '普通', 地表残渣: '少ない', 生物活動痕: true },
      土地利用履歴: { 現在の状態: '冬期休閑中', 過去の利用推定: '水田', 畝立て跡: false, 'マルチ等の資材': false },
      雑草植生: { 優占雑草種: 'なし（管理済み）', 被覆率推定: '5%以下', 草丈推定: '低い（〜30cm）', 樹木化: false, 指標植物: null },
      周辺環境: { 隣接建物: '農家住宅・倉庫', '森林・林地の近接': false, 日照条件推定: '良好' },
      微気候: { 風当たり推定: '普通', 防風林: false, 霜害リスク: '低い' },
      災害リスク: { 土壌侵食度: 'なし', 獣害リスク: '低い', 水害リスク: '低い' },
      再生コスト: { 除去必要物: 'なし', 整地必要度: '不要', 既存構造物: 'なし', 畦畔状態: '良好' },
      適性作物推定: ['水稲', '大豆', '小麦'],
      注意点: '用水路が整備されており水稲への転換も容易。排水性は要確認。',
      信頼度: '高'
    }
  },
  {
    id: '2',
    name: '山本農園 傾斜畑',
    imageUrls: ['https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400'],
    analyzedAt: '2026-02-25',
    data: {
      地形: { 傾斜: '緩傾斜', 地形タイプ: '丘陵', 推定面積: '10〜20アール' },
      インフラ: { 道路アクセス: '普通', 用排水路: false, 電力: true, 農業機械アクセス: '困難' },
      土壌表面: { 土色: '赤褐色', 表面状態: 'やや礫混じり・乾燥気味', 水分状態推定: '乾燥' },
      土壌構造: { 土壌構造: '塊状', 土壌硬度推定: '硬い', 礫の密度: '多い', 粒度推定: '粘土質' },
      排水詳細: { 表面滞水: false, モットル: false, クラスト: true, 侵食痕: 'リル侵食', 暗渠排水: false },
      有機物: { 有機物量推定: '少ない', 地表残渣: '少ない', 生物活動痕: false },
      土地利用履歴: { 現在の状態: '耕作中（葉物野菜）', 過去の利用推定: '畑地', 畝立て跡: true, 'マルチ等の資材': true },
      雑草植生: { 優占雑草種: 'カタバミ・スギナ', 被覆率推定: '20〜30%', 草丈推定: '低い（〜30cm）', 樹木化: false, 指標植物: 'スギナ（酸性土壌の指標）' },
      周辺環境: { 隣接建物: 'なし', '森林・林地の近接': true, 日照条件推定: '普通' },
      微気候: { 風当たり推定: '強い', 防風林: false, 霜害リスク: '普通' },
      災害リスク: { 土壌侵食度: '中度', 獣害リスク: '高い', 水害リスク: '低い' },
      再生コスト: { 除去必要物: '石礫の除去が必要', 整地必要度: '中規模', 既存構造物: 'なし', 畦畔状態: '一部崩壊' },
      適性作物推定: ['茶', 'ブルーベリー', 'サツマイモ'],
      注意点: '傾斜があるため侵食リスクあり。灌漑設備の整備が推奨される。',
      信頼度: '中'
    }
  },
  {
    id: '3',
    name: '鈴木ファーム 水田転換畑',
    imageUrls: ['https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400'],
    analyzedAt: '2026-03-05',
    data: {
      地形: { 傾斜: '平坦', 地形タイプ: '谷地', 推定面積: '20〜30アール' },
      インフラ: { 道路アクセス: '良好', 用排水路: true, 電力: false, 農業機械アクセス: '可能' },
      土壌表面: { 土色: '灰褐色', 表面状態: '湿潤・やや粘質', 水分状態推定: '過湿' },
      土壌構造: { 土壌構造: '板状', 土壌硬度推定: '普通', 礫の密度: 'なし', 粒度推定: '粘土質' },
      排水詳細: { 表面滞水: true, モットル: true, クラスト: false, 侵食痕: 'なし', 暗渠排水: false },
      有機物: { 有機物量推定: '普通', 地表残渣: '多い', 生物活動痕: true },
      土地利用履歴: { 現在の状態: '転換畑・休閑中', 過去の利用推定: '水田', 畝立て跡: true, 'マルチ等の資材': false },
      雑草植生: { 優占雑草種: 'セイタカアワダチソウ・ヨシ', 被覆率推定: '60〜70%', 草丈推定: '高い（100cm〜）', 樹木化: false, 指標植物: 'ヨシ（湿地の指標）' },
      周辺環境: { 隣接建物: '農家住宅', '森林・林地の近接': true, 日照条件推定: '普通' },
      微気候: { 風当たり推定: '弱い', 防風林: true, 霜害リスク: '高い' },
      災害リスク: { 土壌侵食度: 'なし', 獣害リスク: '普通', 水害リスク: '高い' },
      再生コスト: { 除去必要物: '大型雑草の刈り取りが必要', 整地必要度: '中規模', 既存構造物: '用水路（老朽化）', 畦畔状態: '一部崩壊' },
      適性作物推定: ['レンコン', 'クワイ', '水稲'],
      注意点: '排水不良の可能性あり。暗渠排水の施工を検討すること。',
      信頼度: '中'
    }
  },
  {
    id: '4',
    name: '伊藤農地 台地畑',
    imageUrls: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'],
    analyzedAt: '2026-03-10',
    data: {
      地形: { 傾斜: '平坦', 地形タイプ: '台地', 推定面積: '40〜60アール' },
      インフラ: { 道路アクセス: '良好', 用排水路: false, 電力: true, 農業機械アクセス: '可能' },
      土壌表面: { 土色: '黒褐色', 表面状態: '有機物豊富・ふかふかした状態', 水分状態推定: '適湿' },
      土壌構造: { 土壌構造: '団粒', 土壌硬度推定: '柔らかい', 礫の密度: '少ない', 粒度推定: 'ローム' },
      排水詳細: { 表面滞水: false, モットル: false, クラスト: false, 侵食痕: 'なし', 暗渠排水: false },
      有機物: { 有機物量推定: '豊富', 地表残渣: '多い', 生物活動痕: true },
      土地利用履歴: { 現在の状態: '耕作中（根菜類）', 過去の利用推定: '畑地', 畝立て跡: true, 'マルチ等の資材': true },
      雑草植生: { 優占雑草種: 'なし（管理済み）', 被覆率推定: '5%以下', 草丈推定: '低い（〜30cm）', 樹木化: false, 指標植物: null },
      周辺環境: { 隣接建物: '農業倉庫・直売所', '森林・林地の近接': false, 日照条件推定: '良好' },
      微気候: { 風当たり推定: '普通', 防風林: false, 霜害リスク: '低い' },
      災害リスク: { 土壌侵食度: '軽度', 獣害リスク: '低い', 水害リスク: '低い' },
      再生コスト: { 除去必要物: 'なし', 整地必要度: '不要', 既存構造物: 'ビニールハウス骨組み1棟', 畦畔状態: '良好' },
      適性作物推定: ['大根', 'ニンジン', 'ジャガイモ'],
      注意点: '黒色土で有機物量が高く根菜類に最適。灌漑水源の確保が課題。',
      信頼度: '高'
    }
  }
];

export const farmlandApi = {
  analyze: async (images: File[], name?: string, memo?: string, categories?: string[]): Promise<Farmland> => {
    const formData = new FormData();
    images.forEach(img => formData.append('images', img));
    if (name) formData.append('name', name);
    if (memo) formData.append('memo', memo);
    if (categories) formData.append('categories', JSON.stringify(categories));
    const res = await axios.post(`${BASE_URL}/api/analyze`, formData, {
      timeout: 30000,
    });
    return res.data;
  },

  addAnalysis: async (fieldId: string, images: File[], categories?: string[]): Promise<Farmland> => {
    const formData = new FormData();
    images.forEach(img => formData.append('images', img));
    if (categories) formData.append('categories', JSON.stringify(categories));
    const res = await axios.post(`${BASE_URL}/api/farmlands/${fieldId}/analyze`, formData, {
      timeout: 30000,
    });
    return res.data;
  },

  list: async (params?: { search?: string; page?: number }): Promise<Farmland[]> => {
    const res = await axios.get(`${BASE_URL}/api/farmlands`, { params, timeout: 10000 });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await axios.delete(`${BASE_URL}/api/farmlands/${id}`, { timeout: 10000 });
  },

  exportCSV: async (): Promise<void> => {
    const res = await axios.get(`${BASE_URL}/api/farmlands/export`, {
      responseType: 'blob',
      timeout: 30000,
    });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = `farmland_export_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
};

// CSV生成（フロントエンドフォールバック用）
export function generateCSV(data: Farmland[]): void {
  const BOM = '\uFEFF';
  const headers = [
    '農地名', '登録日',
    '傾斜', '地形タイプ', '推定面積',
    '道路アクセス', '用排水路', '電力', '機械アクセス',
    '土色', '表面状態', '水分状態',
    '現在の状態', '過去の利用', '畝立て跡', 'マルチ資材',
    '隣接建物', '林地近接', '日照条件',
    '適性作物1', '適性作物2', '適性作物3',
    '注意点', '信頼度'
  ];

  const boolStr = (v: boolean | null) => v === true ? 'あり' : v === false ? 'なし' : '不明';
  const escape = (v: string | null | undefined) => {
    const s = v ?? '不明';
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const rows = data.map(f => {
    const d = f.data;
    return [
      f.name, f.analyzedAt,
      d.地形?.傾斜 ?? '不明', d.地形?.地形タイプ ?? '不明', d.地形?.推定面積 ?? '不明',
      d.インフラ?.道路アクセス ?? '不明', boolStr(d.インフラ?.用排水路 ?? null), boolStr(d.インフラ?.電力 ?? null), d.インフラ?.農業機械アクセス ?? '不明',
      d.土壌表面?.土色 ?? '不明', d.土壌表面?.表面状態 ?? '不明', d.土壌表面?.水分状態推定 ?? '不明',
      d.土地利用履歴?.現在の状態 ?? '不明', d.土地利用履歴?.過去の利用推定 ?? '不明', boolStr(d.土地利用履歴?.畝立て跡 ?? null), boolStr(d.土地利用履歴?.['マルチ等の資材'] ?? null),
      d.周辺環境?.隣接建物 ?? '不明', boolStr(d.周辺環境?.['森林・林地の近接'] ?? null), d.周辺環境?.日照条件推定 ?? '不明',
      d.適性作物推定[0] ?? '', d.適性作物推定[1] ?? '', d.適性作物推定[2] ?? '',
      d.注意点, d.信頼度
    ].map(v => escape(String(v)));
  });

  const csv = BOM + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  a.download = `farmland_export_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
