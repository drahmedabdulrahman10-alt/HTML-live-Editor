import React, { useState, useEffect } from 'react';
import { X, Sliders, Check } from 'lucide-react';
import { SelectionInfo } from '../types';

interface ElementStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  selection: SelectionInfo | null;
  onApplyStyles: (styles: { [key: string]: string }, className?: string) => void;
}

export const ElementStyleModal: React.FC<ElementStyleModalProps> = ({
  isOpen,
  onClose,
  selection,
  onApplyStyles,
}) => {
  const [margin, setMargin] = useState('');
  const [padding, setPadding] = useState('');
  const [bgColor, setBgColor] = useState('');
  const [textColor, setTextColor] = useState('');
  const [fontSize, setFontSize] = useState('');
  const [borderRadius, setBorderRadius] = useState('');
  const [borderWidth, setBorderWidth] = useState('');
  const [borderColor, setBorderColor] = useState('');
  const [textAlign, setTextAlign] = useState('');
  const [customClasses, setCustomClasses] = useState('');

  useEffect(() => {
    if (selection) {
      setBgColor(selection.computedStyles?.backgroundColor || '');
      setTextColor(selection.computedStyles?.color || '');
      setFontSize(selection.computedStyles?.fontSize || '');
      setTextAlign(selection.computedStyles?.textAlign || '');
      setCustomClasses(selection.className || '');
      setMargin('');
      setPadding('');
      setBorderRadius('');
      setBorderWidth('');
      setBorderColor('');
    }
  }, [selection, isOpen]);

  if (!isOpen || !selection) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const styleObj: { [key: string]: string } = {};

    if (margin.trim()) styleObj.margin = margin.trim();
    if (padding.trim()) styleObj.padding = padding.trim();
    if (bgColor.trim()) styleObj.backgroundColor = bgColor.trim();
    if (textColor.trim()) styleObj.color = textColor.trim();
    if (fontSize.trim()) styleObj.fontSize = fontSize.trim();
    if (textAlign.trim()) styleObj.textAlign = textAlign.trim();
    if (borderRadius.trim()) styleObj.borderRadius = borderRadius.trim();
    if (borderWidth.trim() && borderColor.trim()) {
      styleObj.border = `${borderWidth.trim()} solid ${borderColor.trim()}`;
    } else if (borderWidth.trim()) {
      styleObj.borderWidth = borderWidth.trim();
    } else if (borderColor.trim()) {
      styleObj.borderColor = borderColor.trim();
    }

    onApplyStyles(styleObj, customClasses);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-base">
              Style Inspector: <code className="text-xs font-mono bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded-sm">&lt;{selection.tagName}&gt;</code>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Spacing */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Spacing & Box Model</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Padding (e.g. 16px, 1rem 2rem)</label>
                <input
                  type="text"
                  placeholder="e.g. 16px or 12px 24px"
                  value={padding}
                  onChange={(e) => setPadding(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Margin (e.g. 20px 0, auto)</label>
                <input
                  type="text"
                  placeholder="e.g. 24px 0 or 0 auto"
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Colors & Background</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Background Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor.startsWith('#') ? bgColor : '#ffffff'}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded-md cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    placeholder="#ffffff or transparent"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full px-2.5 py-1 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={textColor.startsWith('#') ? textColor : '#0f172a'}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 rounded-md cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 bg-transparent"
                  />
                  <input
                    type="text"
                    placeholder="#0f172a"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-full px-2.5 py-1 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Borders */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Border & Corners</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Border Width</label>
                <input
                  type="text"
                  placeholder="e.g. 1px, 2px"
                  value={borderWidth}
                  onChange={(e) => setBorderWidth(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Border Color</label>
                <input
                  type="text"
                  placeholder="#e2e8f0"
                  value={borderColor}
                  onChange={(e) => setBorderColor(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Border Radius</label>
                <input
                  type="text"
                  placeholder="e.g. 8px, 16px"
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Typography */}
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Typography & Layout</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Font Size</label>
                <input
                  type="text"
                  placeholder="e.g. 18px, 1.25rem"
                  value={fontSize}
                  onChange={(e) => setFontSize(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">Text Align</label>
                <select
                  value={textAlign}
                  onChange={(e) => setTextAlign(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">(Inherited / Default)</option>
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                  <option value="justify">Justify</option>
                </select>
              </div>
            </div>
          </div>

          {/* CSS Classes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              CSS Class Name(s)
            </label>
            <input
              type="text"
              placeholder="e.g. card hero-banner featured"
              value={customClasses}
              onChange={(e) => setCustomClasses(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
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
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Apply Styles
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
