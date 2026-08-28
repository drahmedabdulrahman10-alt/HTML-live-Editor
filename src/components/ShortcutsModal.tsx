import React from 'react';
import { X, Keyboard, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const isMac =
    typeof navigator !== 'undefined' &&
    ((navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
      navigator.userAgent)
      .toLowerCase()
      .includes('mac');
  const modKey = isMac ? '⌘' : 'Ctrl';

  const shortcuts = [
    { label: 'Bold Text', key: `${modKey} + B` },
    { label: 'Italic Text', key: `${modKey} + I` },
    { label: 'Underline Text', key: `${modKey} + U` },
    { label: 'Strikethrough', key: `${modKey} + Shift + X` },
    { label: 'Undo Action', key: `${modKey} + Z` },
    { label: 'Redo Action', key: `${modKey} + Y / ${modKey} + Shift + Z` },
    { label: 'Find & Replace', key: `${modKey} + F` },
    { label: 'Export / Save HTML', key: `${modKey} + S` },
    { label: 'Print Document', key: `${modKey} + P` },
    { label: 'Delete Selected Element', key: 'Backspace / Delete' },
    { label: 'Duplicate Selected', key: `${modKey} + D` },
    { label: 'Deselect Active Node', key: 'Esc' },
    { label: 'Lock Aspect Ratio during Image Resize', key: 'Hold Shift while dragging handle' },
  ];

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-base">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-2">
            {shortcuts.map((sc, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 text-sm"
              >
                <span className="text-slate-600 dark:text-slate-300 font-medium">{sc.label}</span>
                <kbd className="px-2.5 py-1 text-xs font-mono font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md shadow-2xs text-slate-800 dark:text-slate-200">
                  {sc.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
