import React, { useState, useEffect } from 'react';
import { X, Code2, Check } from 'lucide-react';
import { SelectionInfo } from '../types';

interface ElementHtmlModalProps {
  isOpen: boolean;
  onClose: () => void;
  selection: SelectionInfo | null;
  initialHtml: string;
  onApplyHtml: (newHtml: string) => void;
}

export const ElementHtmlModal: React.FC<ElementHtmlModalProps> = ({
  isOpen,
  onClose,
  selection,
  initialHtml,
  onApplyHtml,
}) => {
  const [htmlCode, setHtmlCode] = useState('');

  useEffect(() => {
    if (initialHtml) {
      setHtmlCode(initialHtml);
    }
  }, [initialHtml, isOpen]);

  if (!isOpen || !selection) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApplyHtml(htmlCode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-base">
              Edit Element HTML: <code className="text-xs font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-sm">&lt;{selection.tagName}&gt;</code>
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
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Directly edit the HTML markup, attributes, and child nodes of this selected element:
          </p>

          <textarea
            value={htmlCode}
            onChange={(e) => setHtmlCode(e.target.value)}
            rows={12}
            className="w-full p-3 font-mono text-xs leading-relaxed rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-950 text-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-inner"
            spellCheck={false}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Replace HTML
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
