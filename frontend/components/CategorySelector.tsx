'use client';

interface Category {
  key: string;
  label: string;
  locked?: boolean;
}

const CATEGORIES: Category[] = [
  { key: '地形', label: '地形（傾斜・地形タイプ・推定面積）' },
  { key: 'インフラ', label: 'インフラ（道路・用排水路・電力）' },
  { key: '土壌表面', label: '土壌表面（土色・水分状態）' },
  { key: '土地利用履歴', label: '土地利用履歴（畝跡・過去の用途）' },
  { key: '周辺環境', label: '周辺環境（建物・日照）' },
  { key: '適性作物推定', label: '適性作物の推定', locked: true },
];

interface CategorySelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function CategorySelector({ selected, onChange }: CategorySelectorProps) {
  const toggleable = CATEGORIES.filter(c => !c.locked);
  const allSelected = toggleable.every(c => selected.includes(c.key));

  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter(k => k !== key));
    } else {
      onChange([...selected, key]);
    }
  };

  const toggleAll = () => {
    if (allSelected) {
      // Keep only locked categories
      onChange(CATEGORIES.filter(c => c.locked).map(c => c.key));
    } else {
      onChange(CATEGORIES.map(c => c.key));
    }
  };

  return (
    <div style={{
      background: '#ffffff',
      padding: 14,
      borderRadius: 10,
      border: '1px solid #e5e7eb',
      marginTop: 16,
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
      }}>
        <div style={{ fontWeight: 'bold', fontSize: 13, color: '#374151' }}>
          抽出する情報
        </div>
        <button
          onClick={toggleAll}
          style={{
            fontSize: 11,
            color: '#ea580c',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          {allSelected ? '全解除' : '全選択'}
        </button>
      </div>
      {CATEGORIES.map((cat, i) => {
        const isLocked = 'locked' in cat && cat.locked;
        const isChecked = isLocked || selected.includes(cat.key);
        return (
          <label
            key={cat.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: isLocked ? '#9ca3af' : '#6b7280',
              padding: '6px 0',
              borderBottom: i < CATEGORIES.length - 1 ? '1px solid #f3f4f6' : 'none',
              cursor: isLocked ? 'default' : 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={isChecked}
              disabled={isLocked}
              onChange={() => !isLocked && toggle(cat.key)}
              style={{
                accentColor: '#ea580c',
                cursor: isLocked ? 'default' : 'pointer',
              }}
            />
            {cat.label}
            {isLocked && (
              <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 'auto' }}>
                常時有効
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
}
