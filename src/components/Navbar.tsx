import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Download,
  Copy,
  Printer,
  Undo2,
  Redo2,
  Sun,
  Moon,
  Search,
  BarChart3,
  Keyboard,
  FileCode,
  Layout,
  Smartphone,
  Tablet,
  Monitor,
  Check,
  ChevronDown,
  Sparkles,
  FileText,
  Eye,
  Columns
} from 'lucide-react';
import { ViewMode, DevicePreset } from '../types';

interface NavbarProps {
  title: string;
  onTitleChange: (newTitle: string) => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  devicePreset: DevicePreset;
  onDevicePresetChange: (device: DevicePreset) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onOpenFindReplace: () => void;
  onOpenStats: () => void;
  onOpenShortcuts: () => void;
  onExportHtml: () => void;
  onCopyHtml: () => void;
  onPrint: () => void;
  onFormatCode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  onTitleChange,
  isSaving,
  hasUnsavedChanges,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  viewMode,
  onViewModeChange,
  devicePreset,
  onDevicePresetChange,
  zoom,
  onZoomChange,
  theme,
  onToggleTheme,
  onToggleSidebar,
  isSidebarOpen,
  onOpenFindReplace,
  onOpenStats,
  onOpenShortcuts,
  onExportHtml,
  onCopyHtml,
  onPrint,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempTitle(title);
  }, [title]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && e.target instanceof Node && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      onTitleChange(tempTitle.trim());
    } else {
      setTempTitle(title);
    }
    setIsEditingTitle(false);
  };

  const handleCopyClick = () => {
    onCopyHtml();
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
    setShowExportMenu(false);
  };

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3 md:px-4 z-30 shrink-0 select-none">
      {/* Left Section: Sidebar Toggle & Editable Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Close Documents Library' : 'Open Documents Library'}
          className={`p-2 rounded-lg transition ${
            isSidebarOpen
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-lg text-white shadow-xs hidden sm:flex">
            <FileCode className="w-4 h-4" />
          </div>

          <div className="flex flex-col min-w-0">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTitleSubmit();
                  if (e.key === 'Escape') {
                    setTempTitle(title);
                    setIsEditingTitle(false);
                  }
                }}
                className="text-sm font-semibold px-2 py-0.5 rounded border border-indigo-500 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-hidden"
              />
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                title="Click to rename document"
                className="flex items-center gap-1.5 cursor-pointer group"
              >
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[130px] sm:max-w-[220px] md:max-w-[280px]">
                  {title}
                </span>
                <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition">
                  ✎
                </span>
              </div>
            )}

            {/* Auto-save status */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              {isSaving ? (
                <span className="flex items-center gap-1 text-amber-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                  Saving...
                </span>
              ) : hasUnsavedChanges ? (
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  Unsaved changes
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Saved locally
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Center Section: View Mode Switcher & Responsive Presets */}
      <div className="hidden lg:flex items-center gap-2 bg-slate-100 dark:bg-slate-800/70 p-1 rounded-lg border border-slate-200/80 dark:border-slate-800">
        <button
          onClick={() => onViewModeChange('page')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition ${
            viewMode === 'page'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Print & Document Page Mode (Realistic A4 / Letter format)"
        >
          <FileText className="w-3.5 h-3.5" />
          Page Mode
        </button>

        <button
          onClick={() => onViewModeChange('web')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition ${
            viewMode === 'web'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Fluid Web View Mode"
        >
          <Layout className="w-3.5 h-3.5" />
          Web View
        </button>

        <button
          onClick={() => onViewModeChange('split')}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition ${
            viewMode === 'split'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
          title="Split View: Visual Editor & Live HTML Source"
        >
          <Columns className="w-3.5 h-3.5" />
          Split Source
        </button>

        {viewMode === 'web' && (
          <div className="flex items-center pl-2 ml-1 border-l border-slate-200 dark:border-slate-700 gap-1">
            <button
              onClick={() => onDevicePresetChange('desktop')}
              title="Desktop View (1200px)"
              className={`p-1 rounded ${devicePreset === 'desktop' ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDevicePresetChange('tablet')}
              title="Tablet View (768px)"
              className={`p-1 rounded ${devicePreset === 'tablet' ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDevicePresetChange('mobile')}
              title="Mobile View (375px)"
              className={`p-1 rounded ${devicePreset === 'mobile' ? 'text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-2xs' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Right Section: Actions, History, Search, Export & Theme */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-0.5 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Find & Replace */}
        <button
          onClick={onOpenFindReplace}
          title="Find & Replace (Ctrl+F)"
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Document Stats */}
        <button
          onClick={onOpenStats}
          title="Document Statistics"
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition hidden sm:block"
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        {/* Shortcuts */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts"
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition hidden md:block"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          id="navbar-theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'الوضع النهاري / Switch to Light Mode' : 'الوضع الليلي / Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
          className="p-2 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition active:scale-95 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700 dark:text-slate-200" />}
        </button>

        {/* Export / Download Menu */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1.5 z-50 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                File Export Options
              </div>

              <button
                onClick={() => {
                  onExportHtml();
                  setShowExportMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-indigo-500" />
                <div>
                  <div className="font-semibold">Download .html File</div>
                  <div className="text-[11px] text-slate-400">Self-contained file with full CSS styles</div>
                </div>
              </button>

              <button
                onClick={handleCopyClick}
                className="w-full px-3 py-2 text-left text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2 transition"
              >
                {copiedToast ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 text-emerald-500" />
                )}
                <div>
                  <div className="font-semibold">{copiedToast ? 'HTML Copied!' : 'Copy Clean HTML'}</div>
                  <div className="text-[11px] text-slate-400">Copy markup to clipboard</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onPrint();
                  setShowExportMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-2 transition"
              >
                <Printer className="w-4 h-4 text-blue-500" />
                <div>
                  <div className="font-semibold">Print / Save as PDF</div>
                  <div className="text-[11px] text-slate-400">Browser print dialog</div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
