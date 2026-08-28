import React from 'react';
import { X, BarChart3, FileText, Type, Clock, Image as ImageIcon, Table as TableIcon, Hash } from 'lucide-react';
import { DocumentStats } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DocumentStats;
  docTitle: string;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  docTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-base">Document Statistics</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="text-xs font-medium text-slate-500 truncate mb-2">
            Document: <strong className="text-slate-800 dark:text-slate-200">{docTitle}</strong>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-md">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Words</div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {stats.words.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-md">
                <Type className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Characters</div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {stats.characters.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-md">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Reading Time</div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  ~{stats.readingTimeMinutes} min
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center gap-3">
              <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-md">
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">Paragraphs</div>
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {stats.paragraphs.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5 text-slate-400" /> Embedded Images:</span>
              <strong className="text-slate-800 dark:text-slate-200">{stats.images}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5"><TableIcon className="w-3.5 h-3.5 text-slate-400" /> Tables:</span>
              <strong className="text-slate-800 dark:text-slate-200">{stats.tables}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span>Characters (without spaces):</span>
              <strong className="text-slate-800 dark:text-slate-200">{stats.charactersNoSpaces.toLocaleString()}</strong>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
