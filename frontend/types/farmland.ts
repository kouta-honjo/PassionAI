export type Confidence = '高' | '中' | '低';

export interface Terrain {
  傾斜: '平坦' | '緩傾斜' | '急傾斜' | '不明';
  地形タイプ: '平地' | '谷地' | '台地' | '丘陵' | '不明';
  推定面積: string | null;
}

export interface Infrastructure {
  道路アクセス: '良好' | '普通' | '不良' | '不明';
  用排水路: boolean | null;
  電力: boolean | null;
  農業機械アクセス: '可能' | '困難' | '不明';
}

export interface SoilSurface {
  土色: string | null;
  表面状態: string | null;
  水分状態推定: '乾燥' | '適湿' | '過湿' | '不明';
}

export interface LandHistory {
  現在の状態: string;
  過去の利用推定: '水田' | '畑地' | '牧草地' | '休耕' | '不明';
  畝立て跡: boolean | null;
  'マルチ等の資材': boolean | null;
}

export interface Environment {
  隣接建物: string | null;
  '森林・林地の近接': boolean | null;
  日照条件推定: '良好' | '普通' | '不良' | '不明';
}

// --- 追加カテゴリ（リサーチに基づく） ---

export interface SoilStructure {
  土壌構造: '団粒' | '塊状' | '柱状' | '板状' | '不明';
  土壌硬度推定: '柔らかい' | '普通' | '硬い' | '不明';
  礫の密度: '多い' | '少ない' | 'なし' | '不明';
  粒度推定: '砂質' | '粘土質' | 'ローム' | 'シルト' | '不明';
}

export interface DrainageDetail {
  表面滞水: boolean | null;
  モットル: boolean | null;
  クラスト: boolean | null;
  侵食痕: 'なし' | 'リル侵食' | 'ガリー侵食' | '不明';
  暗渠排水: boolean | null;
}

export interface OrganicMatter {
  有機物量推定: '豊富' | '普通' | '少ない' | '不明';
  地表残渣: '多い' | '少ない' | 'なし' | '不明';
  生物活動痕: boolean | null;
}

export interface WeedVegetation {
  優占雑草種: string | null;
  被覆率推定: string | null;
  草丈推定: '低い（〜30cm）' | '中程度（30-100cm）' | '高い（100cm〜）' | '不明';
  樹木化: boolean | null;
  指標植物: string | null;
}

export interface Microclimate {
  風当たり推定: '強い' | '普通' | '弱い' | '不明';
  防風林: boolean | null;
  霜害リスク: '高い' | '普通' | '低い' | '不明';
}

export interface DisasterRisk {
  土壌侵食度: '重度' | '中度' | '軽度' | 'なし' | '不明';
  獣害リスク: '高い' | '普通' | '低い' | '不明';
  水害リスク: '高い' | '普通' | '低い' | '不明';
}

export interface RestorationCost {
  除去必要物: string | null;
  整地必要度: '大規模' | '中規模' | '軽微' | '不要' | '不明';
  既存構造物: string | null;
  畦畔状態: '良好' | '一部崩壊' | '崩壊' | '不明';
}

export interface AnalysisResult {
  地形?: Terrain;
  インフラ?: Infrastructure;
  土壌表面?: SoilSurface;
  土地利用履歴?: LandHistory;
  周辺環境?: Environment;
  土壌構造?: SoilStructure;
  排水詳細?: DrainageDetail;
  有機物?: OrganicMatter;
  雑草植生?: WeedVegetation;
  微気候?: Microclimate;
  災害リスク?: DisasterRisk;
  再生コスト?: RestorationCost;
  適性作物推定: string[];
  注意点: string;
  信頼度: Confidence;
}

export interface AnalysisEntry {
  id: string;
  analyzedAt: string;
  imageUrls: string[];
  data: AnalysisResult;
}

export interface Farmland {
  id: string;
  name: string;
  memo?: string;
  imageUrls: string[];
  analyzedAt: string;
  data: AnalysisResult;
  analyses?: AnalysisEntry[];
}
