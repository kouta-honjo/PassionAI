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

export interface AnalysisResult {
  地形: Terrain;
  インフラ: Infrastructure;
  土壌表面: SoilSurface;
  土地利用履歴: LandHistory;
  周辺環境: Environment;
  適性作物推定: string[];
  注意点: string;
  信頼度: Confidence;
}

export interface Farmland {
  id: string;
  name: string;
  memo?: string;
  imageUrls: string[];
  analyzedAt: string;
  data: AnalysisResult;
}
