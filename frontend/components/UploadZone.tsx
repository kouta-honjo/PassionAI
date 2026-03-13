'use client';

import { useCallback, useRef, useState } from 'react';

interface UploadZoneProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
}

export default function UploadZone({ images, onImagesChange }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newImages = [...images];
    for (let i = 0; i < files.length && newImages.length < 4; i++) {
      if (files[i].type.startsWith('image/')) {
        newImages.push(files[i]);
      }
    }
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const previews = images.map((file) => URL.createObjectURL(file));

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        style={{
          background: isDragging ? '#dcfce7' : '#f0fdf4',
          border: '2px dashed #86efac',
          borderRadius: 12,
          padding: '32px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'background 0.2s',
        }}
      >
        <div style={{ fontSize: 36 }}>📁</div>
        <div style={{ color: '#15803d', fontWeight: 'bold', fontSize: 15, marginTop: 8 }}>
          農地の写真をアップロード
        </div>
        <div style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
          複数枚可（最大4枚）・ドラッグ&ドロップ対応
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => addFiles(e.target.files)}
          style={{ display: 'none' }}
        />
      </div>

      {images.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {previews.map((url, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img
                src={url}
                alt={`preview-${i}`}
                style={{
                  width: 80,
                  height: 60,
                  objectFit: 'cover',
                  borderRadius: 7,
                  border: '2px solid #86efac',
                }}
              />
              <button
                onClick={() => removeImage(i)}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  fontSize: 10,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
