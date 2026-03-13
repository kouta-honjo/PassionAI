-- 情熱AIプロジェクト SQLiteスキーマ定義
-- data-pipeline エージェント作成

CREATE TABLE IF NOT EXISTS fields (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    address     TEXT NOT NULL,
    prefecture  TEXT NOT NULL,
    latitude    REAL,
    longitude   REAL,
    area_sqm    REAL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analyses (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    field_id            INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    photo_path          TEXT NOT NULL,
    analyzed_at         DATETIME DEFAULT CURRENT_TIMESTAMP,
    soil_type           TEXT,
    soil_color          TEXT,
    vegetation          TEXT,   -- JSON array
    abandonment_level   INTEGER CHECK(abandonment_level BETWEEN 1 AND 5),
    drainage_estimate   TEXT,
    slope               TEXT,
    stones_present      INTEGER DEFAULT 0 CHECK(stones_present IN (0, 1)),
    raw_description     TEXT,
    confidence          REAL CHECK(confidence BETWEEN 0.0 AND 1.0),
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crop_suitability (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    crop_name   TEXT NOT NULL,
    score       INTEGER NOT NULL CHECK(score BETWEEN 0 AND 100),
    rank        INTEGER NOT NULL,
    reason      TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_analyses_field_id ON analyses(field_id);
CREATE INDEX IF NOT EXISTS idx_crop_suitability_analysis_id ON crop_suitability(analysis_id);
CREATE INDEX IF NOT EXISTS idx_crop_suitability_score ON crop_suitability(score DESC);
