import React, { useState } from 'react';
import { X, Search, Replace, ArrowDown, ArrowUp } from 'lucide-react';

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFind: (query: string, matchCase: boolean, forward: boolean) => boolean;
  onReplace: (query: string, replacement: string, matchCase: boolean) => boolean;
  onReplaceAll: (query: string, replacement: string, matchCase: boolean) => number;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  isOpen,
  onClose,
  onFind,
  onReplace,
  onReplaceAll,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFindNext = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!findText.trim()) return;
    const found = onFind(findText, matchCase, true);
    if (!found) {
      setStatusMessage('No matches found.');
    } else {
      setStatusMessage('Found next match.');
    }
  };

  const handleFindPrev = () => {
    if (!findText.trim()) return;
    const found = onFind(findText, matchCase, false);
    if (!found) {
      setStatusMessage('No matches found.');
    } else {
      setStatusMessage('Found previous match.');
    }
  };

  const handleReplace = () => {
    if (!findText.trim()) return;
    const replaced = onReplace(findText, replaceText, matchCase);
    if (replaced) {
      setStatusMessage('Replaced match.');
    } else {
      setStatusMessage('No match selected to replace.');
    }
  };

  const handleReplaceAll = () => {
    if (!findText.trim()) return;
    const count = onReplaceAll(findText, replaceText, matchCase);
    setStatusMessage(`Replaced ${count} occurrence${count === 1 ? '' : 's'}.`);
  };

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-base">Find & Replace</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Find text
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={findText}
                onChange={(e) => {
                  setFindText(e.target.value);
                  setStatusMessage(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFindNext();
                  }
                }}
                placeholder="Search phrase..."
                className="w-full pl-3.5 pr-20 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                <button
                  type="button"
                  title="Find Previous"
                  onClick={handleFindPrev}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  title="Find Next"
                  onClick={() => handleFindNext()}
                  className="p-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Replace with
            </label>
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replacement text..."
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={matchCase}
                onChange={(e) => setMatchCase(e.target.checked)}
                className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Match case exactly
            </label>

            {statusMessage && (
              <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                {statusMessage}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleFindNext()}
              disabled={!findText.trim()}
              className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg transition text-center"
            >
              Find Next
            </button>
            <button
              type="button"
              onClick={handleReplace}
              disabled={!findText.trim()}
              className="px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg transition text-center flex items-center justify-center gap-1"
            >
              <Replace className="w-3.5 h-3.5" /> Replace
            </button>
            <button
              type="button"
              onClick={handleReplaceAll}
              disabled={!findText.trim()}
              className="px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition text-center"
            >
              Replace All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
