import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Navbar,
} from './components/Navbar';
import { Toolbar } from './components/Toolbar';
import { Canvas, CanvasHandle } from './components/Canvas';
import { Sidebar } from './components/Sidebar';
import { SourceEditor } from './components/SourceEditor';
import { ImageModal } from './components/ImageModal';
import { TableModal } from './components/TableModal';
import { LinkModal } from './components/LinkModal';
import { ElementStyleModal } from './components/ElementStyleModal';
import { ElementHtmlModal } from './components/ElementHtmlModal';
import { FindReplaceModal } from './components/FindReplaceModal';
import { StatsModal } from './components/StatsModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import {
  DocumentItem,
  ViewMode,
  DevicePreset,
  SelectionInfo,
  ImageAttributes,
  TableOptions,
  LinkAttributes,
  DocumentStats,
  ShortcutAction,
} from './types';
import {
  saveDocument,
  getDocument,
  getAllDocuments,
  deleteDocument,
  clearAllDocuments,
  getActiveDocId,
  setActiveDocId,
  getStoredTheme,
  setStoredTheme,
  calculateStats,
} from './services/storage';
import { TEMPLATES } from './services/templates';
import {
  downloadHtmlFile,
  copyHtmlToClipboard,
  printHtml,
  cleanHtmlForExport,
} from './services/htmlCleaner';

const computeDocumentStats = (html: string): DocumentStats => {
  if (!html) {
    return {
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      paragraphs: 0,
      headings: 0,
      images: 0,
      tables: 0,
      readingTimeMinutes: 0,
    };
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const text = doc.body.textContent || '';
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0);
  const paragraphs = doc.querySelectorAll('p').length;
  const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
  const images = doc.querySelectorAll('img').length;
  const tables = doc.querySelectorAll('table').length;

  return {
    words: words.length,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    paragraphs,
    headings,
    images,
    tables,
    readingTimeMinutes: Math.max(1, Math.ceil(words.length / 200)),
  };
};

export default function App() {
  const canvasRef = useRef<CanvasHandle>(null);

  // App & Document State
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Undo / Redo History Stack
  // Consecutive typing bursts (<600ms apart) coalesce into ONE undo step,
  // mirroring Word/GDocs granularity. Formatting & structural inserts pass
  // kind='bound' so they always become their own undo unit.
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const lastEditTimeRef = useRef<number>(0);
  const lastEditKindRef = useRef<'text' | 'bound'>('text');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Always-current pointer to the active document, so debounced timers and
  // toolbar handlers never operate on stale closures.
  const latestActiveDocRef = useRef<DocumentItem | null>(null);
  useEffect(() => {
    latestActiveDocRef.current = activeDoc;
  }, [activeDoc]);

  // Pending (debounced) save snapshot: captured at schedule time and stored as
  // a complete record so late timer fires can never resurrect stale objects
  // or clobber documents the user has already navigated away from.
  const pendingSaveRef = useRef<DocumentItem | null>(null);

  // Viewport & UX Settings
  const [viewMode, setViewMode] = useState<ViewMode>('page');
  const [devicePreset, setDevicePreset] = useState<DevicePreset>('desktop');
  const [zoom, setZoom] = useState<number>(100);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Selection & Inspector
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(null);

  // Modals
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
  const [isFindReplaceOpen, setIsFindReplaceOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Debounced auto-save timer
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Theme & Documents on Mount.
  // didInitRef guards against React StrictMode double-invocation in dev,
  // which would otherwise seed two default documents into IndexedDB.
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const initialTheme = getStoredTheme();
    setTheme(initialTheme);
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const initDocuments = async () => {
      let docs = await getAllDocuments();

      if (docs.length === 0) {
        // Seed with default templates
        const defaultDoc: DocumentItem = {
          id: 'doc_' + Date.now(),
          title: 'Executive Business Report',
          content: TEMPLATES[1].html,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          wordCount: 0,
          charCount: 0,
          fileSize: 0,
        };
        await saveDocument(defaultDoc);
        docs = [defaultDoc];
      }

      setDocuments(docs);

      const savedActiveId = getActiveDocId();
      const current = docs.find((d) => d.id === savedActiveId) || docs[0];
      setActiveDoc(current);
      setActiveDocId(current.id);

      // Initialize History
      historyRef.current = [current.content];
      historyIndexRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
    };

    initDocuments();
  }, []);

  // Update theme toggle
  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    setStoredTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Debounced Auto-Save (race-condition free)
  //
  // The pending save is snapshotted when scheduled. When the timer fires (or
  // the user switches/deletes documents), the snapshot is flushed verbatim —
  // the callback no longer reads mutable React state, so it can neither
  // resurrect an old document nor save a deleted one, and renaming the title
  // can no longer wipe recently-typed content.
  const setIsSavingLocal = useCallback((v: boolean) => setIsSaving(v), []);

  const flushPendingSave = useCallback(async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    const pending = pendingSaveRef.current;
    if (!pending) return;
    pendingSaveRef.current = null;

    setIsSavingLocal(true);
    const persisted: DocumentItem = { ...pending, updatedAt: Date.now() };
    try {
      await saveDocument(persisted);
      setDocuments((prev) =>
        prev.map((d) => (d.id === persisted.id ? persisted : d))
      );
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setIsSavingLocal(false);
      setHasUnsavedChanges(false);
    }
  }, [setIsSavingLocal]);

  const triggerAutoSave = useCallback((contentToSave: string, newTitle?: string) => {
    setHasUnsavedChanges(true);

    // Snapshot everything the future write needs — no state reads later.
    const docNow = latestActiveDocRef.current;
    if (!docNow) return;
    pendingSaveRef.current = {
      ...docNow,
      title: newTitle ?? docNow.title,
      content: contentToSave,
    };

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      void flushPendingSave();
    }, 1000);
  }, [flushPendingSave]);

  // Content Change Handler from Canvas or Source Editor.
  // editKind: undefined/'text' → coalesceable typing; 'bound' → own undo step.
  const handleContentChange = useCallback(
    (newHtml: string, editKind?: 'text' | 'bound') => {
      if (!activeDoc) return;
      setActiveDoc((prev) => (prev ? { ...prev, content: newHtml } : null));
      pushHistory(newHtml, editKind ?? 'text');
      triggerAutoSave(newHtml);
    },
    [activeDoc, triggerAutoSave]
  );

  // Push state to Undo History (burst-coalescing)
  const pushHistory = (newContent: string, kind: 'text' | 'bound' = 'text') => {
    const hist = historyRef.current;
    const idx = historyIndexRef.current;
    const current = hist[idx];
    if (current === newContent) return;

    const now = Date.now();
    const isBurstContinuation =
      kind === 'text' &&
      lastEditKindRef.current === 'text' &&
      now - lastEditTimeRef.current < 600 &&
      idx === hist.length - 1;

    let newHist: string[];
    if (isBurstContinuation) {
      newHist = hist.slice();
      newHist[idx] = newContent;
    } else {
      newHist = hist.slice(0, idx + 1);
      newHist.push(newContent);
    }

    if (newHist.length > 100) {
      newHist.shift();
    }

    historyRef.current = newHist;
    historyIndexRef.current = newHist.length - 1;
    lastEditTimeRef.current = now;
    lastEditKindRef.current = kind;

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  };

  // Undo Handler — restores a historic snapshot through the normal external-
  // load channel (the Canvas detects the value change and re-syncs safely).
  const handleUndo = useCallback(() => {
    const doc = latestActiveDocRef.current;
    if (historyIndexRef.current > 0 && doc) {
      historyIndexRef.current -= 1;
      const prevContent = historyRef.current[historyIndexRef.current];
      setActiveDoc({ ...doc, content: prevContent });
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(true);
      lastEditTimeRef.current = 0; // next user edit starts a fresh burst
      triggerAutoSave(prevContent);
    }
  }, [triggerAutoSave]);

  // Redo Handler
  const handleRedo = useCallback(() => {
    const doc = latestActiveDocRef.current;
    if (historyIndexRef.current < historyRef.current.length - 1 && doc) {
      historyIndexRef.current += 1;
      const nextContent = historyRef.current[historyIndexRef.current];
      setActiveDoc({ ...doc, content: nextContent });
      setCanUndo(true);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
      lastEditTimeRef.current = 0;
      triggerAutoSave(nextContent);
    }
  }, [triggerAutoSave]);

  // Rename Title Handler — reads the LATEST content so renaming right after
  // typing can never revert content to a stale snapshot.
  const handleTitleChange = (newTitle: string) => {
    const doc = latestActiveDocRef.current;
    if (!doc) return;
    setActiveDoc((prev) => (prev ? { ...prev, title: newTitle } : null));
    triggerAutoSave(doc.content, newTitle);
  };

  // Switch Active Document
  const handleSelectDoc = async (id: string) => {
    await flushPendingSave(); // never lose unsaved work of the previous doc
    const doc = documents.find((d) => d.id === id) || (await getDocument(id));
    if (doc) {
      // Re-seed undo/redo history for THIS document (prevents cross-document
      // undo splice-back). The document itself is loaded through the Canvas
      // echo-gate, so no iframe reload churn occurs for identical content.
      setActiveDoc(doc);
      setActiveDocId(doc.id);
      historyRef.current = [doc.content];
      historyIndexRef.current = 0;
      lastEditTimeRef.current = 0;
      setCanUndo(false);
      setCanRedo(false);
      setHasUnsavedChanges(false);
      setIsSidebarOpen(false);
    }
  };

  // Create New Document
  const handleCreateNewDoc = async (templateId?: string) => {
    await flushPendingSave();
    const tmpl = TEMPLATES.find((t) => t.id === templateId) || TEMPLATES[0];
    const newDoc: DocumentItem = {
      id: 'doc_' + Date.now(),
      title: tmpl.id === 'blank' ? 'Untitled Document' : tmpl.name,
      content: tmpl.html,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      wordCount: 0,
      charCount: 0,
      fileSize: 0,
    };

    await saveDocument(newDoc);
    const updatedList = [newDoc, ...documents];
    setDocuments(updatedList);
    setActiveDoc(newDoc);
    setActiveDocId(newDoc.id);

    historyRef.current = [newDoc.content];
    historyIndexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
    setHasUnsavedChanges(false);
  };

  // Upload HTML File
  const handleUploadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      if (content) {
        await flushPendingSave();
        const title = file.name.replace(/\.[^/.]+$/, '');
        const newDoc: DocumentItem = {
          id: 'doc_' + Date.now(),
          title: title || 'Imported Document',
          content,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          wordCount: 0,
          charCount: 0,
          fileSize: file.size,
        };

        await saveDocument(newDoc);
        setDocuments((prev) => [newDoc, ...prev]);
        setActiveDoc(newDoc);
        setActiveDocId(newDoc.id);

        historyRef.current = [content];
        historyIndexRef.current = 0;
        setCanUndo(false);
        setCanRedo(false);
        setHasUnsavedChanges(false);
        setIsSidebarOpen(false);
      }
    };
    reader.readAsText(file);
  };

  // Duplicate Document
  const handleDuplicateDoc = async (id: string) => {
    const orig = documents.find((d) => d.id === id);
    if (!orig) return;

    const copyDoc: DocumentItem = {
      ...orig,
      id: 'doc_' + Date.now(),
      title: `${orig.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveDocument(copyDoc);
    setDocuments((prev) => [copyDoc, ...prev]);
    setActiveDoc(copyDoc);
    setActiveDocId(copyDoc.id);

    // Re-seed history so undo can never splice the SOURCE document's earlier
    // snapshots into this fresh copy.
    historyRef.current = [copyDoc.content];
    historyIndexRef.current = 0;
    lastEditTimeRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
    setHasUnsavedChanges(false);
  };

  // Delete Document
  const handleDeleteDoc = async (id: string) => {
    // Resolve any pending autosave so a late timer can neither resurrect the
    // deleted document nor race against this removal.
    if (pendingSaveRef.current?.id === id) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
      pendingSaveRef.current = null;
    } else {
      await flushPendingSave();
    }
    await deleteDocument(id);
    const remaining = documents.filter((d) => d.id !== id);
    setDocuments(remaining);

    if (activeDoc?.id === id) {
      if (remaining.length > 0) {
        setActiveDoc(remaining[0]);
        setActiveDocId(remaining[0].id);
      } else {
        handleCreateNewDoc('blank');
      }
    }
  };

  // Clear All Documents
  const handleClearAllData = async () => {
    // Discard (do NOT flush) any pending autosave — everything is going away.
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = null;
    pendingSaveRef.current = null;
    await clearAllDocuments();
    handleCreateNewDoc('blank');
  };

  // Export File
  const handleExportHtml = () => {
    if (!activeDoc) return;
    downloadHtmlFile(activeDoc.content, `${activeDoc.title}.html`);
  };

  // Copy HTML
  const handleCopyHtml = () => {
    if (!activeDoc) return;
    copyHtmlToClipboard(activeDoc.content);
  };

  // Print Document
  const handlePrint = () => {
    if (!activeDoc) return;
    printHtml(activeDoc.content);
  };

  // Calculate detailed stats for the modal — MEMOIZED so the expensive
  // DOMParser pass runs only when content changes, never per render.
  const documentStats = useMemo<DocumentStats>(
    () => computeDocumentStats(activeDoc?.content ?? ''),
    [activeDoc?.content]
  );

  // ---- Global keyboard shortcuts ---------------------------------------
  // This listener covers focus OUTSIDE the iframe (title field, source view).
  // Shortcuts pressed INSIDE the live canvas are forwarded by the Canvas via
  // onShortcut(), because keydown events do not cross frame boundaries.
  const runShortcutAction = useCallback((action: ShortcutAction) => {
    switch (action) {
      case 'export':
        handleExportHtml();
        break;
      case 'find':
        setIsFindReplaceOpen(true);
        break;
      case 'undo':
        handleUndo();
        break;
      case 'redo':
        handleRedo();
        break;
      case 'print':
        handlePrint();
        break;
      case 'duplicate':
        canvasRef.current?.duplicateSelectedElement();
        break;
    }
  }, [handleExportHtml, handleUndo, handleRedo, handlePrint]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();

      if (key === 's') {
        e.preventDefault();
        runShortcutAction('export');
      } else if (key === 'f') {
        e.preventDefault();
        runShortcutAction('find');
      } else if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        runShortcutAction('undo');
      } else if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        runShortcutAction('redo');
      } else if (key === 'p') {
        e.preventDefault();
        runShortcutAction('print');
      } else if (key === 'd' && !e.shiftKey) {
        e.preventDefault();
        runShortcutAction('duplicate');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [runShortcutAction]);

  // ---- Insert flows ------------------------------------------------------
  // beginInsertFlow() snapshots the iframe caret/selection BEFORE focus moves
  // into a modal, so links/images/tables can be inserted exactly where the
  // user was working, and link creation can prefill the selected text.
  const [linkPrefillText, setLinkPrefillText] = useState('');

  // Stable identity so the modal's field-sync effect doesn't re-fire on every
  // App render and wipe what the user typed while the dialog is open.
  const linkInitialData = useMemo(
    () => ({ url: '', text: linkPrefillText, openInNewTab: true }),
    [linkPrefillText]
  );

  const openImageModal = useCallback(() => {
    canvasRef.current?.beginInsertFlow();
    setIsImageModalOpen(true);
  }, []);

  const openTableModal = useCallback(() => {
    canvasRef.current?.beginInsertFlow();
    setIsTableModalOpen(true);
  }, []);

  const openLinkModal = useCallback(() => {
    const ctx = canvasRef.current?.beginInsertFlow();
    setLinkPrefillText(ctx?.selectedText ?? '');
    setIsLinkModalOpen(true);
  }, []);

  if (!activeDoc) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-semibold">Loading HTML Live Editor...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        title={activeDoc.title}
        onTitleChange={handleTitleChange}
        isSaving={isSaving}
        hasUnsavedChanges={hasUnsavedChanges}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        devicePreset={devicePreset}
        onDevicePresetChange={setDevicePreset}
        zoom={zoom}
        onZoomChange={setZoom}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onOpenFindReplace={() => setIsFindReplaceOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onExportHtml={handleExportHtml}
        onCopyHtml={handleCopyHtml}
        onPrint={handlePrint}
      />

      {/* Word-like Ribbon Toolbar */}
      <Toolbar
        selectionInfo={selectionInfo}
        onExecuteCommand={(cmd, val) => canvasRef.current?.executeCommand(cmd, val)}
        onOpenImageModal={openImageModal}
        onOpenTableModal={openTableModal}
        onOpenLinkModal={openLinkModal}
        onInsertCallout={(type) => canvasRef.current?.insertCallout(type)}
        onInsertColumns={(cols) => canvasRef.current?.insertColumns(cols)}
        onInsertButton={() => canvasRef.current?.insertButton()}
        onInsertDivider={() => canvasRef.current?.insertDivider()}
        onInsertSymbol={(sym) => canvasRef.current?.insertSymbol(sym)}
      />

      {/* Main Workspace (Canvas / Split Source) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Drawer */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          documents={documents}
          activeDocId={activeDoc.id}
          onSelectDoc={handleSelectDoc}
          onCreateNewDoc={handleCreateNewDoc}
          onUploadFile={handleUploadFile}
          onDuplicateDoc={handleDuplicateDoc}
          onDeleteDoc={handleDeleteDoc}
          onClearAllData={handleClearAllData}
          onExportDoc={(doc) => downloadHtmlFile(doc.content, `${doc.title}.html`)}
        />

        {/* Visual Editor Canvas */}
        <div className={`h-full flex flex-col transition-all ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
          <Canvas
            ref={canvasRef}
            html={activeDoc.content}
            onChange={handleContentChange}
            viewMode={viewMode}
            devicePreset={devicePreset}
            zoom={zoom}
            onSelectionChange={setSelectionInfo}
            onShortcut={runShortcutAction}
            onOpenStyleModal={() => setIsStyleModalOpen(true)}
            onOpenHtmlModal={() => setIsHtmlModalOpen(true)}
            onUploadImageFile={handleUploadFile}
          />
        </div>

        {/* Live Split HTML Source View */}
        {viewMode === 'split' && (
          <div className="w-1/2 h-full flex flex-col">
            <SourceEditor
              html={activeDoc.content}
              onChange={handleContentChange}
              isSplitMode={true}
            />
          </div>
        )}
      </div>

      {/* Insert / Edit Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        onInsert={(attrs) => canvasRef.current?.insertImage(attrs)}
      />

      {/* Insert Table Modal */}
      <TableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        onInsert={(opts) => canvasRef.current?.insertTable(opts)}
      />

      {/* Insert Hyperlink Modal */}
      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        initialData={linkInitialData}
        onInsert={(attrs) => canvasRef.current?.insertLink(attrs)}
      />

      {/* Element Style Inspector Modal */}
      <ElementStyleModal
        isOpen={isStyleModalOpen}
        onClose={() => setIsStyleModalOpen(false)}
        selection={selectionInfo}
        onApplyStyles={(styles, className) =>
          canvasRef.current?.applyElementStyles(styles, className)
        }
      />

      {/* Element Raw HTML Editor Modal */}
      <ElementHtmlModal
        isOpen={isHtmlModalOpen}
        onClose={() => setIsHtmlModalOpen(false)}
        selection={selectionInfo}
        initialHtml={canvasRef.current?.getSelectedElementHtml() || ''}
        onApplyHtml={(newHtml) => canvasRef.current?.applyElementHtml(newHtml)}
      />

      {/* Find & Replace Modal */}
      <FindReplaceModal
        isOpen={isFindReplaceOpen}
        onClose={() => setIsFindReplaceOpen(false)}
        onFind={(q, mc, fwd) => canvasRef.current?.findText(q, mc, fwd) ?? false}
        onReplace={(q, rep, mc) => canvasRef.current?.replaceText(q, rep, mc) ?? false}
        onReplaceAll={(q, rep, mc) => canvasRef.current?.replaceAllText(q, rep, mc) ?? 0}
      />

      {/* Document Stats Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={documentStats}
        docTitle={activeDoc.title}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
