'use client';

interface ExportBannerProps {
  count: number;
  onExport: () => void;
}

export default function ExportBanner({ count, onExport }: ExportBannerProps) {
  const disabled = count === 0;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>
          📊 データをエクスポート
        </div>
        <div style={{ color: '#bfdbfe', fontSize: 12, marginTop: 2 }}>
          {count}件の農地データをCSVで出力
        </div>
      </div>
      <button
        onClick={onExport}
        disabled={disabled}
        style={{
          background: '#ffffff',
          color: '#1d4ed8',
          fontWeight: 'bold',
          borderRadius: 8,
          padding: '9px 16px',
          fontSize: 13,
          border: 'none',
          cursor: disabled ? 'default' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          whiteSpace: 'nowrap',
        }}
      >
        ⬇ CSV出力
      </button>
    </div>
  );
}
