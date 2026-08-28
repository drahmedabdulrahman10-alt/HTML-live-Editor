import React, { useState, useEffect } from 'react';
import { X, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { LinkAttributes } from '../types';

interface LinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (attributes: LinkAttributes) => void;
  initialData?: LinkAttributes | null;
}

export const LinkModal: React.FC<LinkModalProps> = ({
  isOpen,
  onClose,
  onInsert,
  initialData,
}) => {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [openInNewTab, setOpenInNewTab] = useState(true);

  useEffect(() => {
    if (initialData) {
      setUrl(initialData.url || '');
      setText(initialData.text || '');
      setOpenInNewTab(initialData.openInNewTab ?? true);
    } else {
      setUrl('');
      setText('');
      setOpenInNewTab(true);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl) && !/^mailto:/i.test(finalUrl) && !/^tel:/i.test(finalUrl) && !/^#/i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    onInsert({
      url: finalUrl,
      text: text.trim() || finalUrl,
      openInNewTab,
    });
    onClose();
  };

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-base">
              {initialData?.url ? 'Edit Hyperlink' : 'Insert Hyperlink'}
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
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Display Text
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Learn More"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Target URL / Web Address
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com or #section"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={openInNewTab}
              onChange={(e) => setOpenInNewTab(e.target.checked)}
              className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            Open link in a new browser tab (`target="_blank"`)
          </label>

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
              disabled={!url.trim()}
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition"
            >
              {initialData?.url ? 'Apply Changes' : 'Insert Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
