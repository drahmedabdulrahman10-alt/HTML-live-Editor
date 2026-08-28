import React, { useState, useEffect } from 'react';
import { X, Upload, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { ImageAttributes } from '../types';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (props: ImageAttributes) => void;
  initialData?: ImageAttributes | null;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialData,
}) => {
  const [src, setSrc] = useState('');
  const [alt, setAlt] = useState('');
  const [width, setWidth] = useState<string>('100%');
  const [align, setAlign] = useState<'left' | 'center' | 'right' | 'float-left' | 'float-right'>('center');
  const [borderRadius, setBorderRadius] = useState('8px');
  const [shadow, setShadow] = useState(false);
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    if (initialData) {
      setSrc(initialData.src || '');
      setAlt(initialData.alt || '');
      setWidth(initialData.width ? String(initialData.width) : '100%');
      setAlign(initialData.align || 'center');
      setBorderRadius(initialData.borderRadius || '8px');
      setShadow(Boolean(initialData.shadow));
    } else {
      setSrc('');
      setAlt('');
      setWidth('100%');
      setAlign('center');
      setBorderRadius('8px');
      setShadow(false);
    }
    setPreviewError(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setSrc(ev.target.result as string);
          if (!alt) {
            setAlt(file.name.replace(/\.[^/.]+$/, ''));
          }
          setPreviewError(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!src.trim()) return;

    onInsert({
      src: src.trim(),
      alt: alt.trim() || 'Image',
      width: width || undefined,
      align,
      borderRadius,
      shadow,
    });
    onClose();
  };

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-base">
              {initialData ? 'Edit Image Properties' : 'Insert Image'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4 mb-2">
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={`pb-2 text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${
                tab === 'upload'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <Upload className="w-4 h-4" /> Upload from Device
            </button>
            <button
              type="button"
              onClick={() => setTab('url')}
              className={`pb-2 text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${
                tab === 'url'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              <LinkIcon className="w-4 h-4" /> Image URL
            </button>
          </div>

          {tab === 'upload' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Choose Image File
              </label>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  {src.startsWith('data:') ? 'Image selected (Click to replace)' : 'Click or drop image file here'}
                </span>
                <span className="text-xs text-slate-400 mt-1">PNG, JPG, SVG, WebP, GIF (Stored locally in document)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Web Image URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={src}
                onChange={(e) => {
                  setSrc(e.target.value);
                  setPreviewError(false);
                }}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {src && !previewError && (
            <div className="p-2 border border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50 dark:bg-slate-900/40 flex justify-center items-center max-h-40 overflow-hidden">
              <img
                src={src}
                alt="Preview"
                onError={() => setPreviewError(true)}
                className="max-h-36 max-w-full object-contain rounded-md"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Alt Text (Description)
              </label>
              <input
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Brief description"
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Default Width
              </label>
              <select
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="100%">Full Width (100%)</option>
                <option value="75%">Large (75%)</option>
                <option value="50%">Medium (50%)</option>
                <option value="300px">Fixed 300px</option>
                <option value="450px">Fixed 450px</option>
                <option value="auto">Auto / Original Size</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Layout / Alignment
              </label>
              <select
                value={align}
                onChange={(e) => setAlign(e.target.value as any)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="center">Centered Block</option>
                <option value="left">Left Aligned</option>
                <option value="right">Right Aligned</option>
                <option value="float-left">Float Left (Text wraps right)</option>
                <option value="float-right">Float Right (Text wraps left)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                Corner Radius
              </label>
              <select
                value={borderRadius}
                onChange={(e) => setBorderRadius(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="0px">Sharp Corners (0px)</option>
                <option value="6px">Subtle (6px)</option>
                <option value="12px">Rounded (12px)</option>
                <option value="24px">Extra Rounded (24px)</option>
                <option value="9999px">Pill / Circle</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="img-shadow"
              checked={shadow}
              onChange={(e) => setShadow(e.target.checked)}
              className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="img-shadow" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              Add soft drop shadow
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!src.trim()}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition"
            >
              {initialData ? 'Update Image' : 'Insert Image'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
