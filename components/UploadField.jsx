import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '../lib/utils';
import { Button } from './ui/button';

export function UploadField({
  id,
  className,
  buttonLabel = 'Загрузить фото',
  accept = 'image/*',
  multiple = false,
  maxFiles = null,
  initialPreviewUrl = '',
  initialPreviewUrls = [],
  helperText = '',
  onFilesChange,
  onLimitExceeded
}) {
  const inputRef = useRef(null);
  const generatedId = useId();
  const objectUrlsRef = useRef([]);
  const [previews, setPreviews] = useState(() => {
    if (multiple) {
      return (initialPreviewUrls ?? []).map((url, index) => ({ url, name: `preview-${index}`, isInitial: true }));
    }
    return initialPreviewUrl ? [{ url: initialPreviewUrl, name: 'preview', isInitial: true }] : [];
  });
  const [hasLocalPreview, setHasLocalPreview] = useState(false);

  const inputId = id ?? generatedId;

  const clearObjectUrls = () => {
    objectUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    objectUrlsRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearObjectUrls();
    };
  }, []);

  useEffect(() => {
    if (multiple) {
      return;
    }

    if (!hasLocalPreview) {
      setPreviews(initialPreviewUrl ? [{ url: initialPreviewUrl, name: 'preview', isInitial: true }] : []);
    }
  }, [initialPreviewUrl, multiple, hasLocalPreview]);

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (event) => {
    const files = Array.from(event.target.files ?? []);
    let limitedFiles = files;

    if (maxFiles && files.length > maxFiles) {
      onLimitExceeded?.(maxFiles);
      limitedFiles = files.slice(0, maxFiles);
    }

    clearObjectUrls();

    if (multiple) {
      const newPreviews = limitedFiles.map((file) => {
        const url = URL.createObjectURL(file);
        objectUrlsRef.current.push(url);
        return { url, name: file.name, isInitial: false };
      });
      setPreviews(newPreviews);
    } else {
      const file = limitedFiles[0] ?? null;
      if (file) {
        const url = URL.createObjectURL(file);
        objectUrlsRef.current.push(url);
        setPreviews([{ url, name: file.name, isInitial: false }]);
        setHasLocalPreview(true);
      } else {
        setPreviews(initialPreviewUrl ? [{ url: initialPreviewUrl, name: 'preview', isInitial: true }] : []);
        setHasLocalPreview(false);
      }
    }

    if (multiple) {
      onFilesChange?.(limitedFiles);
    } else {
      onFilesChange?.(limitedFiles[0] ?? null);
    }
  };

  const hasPreviews = previews.length > 0;

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={handleChange}
      />
      <Button type="button" onClick={handleButtonClick} className="self-start">
        {buttonLabel}
      </Button>
      {helperText ? <p className="text-xs text-fg/60">{helperText}</p> : null}
      {multiple ? (
        hasPreviews ? (
          <div className="flex flex-wrap gap-3">
            {previews.map((preview) => (
              <div
                key={`${preview.name}-${preview.url}`}
                className="h-20 w-20 overflow-hidden rounded-2xl border border-white/20 bg-white/5"
              >
                <img src={preview.url} alt={preview.name} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-fg/50">Файлы не выбраны</p>
        )
      ) : hasPreviews ? (
        <div className="h-24 w-24 overflow-hidden rounded-2xl border border-white/20 bg-white/5">
          <img src={previews[0].url} alt={previews[0].name} className="h-full w-full object-cover" />
        </div>
      ) : (
        <p className="text-sm text-fg/50">Файл не выбран</p>
      )}
      {multiple && hasPreviews ? (
        <ul className="text-xs text-fg/60">
          {previews.map((preview) => (
            <li key={`${preview.name}-name`}>{preview.name}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default UploadField;
