import React, { useState } from 'react';
import { X, Table as TableIcon } from 'lucide-react';
import { TableOptions } from '../types';

interface TableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (options: TableOptions) => void;
}

export const TableModal: React.FC<TableModalProps> = ({ isOpen, onClose, onInsert }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [headerRow, setHeaderRow] = useState(true);
  const [bordered, setBordered] = useState(true);
  const [striped, setStriped] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInsert({
      rows: Math.max(1, Math.min(20, rows)),
      cols: Math.max(1, Math.min(10, cols)),
      headerRow,
      bordered,
      striped,
    });
    onClose();
  };

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-800 dark:text-slate-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-base">Insert Table</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Rows (1 - 20)
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={rows}
                onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Columns (1 - 10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={cols}
                onChange={(e) => setCols(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Visual Grid Preview */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="text-xs text-slate-500 mb-2 font-medium">Table Preview:</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-300 dark:border-slate-700 text-xs">
                <tbody>
                  {Array.from({ length: Math.min(rows, 4) }).map((_, rIdx) => (
                    <tr key={rIdx} className={rIdx === 0 && headerRow ? 'bg-slate-200 dark:bg-slate-700 font-bold' : (striped && rIdx % 2 === 1 ? 'bg-slate-100 dark:bg-slate-800/80' : '')}>
                      {Array.from({ length: Math.min(cols, 5) }).map((_, cIdx) => (
                        <td key={cIdx} className="border border-slate-300 dark:border-slate-700 p-1.5 text-center text-slate-600 dark:text-slate-300">
                          {rIdx === 0 && headerRow ? `Col ${cIdx + 1}` : `Cell`}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {(rows > 4 || cols > 5) && (
                <div className="text-[11px] text-slate-400 text-center mt-1.5 italic">
                  Showing partial preview of {rows}x{cols} table
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={headerRow}
                onChange={(e) => setHeaderRow(e.target.checked)}
                className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Include Header Row (styled `&lt;th&gt;` row)
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={striped}
                onChange={(e) => setStriped(e.target.checked)}
                className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Alternating Row Backgrounds (Zebra striping)
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={bordered}
                onChange={(e) => setBordered(e.target.checked)}
                className="rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Full Grid Borders
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
              className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition"
            >
              Insert Table
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
