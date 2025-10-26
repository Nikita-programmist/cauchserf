import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '../lib/utils';
import { Button } from './ui/button';

export function AvatarUploader({
  id,
  className,
  buttonLabel = 'Выбрать фото',
  initialPreviewUrl = '',
  onFileChange
}) {
  const inputRef = useRef(null);
  const objectUrlRef = useRef(null);
  const generatedId = useId();
  const [previewUrl, setPreviewUrl] = useState(initialPreviewUrl || '');
  const [hasLocalFile, setHasLocalFile] = useState(false);

  useEffect(() => {
    if (!hasLocalFile) {
      setPreviewUrl(initialPreviewUrl || '');
    }
  }, [initialPreviewUrl, hasLocalFile]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (event) => {
    const file = event.target.files?.[0] ?? null;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (file) {
      const newUrl = URL.createObjectURL(file);
      objectUrlRef.current = newUrl;
      setPreviewUrl(newUrl);
      setHasLocalFile(true);
    } else {
      setPreviewUrl(initialPreviewUrl || '');
      setHasLocalFile(false);
    }

    onFileChange?.(file);
  };

  const inputId = id ?? generatedId;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <Button type="button" onClick={handleClick} className="self-start">
        {buttonLabel}
      </Button>
      {previewUrl ? (
        <div className="h-24 w-24 overflow-hidden rounded-2xl border border-white/20 bg-white/5">
          <img src={previewUrl} alt="Предпросмотр аватара" className="h-full w-full object-cover" />
        </div>
      ) : (
        <p className="text-sm text-fg/50">Файл не выбран</p>
      )}
    </div>
  );
}

export default AvatarUploader;
