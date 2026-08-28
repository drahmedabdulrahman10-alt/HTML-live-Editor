import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Image as ImageIcon,
  Table as TableIcon,
  Link as LinkIcon,
  Minus,
  RemoveFormatting,
  Palette,
  Highlighter,
  ChevronDown,
  Columns,
  Sparkles,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  Bookmark,
  Plus
} from 'lucide-react';
import { SelectionInfo } from '../types';

interface ToolbarProps {
  selectionInfo: SelectionInfo | null;
  onExecuteCommand: (command: string, value?: string) => void;
  onOpenImageModal: () => void;
  onOpenTableModal: () => void;
  onOpenLinkModal: () => void;
  onInsertCallout: (type: 'info' | 'success' | 'warning' | 'error') => void;
  onInsertColumns: (cols: number) => void;
  onInsertButton: () => void;
  onInsertDivider: () => void;
  onInsertSymbol: (symbol: string) => void;
}

const FONT_FAMILIES = [
  { name: 'System Sans-Serif', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  { name: 'Georgia (Serif)', value: 'Georgia, Cambria, "Times New Roman", Times, serif' },
  { name: 'Garamond (Serif)', value: '"EB Garamond", Garamond, "Times New Roman", serif' },
  { name: 'Monospace / Code', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' },
  { name: 'Arial (Clean Sans)', value: 'Arial, Helvetica, sans-serif' },
  { name: 'Verdana (Wide Sans)', value: 'Verdana, Geneva, sans-serif' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", "Lucida Sans Unicode", sans-serif' },
  { name: 'Courier New', value: '"Courier New", Courier, monospace' },
];

const FONT_SIZES = [
  { label: '11px (Tiny)', value: '1' },
  { label: '13px (Small)', value: '2' },
  { label: '16px (Normal)', value: '3' },
  { label: '18px (Medium)', value: '4' },
  { label: '24px (Large)', value: '5' },
  { label: '32px (X-Large)', value: '6' },
  { label: '48px (Huge)', value: '7' },
];

const QUICK_COLORS = [
  '#000000', '#1e293b', '#475569', '#dc2626', '#ea580c',
  '#d97706', '#16a34a', '#0284c7', '#4f46e5', '#9333ea',
  '#db2777', '#ffffff'
];

const QUICK_HIGHLIGHTS = [
  'transparent', '#fef08a', '#bbf7d0', '#bae6fd', '#fbcfe8',
  '#fed7aa', '#e9d5ff', '#f1f5f9'
];

const SYMBOLS = ['©', '®', '™', '—', '–', '•', '✓', '★', '→', '←', '↑', '↓', '€', '£', '¥', '₹', '°', '±', '≠', '≈', '§', '¶'];

export const Toolbar: React.FC<ToolbarProps> = ({
  selectionInfo,
  onExecuteCommand,
  onOpenImageModal,
  onOpenTableModal,
  onOpenLinkModal,
  onInsertCallout,
  onInsertColumns,
  onInsertButton,
  onInsertDivider,
  onInsertSymbol,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showHeadingsDropdown, setShowHeadingsDropdown] = useState(false);
  const [showInsertDropdown, setShowInsertDropdown] = useState(false);
  const [showSymbolDropdown, setShowSymbolDropdown] = useState(false);
  const [customTextColor, setCustomTextColor] = useState('#1e293b');
  const [customHighlightColor, setCustomHighlightColor] = useState('#fef08a');

  const colorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const insertRef = useRef<HTMLDivElement>(null);
  const symbolRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
      if (highlightRef.current && !highlightRef.current.contains(e.target as Node)) {
        setShowHighlightPicker(false);
      }
      if (headingRef.current && !headingRef.current.contains(e.target as Node)) {
        setShowHeadingsDropdown(false);
      }
      if (insertRef.current && !insertRef.current.contains(e.target as Node)) {
        setShowInsertDropdown(false);
      }
      if (symbolRef.current && !symbolRef.current.contains(e.target as Node)) {
        setShowSymbolDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getHeadingLabel = () => {
    if (!selectionInfo) return 'Normal Text';
    const tag = selectionInfo.tagName.toLowerCase();
    switch (tag) {
      case 'h1': return 'Heading 1';
      case 'h2': return 'Heading 2';
      case 'h3': return 'Heading 3';
      case 'h4': return 'Heading 4';
      case 'blockquote': return 'Blockquote';
      case 'pre': return 'Code Block';
      default: return 'Normal Text';
    }
  };

  // Preserve the user's text selection across toolbar interactions.
  //
  // The browser's default mousedown moves DOM focus into whichever <button>
  // was pressed, which dissolves the editable document's visual caret and
  // makes formatting commands no-op on "nothing". Preventing that default on
  // any button (delegated from the toolbar root — includes every dropdown
  // item and color swatch) keeps the iframe selection alive; native <select>
  // dropdowns are exempt so they still open.
  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') && !target.closest('select')) {
      e.preventDefault();
    }
  };

  return (
    <div
      onMouseDown={handleToolbarMouseDown}
      className="bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center flex-wrap gap-1 z-20 shrink-0 text-slate-700 dark:text-slate-200 overflow-x-auto shadow-2xs"
    >
      {/* Font Family Dropdown */}
      <select
        onChange={(e) => {
          if (e.target.value) {
            onExecuteCommand('fontName', e.target.value);
          }
        }}
        className="text-xs py-1 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden max-w-[125px] sm:max-w-[140px] cursor-pointer"
        defaultValue=""
      >
        <option value="" disabled>Font Family</option>
        {FONT_FAMILIES.map((f, i) => (
          <option key={i} value={f.value}>{f.name}</option>
        ))}
      </select>

      {/* Font Size Dropdown */}
      <select
        onChange={(e) => {
          if (e.target.value) {
            onExecuteCommand('fontSize', e.target.value);
          }
        }}
        className="text-xs py-1 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden cursor-pointer"
        defaultValue="3"
      >
        {FONT_SIZES.map((s, i) => (
          <option key={i} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Paragraph / Heading Selector */}
      <div className="relative" ref={headingRef}>
        <button
          type="button"
          onClick={() => setShowHeadingsDropdown(!showHeadingsDropdown)}
          className="flex items-center gap-1 text-xs py-1 px-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <span className="truncate max-w-[85px] sm:max-w-[100px] font-medium">{getHeadingLabel()}</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {showHeadingsDropdown && (
          <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={() => {
                onExecuteCommand('formatBlock', '<p>');
                setShowHeadingsDropdown(false);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition flex items-center justify-between"
            >
              <span>Normal Paragraph</span>
              <span className="text-[10px] text-slate-400 font-mono">&lt;p&gt;</span>
            </button>
            <button
              onClick={() => {
                onExecuteCommand('formatBlock', '<h1>');
                setShowHeadingsDropdown(false);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition font-bold text-sm flex items-center justify-between"
            >
              <span>Heading 1</span>
              <span className="text-[10px] text-slate-400 font-mono">&lt;h1&gt;</span>
            </button>
            <button
              onClick={() => {
                onExecuteCommand('formatBlock', '<h2>');
                setShowHeadingsDropdown(false);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition font-bold flex items-center justify-between"
            >
              <span>Heading 2</span>
              <span className="text-[10px] text-slate-400 font-mono">&lt;h2&gt;</span>
            </button>
            <button
              onClick={() => {
                onExecuteCommand('formatBlock', '<h3>');
                setShowHeadingsDropdown(false);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition font-semibold flex items-center justify-between"
            >
              <span>Heading 3</span>
              <span className="text-[10px] text-slate-400 font-mono">&lt;h3&gt;</span>
            </button>
            <button
              onClick={() => {
                onExecuteCommand('formatBlock', '<h4>');
                setShowHeadingsDropdown(false);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition font-semibold flex items-center justify-between"
            >
              <span>Heading 4</span>
              <span className="text-[10px] text-slate-400 font-mono">&lt;h4&gt;</span>
            </button>
            <button
              onClick={() => {
                onExecuteCommand('formatBlock', '<blockquote>');
                setShowHeadingsDropdown(false);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition italic flex items-center justify-between"
            >
              <span>Blockquote</span>
              <span className="text-[10px] text-slate-400 font-mono">&lt;quote&gt;</span>
            </button>
            <button
              onClick={() => {
                onExecuteCommand('formatBlock', '<pre>');
                setShowHeadingsDropdown(false);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition font-mono flex items-center justify-between"
            >
              <span>Code Block</span>
              <span className="text-[10px] text-slate-400 font-mono">&lt;pre&gt;</span>
            </button>
          </div>
        )}
      </div>

      <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* Bold, Italic, Underline, Strikethrough */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onExecuteCommand('bold')}
          title="Bold (Ctrl+B)"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('italic')}
          title="Italic (Ctrl+I)"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('underline')}
          title="Underline (Ctrl+U)"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('strikeThrough')}
          title="Strikethrough"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
      </div>

      {/* Subscript / Superscript */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onExecuteCommand('subscript')}
          title="Subscript"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200 hidden sm:block"
        >
          <Subscript className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('superscript')}
          title="Superscript"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200 hidden sm:block"
        >
          <Superscript className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* Text Color Picker */}
      <div className="relative" ref={colorRef}>
        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          title="Text Color"
          className="flex items-center gap-0.5 p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
        >
          <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
        </button>

        {showColorPicker && (
          <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-3 z-50 text-xs animate-in fade-in duration-100">
            <div className="text-[11px] font-semibold text-slate-500 mb-2">Text Color</div>
            <div className="grid grid-cols-6 gap-1.5 mb-2">
              {QUICK_COLORS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onExecuteCommand('foreColor', c);
                    setShowColorPicker(false);
                  }}
                  style={{ backgroundColor: c }}
                  className="w-5 h-5 rounded-sm border border-slate-300 dark:border-slate-700 hover:scale-110 transition"
                />
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <input
                type="color"
                value={customTextColor}
                onChange={(e) => {
                  setCustomTextColor(e.target.value);
                  onExecuteCommand('foreColor', e.target.value);
                }}
                className="w-6 h-6 rounded cursor-pointer border border-slate-300 p-0 bg-transparent"
              />
              <span className="text-[11px] text-slate-500">Custom hex</span>
            </div>
          </div>
        )}
      </div>

      {/* Highlight Color Picker */}
      <div className="relative" ref={highlightRef}>
        <button
          type="button"
          onClick={() => setShowHighlightPicker(!showHighlightPicker)}
          title="Highlight Background Color"
          className="flex items-center gap-0.5 p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
        >
          <Highlighter className="w-4 h-4 text-amber-500" />
          <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
        </button>

        {showHighlightPicker && (
          <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-3 z-50 text-xs animate-in fade-in duration-100">
            <div className="text-[11px] font-semibold text-slate-500 mb-2">Highlight Color</div>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {QUICK_HIGHLIGHTS.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onExecuteCommand('hiliteColor', c);
                    setShowHighlightPicker(false);
                  }}
                  style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                  className="w-8 h-6 rounded-sm border border-slate-300 dark:border-slate-700 hover:scale-105 transition flex items-center justify-center text-[10px] text-slate-600"
                >
                  {c === 'transparent' ? 'None' : ''}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Clear Formatting */}
      <button
        type="button"
        onClick={() => onExecuteCommand('removeFormat')}
        title="Clear Formatting"
        className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
      >
        <RemoveFormatting className="w-4 h-4" />
      </button>

      <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* Alignments */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onExecuteCommand('justifyLeft')}
          title="Align Left"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('justifyCenter')}
          title="Align Center"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('justifyRight')}
          title="Align Right"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('justifyFull')}
          title="Justify"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200 hidden sm:block"
        >
          <AlignJustify className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* Lists */}
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onExecuteCommand('insertUnorderedList')}
          title="Bulleted List"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('insertOrderedList')}
          title="Numbered List"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onExecuteCommand('formatBlock', '<blockquote>')}
          title="Quote Block"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200 hidden sm:block"
        >
          <Quote className="w-4 h-4" />
        </button>
      </div>

      <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5" />

      {/* Direct Insert Buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onOpenImageModal}
          title="Insert Image (Upload or URL)"
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition"
        >
          <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
          <span className="hidden md:inline">Image</span>
        </button>

        <button
          type="button"
          onClick={onOpenTableModal}
          title="Insert Table"
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition"
        >
          <TableIcon className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden md:inline">Table</span>
        </button>

        <button
          type="button"
          onClick={onOpenLinkModal}
          title="Insert Hyperlink"
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 transition"
        >
          <LinkIcon className="w-3.5 h-3.5 text-sky-500" />
          <span className="hidden md:inline">Link</span>
        </button>
      </div>

      {/* Insert Snippets Dropdown (Callouts, CTA Button, Columns, Divider) */}
      <div className="relative" ref={insertRef}>
        <button
          type="button"
          onClick={() => setShowInsertDropdown(!showInsertDropdown)}
          title="Insert Blocks & Elements"
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-md hover:bg-indigo-100 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Insert Block</span>
          <ChevronDown className="w-3 h-3" />
        </button>

        {showInsertDropdown && (
          <div className="absolute left-0 mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Callout Alert Boxes
            </div>
            <button
              onClick={() => {
                onInsertCallout('info');
                setShowInsertDropdown(false);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center gap-2"
            >
              <span>ℹ️ Info Callout Box</span>
            </button>
            <button
              onClick={() => {
                onInsertCallout('success');
                setShowInsertDropdown(false);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center gap-2"
            >
              <span>✅ Success Callout Box</span>
            </button>
            <button
              onClick={() => {
                onInsertCallout('warning');
                setShowInsertDropdown(false);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-amber-50 dark:hover:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center gap-2"
            >
              <span>⚠️ Warning Callout Box</span>
            </button>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

            <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Layout & Interactive
            </div>
            <button
              onClick={() => {
                onInsertColumns(2);
                setShowInsertDropdown(false);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 flex items-center gap-2"
            >
              <Columns className="w-3.5 h-3.5 text-indigo-500" />
              <span>2-Column Layout Grid</span>
            </button>
            <button
              onClick={() => {
                onInsertColumns(3);
                setShowInsertDropdown(false);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 flex items-center gap-2"
            >
              <Columns className="w-3.5 h-3.5 text-indigo-500" />
              <span>3-Column Layout Grid</span>
            </button>
            <button
              onClick={() => {
                onInsertButton();
                setShowInsertDropdown(false);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Styled Action Button (CTA)</span>
            </button>
            <button
              onClick={() => {
                onInsertDivider();
                setShowInsertDropdown(false);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 flex items-center gap-2"
            >
              <Minus className="w-3.5 h-3.5 text-slate-400" />
              <span>Horizontal Divider Rule</span>
            </button>
          </div>
        )}
      </div>

      {/* Special Symbols Picker */}
      <div className="relative hidden md:block" ref={symbolRef}>
        <button
          type="button"
          onClick={() => setShowSymbolDropdown(!showSymbolDropdown)}
          title="Insert Special Symbol"
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200 text-xs font-semibold"
        >
          &Omega;
        </button>

        {showSymbolDropdown && (
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl p-2.5 z-50 text-xs animate-in fade-in duration-100">
            <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Insert Symbol</div>
            <div className="grid grid-cols-6 gap-1">
              {SYMBOLS.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onInsertSymbol(s);
                    setShowSymbolDropdown(false);
                  }}
                  className="w-6 h-6 flex items-center justify-center font-semibold text-sm rounded bg-slate-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950 hover:text-indigo-600 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
