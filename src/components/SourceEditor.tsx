import React, { useState, useEffect, useRef } from 'react';
import { FileCode, Check, Copy, Sparkles, RefreshCw, X } from 'lucide-react';
import { formatHtml } from '../services/htmlCleaner';

interface SourceEditorProps {
  html: string;
  onChange: (newHtml: string) => void;
  isSplitMode?: boolean;
  onClose?: () => void;
}

export const SourceEditor: React.FC<SourceEditorProps> = ({
  html,
  onChange,
  isSplitMode = false,
  onClose,
}) => {
  const [code, setCode] = useState(html);
  const [copied, setCopied] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Echo-gate: changes WE emit come back through `html` and must not be
  // re-imported into the textarea (the old unconditional effect clobbered the
  // user's mid-typing caret in split mode — the serialization round-trip also
  // re-indents everything, which made continuous editing impossible).
  const lastEmittedRef = useRef(html);

  useEffect(() => {
    if (html === lastEmittedRef.current) return;
    setCode(html);
    setIsDirty(false);
    lastEmittedRef.current = html;
  }, [html]);

  // Emit upstream AND record what we sent so our own echo is ignored above.
  const emit = (value: string) => {
    lastEmittedRef.current = value;
    onChange(value);
    setIsDirty(false);
  };

  const handleFormat = () => {
    const formatted = formatHtml(code);
    setCode(formatted);
    emit(formatted);
  };

  const handleApply = () => {
    emit(code);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 ${
        isSplitMode
          ? 'h-full w-full border-l border-slate-800'
          : 'h-[80vh] w-full rounded-xl overflow-hidden border border-slate-800'
      }`}
    >
      {/* Editor Header */}
      <div className="h-10 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 text-xs">
        <div className="flex items-center gap-2 font-mono text-emerald-400">
          <FileCode className="w-4 h-4" />
          <span>HTML Source Code</span>
          {isDirty && (
            <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
              Unapplied edits
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFormat}
            title="Beautify / Format HTML"
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Format
          </button>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy Source Code"
            className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>

          {isDirty && (
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded text-[11px] transition"
            >
              <Check className="w-3 h-3" />
              Apply to Live
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Code Textarea with subtle monospace styling */}
      <div className="flex-1 relative overflow-hidden flex">
        <textarea
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setIsDirty(true);
            // Split mode does NOT propagate per keystroke anymore: the canvas
            // round-trip would rewrite this textarea under the user's fingers.
            // Changes flow upward through "Apply to Live" / Format / blur.
          }}
          onBlur={() => {
            if (isDirty && !isSplitMode) {
              emit(code);
            }
          }}
          className="w-full h-full p-4 font-mono text-xs leading-relaxed bg-slate-950 text-slate-200 resize-none focus:outline-hidden focus:ring-1 focus:ring-indigo-500 overflow-y-auto selection:bg-indigo-900 selection:text-white"
          spellCheck={false}
          placeholder="Paste or write HTML markup here..."
        />
      </div>
    </div>
  );
};
