import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import {
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Sliders,
  Code2,
  Plus,
  Maximize2,
  Move,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { ViewMode, DevicePreset, SelectionInfo, ImageAttributes, ShortcutAction } from '../types';
import { sanitizeHtmlFragment } from '../services/sanitize';

export interface CanvasHandle {
  executeCommand: (command: string, value?: string) => void;
  insertImage: (attributes: ImageAttributes) => void;
  insertTable: (options: { rows: number; cols: number; headerRow: boolean; bordered: boolean; striped: boolean }) => void;
  insertLink: (attributes: { url: string; text: string; openInNewTab: boolean }) => void;
  beginInsertFlow: () => { selectedText: string } | null;
  insertCallout: (type: 'info' | 'success' | 'warning' | 'error') => void;
  insertColumns: (cols: number) => void;
  insertButton: () => void;
  insertDivider: () => void;
  insertSymbol: (symbol: string) => void;
  findText: (query: string, matchCase: boolean, forward: boolean) => boolean;
  replaceText: (query: string, replacement: string, matchCase: boolean) => boolean;
  replaceAllText: (query: string, replacement: string, matchCase: boolean) => number;
  getSelectedElementHtml: () => string;
  applyElementHtml: (newHtml: string) => void;
  applyElementStyles: (styles: { [key: string]: string }, className?: string) => void;
  deleteSelectedElement: () => void;
  duplicateSelectedElement: () => void;
  moveSelectedElement: (direction: 'up' | 'down') => void;
  getSelectedNode: () => HTMLElement | null;
}

export interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface CanvasProps {
  html: string;
  onChange: (newHtml: string, editKind?: 'text' | 'bound') => void;
  viewMode: ViewMode;
  devicePreset: DevicePreset;
  zoom: number;
  onSelectionChange: (info: SelectionInfo | null) => void;
  /** Forwarded keyboard shortcuts originating inside the editable iframe. */
  onShortcut?: (action: ShortcutAction) => void;
  onOpenStyleModal: () => void;
  onOpenHtmlModal: () => void;
  onUploadImageFile: (file: File) => void;
}

/** Legacy <font size=n> values → real pixel sizes (for truthful CSS output).
 *  Index matches the legacy scale used by the font-size dropdown (1..7). */
const FONT_SIZE_PX = [0, 11, 13, 16, 18, 24, 32, 48];
const VOID_SELECTABLE_TAGS = new Set(['IMG', 'HR', 'TABLE', 'VIDEO']);

export const Canvas = forwardRef<CanvasHandle, CanvasProps>(({
  html,
  onChange,
  viewMode,
  devicePreset,
  zoom,
  onSelectionChange,
  onShortcut,
  onOpenStyleModal,
  onOpenHtmlModal,
  onUploadImageFile,
}, ref) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedElement, setSelectedElementState] = useState<HTMLElement | null>(null);
  // Mirror of the selection for use inside long-lived event listeners without
  // re-binding them on every render.
  const selectedElementRef = useRef<HTMLElement | null>(null);
  const [selectedRect, setSelectedRect] = useState<ElementRect | null>(null);
  const [tagPath, setTagPath] = useState<HTMLElement[]>([]);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const initialResizeState = useRef<{ startX: number; startY: number; startW: number; startH: number; aspectRatio: number } | null>(null);

  // ---- Sync engine state -------------------------------------------------
  // The HTML string we last emitted (or loaded). The iframe is REWRITTEN only
  // when the incoming `html` prop genuinely differs from it — meaning it
  // changed behind our back (undo/redo, source view apply, file open, doc
  // switch). Every edit we make ourselves echoes back identical content, so
  // the gate short-circuits those and NEVER destroys the user's caret.
  const lastSyncedHtmlRef = useRef<string>('');
  // Snapshot of caret + selection captured when an insert flow opens (modals
  // steal focus; we must remember WHERE to put the table/image/link).
  const savedInsertRangeRef = useRef<{ range: Range | null; selectedText: string }>({ range: null, selectedText: '' });
  const composingRef = useRef(false);

  // Live props bridge so long-lived iframe listeners always call the freshest
  // callbacks without re-binding.
  const propsRef = useRef({ onChange, onShortcut, onUploadImageFile });
  propsRef.current = { onChange, onShortcut, onUploadImageFile };

  const setSelectedElement = useCallback((el: HTMLElement | null) => {
    selectedElementRef.current = el;
    setSelectedElementState(el);
  }, []);

  // Measure an element living INSIDE the iframe in wrapper-local coordinates
  // for the parent-side selection overlay. Because the overlay is a sibling
  // of the iframe inside the SAME transformed wrapper (page-mode zoom uses a
  // CSS transform on their common parent), raw inner-document client rects
  // align perfectly with overlay pixels — no scale division, no scroll math.
  // Internal scrolling keeps things glued because the scroll listener simply
  // re-measures live rects.
  const measureElementInWrapper = useCallback(
    (el: HTMLElement): ElementRect => {
      const r = el.getBoundingClientRect();
      return { top: r.top, left: r.left, width: r.width, height: r.height };
    },
    []
  );


  /**
   * Serialize the live iframe into the document's source of truth.
   * Internal editor affordances (the injected editing stylesheet) are stripped
   * so persisted/source-view content stays clean; they are re-injected on load.
   */
  const getIframeHtml = useCallback((): string => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return '';
    const doctype = doc.doctype !== null ? '<!DOCTYPE html>\n' : '';
    return doctype + doc.documentElement.outerHTML.replace(
      /<style data-editor-internal(?:="[^"]*")?>[\s\S]*?<\/style>/g,
      ''
    );
  }, []);

  // Emit an internal change to the app. Kind 'bound' marks an atomic op
  // (formatting command / structural insert) so undo history treats it as its
  // own step instead of merging it into the typing burst.
  const commitInternalChange = useCallback((kind: 'text' | 'bound' = 'text') => {
    const currentHtml = getIframeHtml();
    lastSyncedHtmlRef.current = currentHtml; // echo-gate: no reload will fire
    propsRef.current.onChange(currentHtml, kind);
  }, [getIframeHtml]);

  // Update selection state and overlay rect
  const updateSelectionState = useCallback((el: HTMLElement | null) => {
    if (!el || el === el.ownerDocument?.body || el === el.ownerDocument?.documentElement) {
      setSelectedElement(null);
      setSelectedRect(null);
      setTagPath([]);
      onSelectionChange(null);
      return;
    }

    const measured = measureElementInWrapper(el);

    setSelectedElement(el);
    setSelectedRect(measured);

    // Build hierarchy path
    const path: HTMLElement[] = [];
    let curr: HTMLElement | null = el;
    while (curr && curr !== curr.ownerDocument?.body && curr !== curr.ownerDocument?.documentElement) {
      path.unshift(curr);
      curr = curr.parentElement;
    }
    setTagPath(path);

    const computed = el.ownerDocument?.defaultView?.getComputedStyle(el);
    const isImg = el.tagName.toLowerCase() === 'img';
    const isTbl = el.tagName.toLowerCase() === 'table';
    const isCell = el.tagName.toLowerCase() === 'td' || el.tagName.toLowerCase() === 'th';
    const isH = /^H[1-6]$/i.test(el.tagName);
    const isP = el.tagName.toLowerCase() === 'p';
    const isA = el.tagName.toLowerCase() === 'a';
    const isList = el.tagName.toLowerCase() === 'ul' || el.tagName.toLowerCase() === 'ol';

    if (isImg) {
      const img = el as HTMLImageElement;
      setImageDimensions({ width: img.offsetWidth, height: img.offsetHeight });
    } else {
      setImageDimensions(null);
    }

    onSelectionChange({
      tagName: el.tagName.toLowerCase(),
      id: el.id || undefined,
      className: el.className || undefined,
      rect: {
        top: measured.top,
        left: measured.left,
        width: measured.width,
        height: measured.height,
      },
      isImage: isImg,
      isTable: isTbl,
      isTableCell: isCell,
      isHeading: isH,
      isParagraph: isP,
      isLink: isA,
      isList: isList,
      canMoveUp: Boolean(el.previousElementSibling),
      canMoveDown: Boolean(el.nextElementSibling),
      path: path.map(n => n.tagName.toLowerCase() + (n.className ? '.' + n.className.split(' ')[0] : '')),
      computedStyles: {
        color: computed?.color,
        backgroundColor: computed?.backgroundColor,
        fontSize: computed?.fontSize,
        fontFamily: computed?.fontFamily,
        textAlign: computed?.textAlign,
        fontWeight: computed?.fontWeight,
        fontStyle: computed?.fontStyle,
        textDecoration: computed?.textDecoration,
      }
    });
  }, [onSelectionChange, measureElementInWrapper]);


  // ---- Editing event surface ----------------------------------------------
  //
  // Everything below is attached ONCE PER DOCUMENT LOAD (old listeners die
  // together with the previous document when doc.open()/write() runs).
  // Long-lived closures read mutable values exclusively through refs, so no
  // listener ever needs re-binding on React re-renders — that dependency
  // churn was the root cause of the original reload-storm bug.
  const updateSelectionStateRef = useRef(updateSelectionState);
  updateSelectionStateRef.current = updateSelectionState;
  const measureRef = useRef(measureElementInWrapper);
  measureRef.current = measureElementInWrapper;
  const onSelectionInfoRef = useRef(onSelectionChange);
  onSelectionInfoRef.current = onSelectionChange;

  /**
   * Resolve the "selected element" for overlay/inspector purposes:
   *  - void elements (img/hr/table/video) select themselves at any depth;
   *  - text selections select their TOP-LEVEL block (direct body child),
   *    which stays stable while dragging across inline spans/b/i.
   */
  const resolveSelectionElement = (doc: Document): HTMLElement | null => {
    const win = doc.defaultView;
    const sel = win?.getSelection();
    if (!win || !sel || sel.rangeCount === 0) return null;
    // NOTE: collapsed (caret-only) selections still resolve their block, so
    // clicking into a paragraph keeps it selected/inspectable while typing.
    const range = sel.getRangeAt(0);
    let probe: Node | null = range.startContainer;
    if (probe && probe !== doc.documentElement && !doc.documentElement.contains(probe)) {
      return null;
    }
    // For void elements the container may BE the element itself.
    if (probe.nodeType === 1 && VOID_SELECTABLE_TAGS.has((probe as HTMLElement).tagName)) {
      return probe as HTMLElement;
    }

    let el: HTMLElement | null =
      probe.nodeType === 3 ? probe.parentElement : (probe as HTMLElement);
    if (!el || el === doc.body || el === doc.documentElement) return null;
    while (el.parentElement && el.parentElement !== doc.body) {
      if (VOID_SELECTABLE_TAGS.has(el.parentElement.tagName)) return el.parentElement;
      el = el.parentElement;
    }
    return el;
  };

  const attachEditingListeners = useCallback((win: Window, doc: Document) => {
    // Selection tracking → overlay box, inspector, breadcrumbs.
    doc.addEventListener('selectionchange', () => {
      if (composingRef.current) return;
      const el = resolveSelectionElement(doc);
      updateSelectionStateRef.current(el);
      const infoEl = el ?? selectedElementRef.current;
      if (!el && selectedElementRef.current && !VOID_SELECTABLE_TAGS.has(selectedElementRef.current.tagName)) {
        // Text selection dissolved entirely (clicked whitespace) — drop the
        // overlay unless a void element remains explicitly selected.
        setSelectedElement(null);
        setSelectedRect(null);
        setTagPath([]);
      } else if (infoEl) {
        setSelectedRect(measureRef.current(infoEl));
      }
    });

    // Click: pick up void elements (images, tables, rules) which never appear
    // inside a text Range; other clicks resolve via selectionchange.
    doc.addEventListener('mousedown', (e) => {
      const target = e.target as HTMLElement;
      if (target && VOID_SELECTABLE_TAGS.has(target.tagName)) {
        updateSelectionStateRef.current(target);
      }
    });

    // Text edits → snapshot into App state ('text' kind merges bursts so a
    // typing session becomes ONE undo step, Word-style).
    doc.addEventListener('input', (e) => {
      if (composingRef.current || (e as InputEvent).isComposing) return;
      commitInternalChange('text');
      const el = selectedElementRef.current;
      if (el && el.isConnected) setSelectedRect(measureRef.current(el));
    });

    // IME composition (CJK input) must not emit partial commits — wait until
    // the composition finishes before snapshotting.
    doc.addEventListener('compositionstart', () => {
      composingRef.current = true;
    });
    doc.addEventListener('compositionend', () => {
      composingRef.current = false;
      commitInternalChange('text');
    });

    // Paste hygiene: sanitize untrusted markup BEFORE it enters the editable
    // document (kills <script>, inline JS handlers, javascript:/data:text
    // URLs) while preserving legitimate formatting, tables, images, styles.
    doc.addEventListener('paste', (e: ClipboardEvent) => {
      e.preventDefault();
      const cd = e.clipboardData;
      if (!cd) return;
      const htmlPart = cd.getData('text/html');
      const textPart = cd.getData('text/plain');
      try {
        if (htmlPart) {
          doc.execCommand('insertHTML', false, sanitizeHtmlFragment(htmlPart));
        } else if (textPart) {
          // Convert plain-text line breaks so multi-line pastes keep structure.
          const escaped = textPart
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\r?\n/g, '<br>');
          doc.execCommand('insertHTML', false, escaped);
        }
        commitInternalChange('bound');
      } catch {
        // Last resort: browser's own plain-text insertion.
        if (textPart) doc.execCommand('insertText', false, textPart);
      }
    });

    // Keyboard handling:
    //  1. Forward app shortcuts OUT of the iframe (keydown never crosses
    //     frame boundaries otherwise). Intercepting undo here also stops the
    //     iframe's NATIVE undo stack from diverging from our snapshot history.
    //  2. Delete a fully-selected void element (img/hr/table) with Backspace.
    //  3. Escape deselects.
    doc.addEventListener('keydown', (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod) {
        const key = e.key.toLowerCase();
        if (key === 's') { e.preventDefault(); propsRef.current.onShortcut?.('export'); return; }
        if (key === 'f') { e.preventDefault(); propsRef.current.onShortcut?.('find'); return; }
        if (key === 'p') { e.preventDefault(); propsRef.current.onShortcut?.('print'); return; }
        if (key === 'z' && !e.shiftKey) { e.preventDefault(); propsRef.current.onShortcut?.('undo'); return; }
        if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); propsRef.current.onShortcut?.('redo'); return; }
        if (key === 'd') { e.preventDefault(); propsRef.current.onShortcut?.('duplicate'); return; }
      }

      const active = doc.activeElement as HTMLElement | null;
      const selEl = selectedElementRef.current;
      const targetsVoid = !!selEl && VOID_SELECTABLE_TAGS.has(selEl.tagName);
      const hasActiveSel = !!selEl && (active === selEl || selEl.contains(active));
      if ((e.key === 'Delete' || e.key === 'Backspace') && targetsVoid && hasActiveSel && win.getSelection()?.isCollapsed) {
        e.preventDefault();
        const parent = selEl!.parentElement;
        setSelectedElement(null);
        setSelectedRect(null);
        onSelectionInfoRef.current(null);
        selEl!.remove();
        commitInternalChange('bound');
        updateSelectionStateRef.current(parent);
        return;
      }

      if (e.key === 'Escape' && selEl) {
        setSelectedElement(null);
        setSelectedRect(null);
        setTagPath([]);
        onSelectionInfoRef.current(null);
      }
    });

    // Drag-and-drop: image files become embedded data-URL images at the drop
    // caret; .html/.htm files open as new documents via the App layer.
    doc.addEventListener('drop', (e: DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (!ev.target?.result) return;
          const img = doc.createElement('img');
          img.src = ev.target.result as string;
          img.alt = file.name;
          img.style.maxWidth = '100%';
          img.style.borderRadius = '8px';
          img.style.margin = '16px auto';
          img.style.display = 'block';

          const range =
            typeof (doc as Document & { caretRangeFromPoint?: (x: number, y: number) => Range | null }).caretRangeFromPoint === 'function'
              ? (doc as Document & { caretRangeFromPoint: (x: number, y: number) => Range | null }).caretRangeFromPoint(e.clientX, e.clientY)
              : null;
          if (range) {
            range.insertNode(img);
          } else {
            doc.body.appendChild(img);
          }
          updateSelectionStateRef.current(img);
          commitInternalChange('bound');
        };
        reader.readAsDataURL(file);
      } else if (file.name.toLowerCase().endsWith('.html') || file.name.toLowerCase().endsWith('.htm')) {
        propsRef.current.onUploadImageFile(file);
      }
    });
    doc.addEventListener('dragover', (e: DragEvent) => {
      e.preventDefault();
    });

    // Keep the overlay glued to its element while the iframe page scrolls
    // internally (raw client rects would drift out of the wrapper space).
    doc.addEventListener(
      'scroll',
      () => {
        const el = selectedElementRef.current;
        if (el && el.isConnected) setSelectedRect(measureRef.current(el));
      },
      { passive: true }
    );
  }, [commitInternalChange]);

  // ---- Document loading (THE synchronization gate) -------------------------
  useEffect(() => {
    if (html === lastSyncedHtmlRef.current) {
      // This value is exactly what we ourselves emitted (or just loaded).
      // Rewriting would destroy the caret/native selection for zero benefit —
      // this single guard eliminates the original "Preview resets while
      // editing" class of bugs (typing echo, autosave re-render, clicks).
      return;
    }

    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc) return;

    // Genuine external change (file open, doc switch, undo/redo, source apply):
    // reset selection UI and stale insert-flow snapshots.
    setSelectedElement(null);
    setTagPath([]);
    setSelectedRect(null);
    savedInsertRangeRef.current = { range: null, selectedText: '' };
    composingRef.current = false;

    doc.open();
    doc.write(html || '<!DOCTYPE html><html><head><title>Untitled</title></head><body><p>Start writing here...</p></body></html>');
    doc.close();

    lastSyncedHtmlRef.current = html;

    const win = iframe.contentWindow;
    if (!win) return;
    win.document.designMode = 'on';
    if (doc.body) {
      doc.body.contentEditable = 'true';
    }

    // Inject editing styles for carets/outline helpers (stripped again on
    // export by getIframeHtml/cleanHtmlForExport via data-editor-internal).
    let styleTag = doc.querySelector('style[data-editor-internal]');
    if (!styleTag) {
      styleTag = doc.createElement('style');
      styleTag.setAttribute('data-editor-internal', 'true');
      styleTag.textContent = `
        body { outline: none !important; min-height: 100vh; box-sizing: border-box; }
        body:focus { outline: none !important; }
        [contenteditable="true"] { outline: none; }
        img { max-width: 100%; cursor: pointer; }
        table { border-collapse: collapse; }
      `;
      doc.head?.appendChild(styleTag);
    }

    // Empty-document rescue: deleting all content must still leave an
    // editable, focusable paragraph — not an untypeable black hole.
    const bodyEl = doc.body;
    if (
      bodyEl &&
      bodyEl.innerHTML
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<br\s*\/?>/gi, '')
        .trim() === ''
    ) {
      bodyEl.innerHTML += '<p><br></p>';
      const p = bodyEl.querySelector('p:last-of-type');
      if (p) {
        const r = doc.createRange();
        r.setStart(p, 0);
        r.collapse(true);
        const s = win.getSelection();
        s?.removeAllRanges();
        s?.addRange(r);
      }
    }

    attachEditingListeners(win, doc);
  }, [html, attachEditingListeners]);

  // Re-measure the selected element's overlay whenever the visual scale or
  // viewport mode changes (page-mode zoom scales client rects), and keep the
  // caret-space correct on window resizes.
  useEffect(() => {
    const handleMeasure = () => {
      const el = selectedElementRef.current;
      if (el && el.isConnected) setSelectedRect(measureElementInWrapper(el));
    };
    handleMeasure();
    window.addEventListener('resize', handleMeasure);
    return () => window.removeEventListener('resize', handleMeasure);
  }, [zoom, viewMode, devicePreset, measureElementInWrapper]);


  // Image Resize Drag Handler
  const startImageResize = (e: React.MouseEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedElement || selectedElement.tagName.toLowerCase() !== 'img') return;

    const img = selectedElement as HTMLImageElement;
    const startW = img.offsetWidth;
    const startH = img.offsetHeight;

    initialResizeState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW,
      startH,
      aspectRatio: startW / (startH || 1),
    };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!initialResizeState.current) return;
      const { startX, startY, startW, startH, aspectRatio } = initialResizeState.current;
      // Deltas arrive in parent-document space; convert to iframe space using
      // the current page-mode zoom so resizing feels 1:1 at any zoom level.
      const scale = zoom / 100 || 1;
      const deltaX = (moveEvent.clientX - startX) / scale;
      const deltaY = (moveEvent.clientY - startY) / scale;

      let newW = startW;
      let newH = startH;

      if (handle.includes('e')) newW = startW + deltaX;
      if (handle.includes('w')) newW = startW - deltaX;
      if (handle.includes('s')) newH = startH + deltaY;
      if (handle.includes('n')) newH = startH - deltaY;

      // Lock aspect ratio with Shift key or diagonal handles
      if (moveEvent.shiftKey || (handle.length === 2 && !moveEvent.altKey)) {
        if (handle.includes('e') || handle.includes('w')) {
          newH = newW / aspectRatio;
        } else {
          newW = newH * aspectRatio;
        }
      }

      newW = Math.max(30, Math.round(newW));
      newH = Math.max(30, Math.round(newH));

      img.style.width = `${newW}px`;
      img.style.height = `${newH}px`;
      img.width = newW;
      img.height = newH;

      setImageDimensions({ width: newW, height: newH });
      setSelectedRect(measureRef.current(img));
    };

    const onMouseUp = () => {
      initialResizeState.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);

      // Commit the resized image as an atomic undo step, with the echo-gate
      // armed so this emission can never trigger a document reload.
      setSelectedRect(measureRef.current(img));
      commitInternalChange('bound');
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };


  // ---- Imperative API shared plumbing -------------------------------------
  /** Focus the iframe and re-apply a selection snapshot saved by an insert
   *  flow (modals steal DOM focus; this brings the caret back). */
  const restoreSavedSelection = (): boolean => {
    const win = iframeRef.current?.contentWindow;
    const doc = win?.document;
    if (!win || !doc || !doc.body) return false;
    win.focus();
    const sel = win.getSelection();
    if (!sel) return false;

    const liveValid =
      sel.rangeCount > 0 && doc.body.contains(sel.getRangeAt(0).commonAncestorContainer);
    if (liveValid) return true;

    const saved = savedInsertRangeRef.current.range;
    if (saved && doc.body.contains(saved.startContainer)) {
      sel.removeAllRanges();
      sel.addRange(saved.cloneRange());
      return true;
    }
    return false;
  };

  /**
   * Block-level anchor (direct body child) receiving "after-block" structural
   * inserts (tables, callouts, grids…). Derived from the live caret or — when
   * a modal already moved focus away — from the caret snapshotted at the
   * moment the insert flow opened. Falls back to appending at the body end.
   */
  const resolveInsertAnchor = (doc: Document): HTMLElement | null => {
    const sel = doc.defaultView?.getSelection();
    let node: Node | null = null;
    if (sel && sel.rangeCount > 0) node = sel.getRangeAt(0).startContainer;
    if ((!node || !doc.body?.contains(node)) && savedInsertRangeRef.current.range) {
      node = savedInsertRangeRef.current.range.startContainer;
    }
    let el: HTMLElement | null = node
      ? node.nodeType === 3
        ? node.parentElement
        : (node as HTMLElement)
      : null;
    while (el && el.parentElement && el.parentElement !== doc.body) {
      el = el.parentElement;
    }
    return el && el !== doc.body ? el : null;
  };

  const consumeSavedInsertRange = () => {
    savedInsertRangeRef.current = { range: null, selectedText: '' };
  };

  // Shared element operations used by BOTH the floating overlay buttons and
  // the imperative CanvasHandle, so their behaviour can never drift apart
  // (previously they were two divergent copies of the same logic).
  const performMove = useCallback((dir: 'up' | 'down') => {
    const el = selectedElementRef.current;
    if (!el) return;
    if (dir === 'up' && el.previousElementSibling) {
      el.parentElement?.insertBefore(el, el.previousElementSibling);
    } else if (dir === 'down' && el.nextElementSibling) {
      el.parentElement?.insertBefore(el.nextElementSibling, el);
    } else {
      return;
    }
    setSelectedRect(measureRef.current(el));
    commitInternalChange('bound');
  }, [commitInternalChange]);

  const performDuplicate = useCallback(() => {
    const el = selectedElementRef.current;
    if (!el) return;
    const clone = el.cloneNode(true) as HTMLElement;
    el.after(clone);
    updateSelectionStateRef.current(clone);
    commitInternalChange('bound');
  }, [commitInternalChange]);

  const performDelete = useCallback(() => {
    const el = selectedElementRef.current;
    if (!el) return;
    // Clear selection UI BEFORE removal so stale node references can't paint
    // a ghost overlay afterwards.
    setSelectedElement(null);
    setSelectedRect(null);
    setTagPath([]);
    onSelectionInfoRef.current(null);
    el.remove();
    commitInternalChange('bound');
    updateSelectionStateRef.current(null);
  }, [commitInternalChange]);


  // Expose imperative API for toolbar and actions
  useImperativeHandle(ref, () => ({
    executeCommand: (command: string, value?: string) => {
      const doc = iframeRef.current?.contentDocument;
      const win = iframeRef.current?.contentWindow;
      if (!doc || !win) return;

      // Keep the user's selection alive even though clicking the toolbar
      // shifted focus into the parent document.
      restoreSavedSelection();

      if (command === 'fontSize' && value) {
        // Legacy execCommand('fontSize', '1'..'7') emits obsolete <font> tags
        // whose implied sizes don't match our dropdown labels. Apply a real
        // CSS font-size instead so exports match what users were promised.
        const idx = Number(value);
        const px = FONT_SIZE_PX[idx] !== undefined ? FONT_SIZE_PX[idx] : null;
        const cssSize = !Number.isNaN(idx) && px !== null
          ? `${px}px`
          : /[a-z%]/i.test(value)
            ? value
            : `${parseFloat(value) || 16}px`;

        const sel = win.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
          try {
            const range = sel.getRangeAt(0);
            const frag = range.extractContents();
            const span = doc.createElement('span');
            span.style.fontSize = cssSize;
            span.appendChild(frag);
            range.insertNode(span);
            sel.removeAllRanges();
            const r2 = doc.createRange();
            r2.selectNodeContents(span);
            sel.addRange(r2);
          } catch {
            doc.execCommand('fontSize', false, value); // graceful fallback
          }
        }
      } else {
        doc.execCommand(command, false, value || undefined);
      }

      commitInternalChange('bound');
      const el = selectedElementRef.current;
      if (el && el.isConnected) setSelectedRect(measureRef.current(el));
    },


    insertImage: (attrs: ImageAttributes) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;

      // Bring back the caret that opening the modal displaced.
      restoreSavedSelection();

      const img = doc.createElement('img');
      img.src = attrs.src;
      img.alt = attrs.alt;
      if (attrs.width) img.style.width = typeof attrs.width === 'number' ? `${attrs.width}px` : attrs.width;
      if (attrs.borderRadius) img.style.borderRadius = attrs.borderRadius;
      if (attrs.shadow) img.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)';

      if (attrs.align === 'center') {
        img.style.display = 'block';
        img.style.margin = '20px auto';
      } else if (attrs.align === 'float-left') {
        img.style.float = 'left';
        img.style.margin = '0 20px 20px 0';
      } else if (attrs.align === 'float-right') {
        img.style.float = 'right';
        img.style.margin = '0 0 20px 20px';
      } else if (attrs.align === 'right') {
        img.style.display = 'block';
        img.style.marginLeft = 'auto';
        img.style.marginRight = '0';
      }

      // Insert relative to the user's CURRENT caret paragraph, not to whatever
      // element happened to be clicked last.
      const anchor = resolveInsertAnchor(doc);
      if (anchor) {
        anchor.after(img);
      } else {
        doc.body.appendChild(img);
      }

      updateSelectionState(img);
      commitInternalChange('bound');
      consumeSavedInsertRange();
    },

    insertTable: (options) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;

      const table = doc.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.margin = '24px 0';
      table.style.fontSize = '0.95rem';

      if (options.headerRow) {
        const thead = doc.createElement('thead');
        const headerRow = doc.createElement('tr');
        for (let c = 0; c < options.cols; c++) {
          const th = doc.createElement('th');
          th.textContent = `Header ${c + 1}`;
          th.style.padding = '10px 14px';
          th.style.textAlign = 'left';
          th.style.fontWeight = '600';
          th.style.backgroundColor = '#0f172a';
          th.style.color = '#ffffff';
          if (options.bordered) th.style.border = '1px solid #cbd5e1';
          headerRow.appendChild(th);
        }
        thead.appendChild(headerRow);
        table.appendChild(thead);
      }

      const tbody = doc.createElement('tbody');
      for (let r = 0; r < options.rows; r++) {
        const tr = doc.createElement('tr');
        if (options.striped && r % 2 === 1) {
          tr.style.backgroundColor = '#f8fafc';
        }
        for (let c = 0; c < options.cols; c++) {
          const td = doc.createElement('td');
          td.textContent = `Cell ${r + 1},${c + 1}`;
          td.style.padding = '10px 14px';
          if (options.bordered) {
            td.style.border = '1px solid #e2e8f0';
          } else {
            td.style.borderBottom = '1px solid #e2e8f0';
          }
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);

      // Insert relative to the user's CURRENT caret paragraph.
      const anchor = resolveInsertAnchor(doc);
      if (anchor) {
        anchor.after(table);
      } else {
        doc.body.appendChild(table);
      }

      updateSelectionState(table);
      commitInternalChange('bound');
      consumeSavedInsertRange();
    },

    insertLink: (attrs) => {
      const doc = iframeRef.current?.contentDocument;
      const win = iframeRef.current?.contentWindow;
      if (!doc || !win) return;

      // Re-focus and restore whatever the user had selected before the modal
      // opened — links MUST land on the user's text, not at document end.
      restoreSavedSelection();
      const sel = win.getSelection();

      const buildAnchor = () => {
        const a = doc.createElement('a');
        a.href = attrs.url;
        if (attrs.openInNewTab) a.target = '_blank';
        a.rel = 'noopener';
        a.style.color = '#4f46e5';
        a.style.textDecoration = 'underline';
        return a;
      };

      let linked = false;
      if (sel && sel.rangeCount > 0 && !sel.isCollapsed && doc.body.contains(sel.getRangeAt(0).commonAncestorContainer)) {
        try {
          const range = sel.getRangeAt(0);
          // If the user kept the prefilled display text, wrap and PRESERVE
          // inner formatting (bold spans etc.); otherwise replace contents
          // with the edited text (via textContent → injection-safe).
          const selectionUnchanged =
            !savedInsertRangeRef.current.selectedText ||
            savedInsertRangeRef.current.selectedText === attrs.text;

          const a = buildAnchor();
          if (selectionUnchanged) {
            a.appendChild(range.extractContents());
            range.insertNode(a);
          } else {
            a.textContent = attrs.text;
            range.deleteContents();
            range.insertNode(a);
          }
          // Put the caret right after the new link (Word behaviour) so the
          // user can keep typing outside it without accidentally extending it.
          const after = doc.createRange();
          after.setStartAfter(a);
          after.collapse(true);
          sel.removeAllRanges();
          sel.addRange(after);
          linked = true;
        } catch {
          linked = false;
        }
      }

      if (!linked) {
        const a = buildAnchor();
        a.textContent = attrs.text;
        doc.execCommand('insertHTML', false, a.outerHTML);
      }

      commitInternalChange('bound');
      consumeSavedInsertRange();
    },

    /** Snapshot caret/selection BEFORE a modal steals focus, so inserts later
     *  happen exactly where the user was working. Returns selected text so
     *  the Link modal can prefill its Display Text field. */
    beginInsertFlow: () => {
      const win = iframeRef.current?.contentWindow;
      const doc = win?.document;
      const sel = win?.getSelection();
      let range: Range | null = null;
      let selectedText = '';
      if (sel && sel.rangeCount > 0) {
        range = sel.getRangeAt(0).cloneRange();
        selectedText = sel.isCollapsed ? '' : sel.toString();
      }
      savedInsertRangeRef.current = { range, selectedText };
      void doc;
      return { selectedText };
    },

    insertCallout: (type) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;

      const callout = doc.createElement('div');
      callout.style.padding = '16px 20px';
      callout.style.borderRadius = '8px';
      callout.style.margin = '20px 0';
      callout.style.borderLeft = '4px solid';

      if (type === 'info') {
        callout.style.backgroundColor = '#eff6ff';
        callout.style.borderLeftColor = '#3b82f6';
        callout.style.color = '#1e40af';
        callout.innerHTML = '<strong>Note:</strong> Here is an important piece of information for the reader.';
      } else if (type === 'success') {
        callout.style.backgroundColor = '#f0fdf4';
        callout.style.borderLeftColor = '#22c55e';
        callout.style.color = '#166534';
        callout.innerHTML = '<strong>Success:</strong> The action or deployment has completed successfully.';
      } else if (type === 'warning') {
        callout.style.backgroundColor = '#fffbeb';
        callout.style.borderLeftColor = '#f59e0b';
        callout.style.color = '#92400e';
        callout.innerHTML = '<strong>Warning:</strong> Please double-check the configuration before proceeding.';
      } else {
        callout.style.backgroundColor = '#fef2f2';
        callout.style.borderLeftColor = '#ef4444';
        callout.style.color = '#991b1b';
        callout.innerHTML = '<strong>Important:</strong> Critical attention is required for this step.';
      }

      // Insert relative to the user's CURRENT caret paragraph.
      const anchor = resolveInsertAnchor(doc);
      if (anchor) {
        anchor.after(callout);
      } else {
        doc.body.appendChild(callout);
      }

      updateSelectionState(callout);
      commitInternalChange('bound');
      consumeSavedInsertRange();
    },

    insertColumns: (cols) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;

      const grid = doc.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      grid.style.gap = '20px';
      grid.style.margin = '24px 0';

      for (let i = 0; i < cols; i++) {
        const col = doc.createElement('div');
        col.style.padding = '16px';
        col.style.backgroundColor = '#f8fafc';
        col.style.borderRadius = '8px';
        col.style.border = '1px solid #e2e8f0';
        col.innerHTML = `<h4>Column ${i + 1}</h4><p>Add your column content, cards, or metrics here.</p>`;
        grid.appendChild(col);
      }

      // Insert relative to the user's CURRENT caret paragraph.
      const anchor = resolveInsertAnchor(doc);
      if (anchor) {
        anchor.after(grid);
      } else {
        doc.body.appendChild(grid);
      }

      updateSelectionState(grid);
      commitInternalChange('bound');
      consumeSavedInsertRange();
    },

    insertButton: () => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;

      const btn = doc.createElement('a');
      btn.href = '#';
      btn.textContent = 'Get Started Now →';
      btn.style.display = 'inline-block';
      btn.style.backgroundColor = '#4f46e5';
      btn.style.color = '#ffffff';
      btn.style.padding = '12px 24px';
      btn.style.borderRadius = '6px';
      btn.style.fontWeight = '600';
      btn.style.textDecoration = 'none';
      btn.style.margin = '16px 0';

      // Insert relative to the user's CURRENT caret paragraph.
      const anchor = resolveInsertAnchor(doc);
      if (anchor) {
        anchor.after(btn);
      } else {
        doc.body.appendChild(btn);
      }

      updateSelectionState(btn);
      commitInternalChange('bound');
      consumeSavedInsertRange();
    },

    insertDivider: () => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      restoreSavedSelection();
      doc.execCommand('insertHorizontalRule');
      commitInternalChange('bound');
    },

    insertSymbol: (symbol: string) => {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      restoreSavedSelection();
      doc.execCommand('insertText', false, symbol);
      commitInternalChange('bound');
    },

    findText: (query, matchCase, forward) => {
      const win = iframeRef.current?.contentWindow;
      if (!win) return false;
      return win.find(query, matchCase, !forward, true, false, false, false);
    },

    replaceText: (query, replacement, matchCase) => {
      const win = iframeRef.current?.contentWindow;
      const doc = win?.document;
      if (!win || !doc) return false;

      const sel = win.getSelection();
      if (sel && sel.toString()) {
        const text = sel.toString();
        const matches = matchCase ? text === query : text.toLowerCase() === query.toLowerCase();
        if (matches) {
          doc.execCommand('insertText', false, replacement);
          commitInternalChange('bound');
          win.find(query, matchCase, false, true, false, false, false);
          return true;
        }
      }
      return win.find(query, matchCase, false, true, false, false, false);
    },

    replaceAllText: (query, replacement, matchCase) => {
      const win = iframeRef.current?.contentWindow;
      const doc = win?.document;
      if (!win || !doc) return 0;

      let count = 0;
      // Reset selection to start
      win.getSelection()?.collapse(doc.body, 0);

      // Hard iteration cap. With wrap-around enabled this loop can otherwise
      // rematch its OWN insertions when the replacement contains the query
      // (e.g. "a" → "ab" used to hang the tab forever).
      const MAX_REPLACEMENTS = 10000;
      while (count < MAX_REPLACEMENTS && win.find(query, matchCase, false, count === 0, false, false, false)) {
        doc.execCommand('insertText', false, replacement);
        count++;
      }
      if (count >= MAX_REPLACEMENTS) {
        console.warn('[Canvas] replaceAllText hit the safety cap.');
      }

      if (count > 0) {
        commitInternalChange('bound');
      }
      return count;
    },

    getSelectedElementHtml: () => {
      return selectedElementRef.current?.outerHTML || '';
    },

    applyElementHtml: (newHtml: string) => {
      const el = selectedElementRef.current;
      if (!el) return;
      const temp = document.createElement('div');
      // Even in the raw-HTML editor we never allow script execution vectors.
      temp.innerHTML = sanitizeHtmlFragment(newHtml);
      const newEl = temp.firstElementChild as HTMLElement | null;
      if (newEl) {
        el.replaceWith(newEl);
        setSelectedElement(newEl);
        setSelectedRect(measureRef.current(newEl));
        commitInternalChange('bound');
      }
    },

    applyElementStyles: (styles, className) => {
      const el = selectedElementRef.current;
      if (!el) return;
      Object.assign(el.style, styles);
      if (className !== undefined) {
        el.className = className;
      }
      setSelectedRect(measureRef.current(el));
      commitInternalChange('bound');
    },

    deleteSelectedElement: () => {
      performDelete();
    },

    duplicateSelectedElement: () => {
      performDuplicate();
    },

    moveSelectedElement: (dir) => {
      performMove(dir);
    },

    getSelectedNode: () => selectedElementRef.current,
  }));

  // Determine viewport width style
  const getContainerWidthStyle = () => {
    if (viewMode === 'page') {
      return 'w-[816px] min-h-[1056px] shadow-2xl bg-white my-8 rounded-sm';
    }
    if (viewMode === 'web') {
      if (devicePreset === 'mobile') return 'w-[375px] min-h-[667px] shadow-2xl bg-white my-6 rounded-2xl border-8 border-slate-800';
      if (devicePreset === 'tablet') return 'w-[768px] min-h-[1024px] shadow-2xl bg-white my-6 rounded-xl border-4 border-slate-800';
      return 'w-full max-w-[1280px] h-full shadow-lg bg-white my-4 rounded-lg';
    }
    // Split View
    return 'w-full h-full bg-white';
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full h-full bg-slate-200/70 dark:bg-slate-950 flex flex-col overflow-hidden relative"
    >
      {/* Scrollable Canvas Area */}
      <div className="flex-1 overflow-auto flex justify-center items-start p-4 relative">
        <div
          className={`transition-all duration-200 origin-top flex flex-col relative ${getContainerWidthStyle()}`}
          style={{
            transform: viewMode === 'page' ? `scale(${zoom / 100})` : undefined,
          }}
        >
          {/* Scripts deliberately EXCLUDED from the sandbox: untrusted
              documents can never execute JS against our origin (the sandbox
              would otherwise be void with allow-same-origin + allow-scripts). */}
          <iframe
            ref={iframeRef}
            title="HTML Live Canvas"
            className="w-full flex-1 border-none rounded-inherit min-h-[850px]"
            sandbox="allow-same-origin"
          />

          {/* Element Selection Highlight Overlay & Floating Actions */}
          {selectedRect && selectedElement && (
            <div
              className="absolute pointer-events-none transition-all duration-75 border-2 border-indigo-600 rounded-sm z-30"
              style={{
                top: `${selectedRect.top}px`,
                left: `${selectedRect.left}px`,
                width: `${selectedRect.width}px`,
                height: `${selectedRect.height}px`,
              }}
            >
              {/* Tag Name Badge & Dimensions */}
              <div className="absolute -top-7 left-0 pointer-events-auto flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-mono font-semibold px-2 py-0.5 rounded-t-md shadow-md">
                <span>&lt;{selectedElement.tagName.toLowerCase()}&gt;</span>
                {imageDimensions && (
                  <span className="text-indigo-200 font-sans ml-1 text-[9px]">
                    {imageDimensions.width} × {imageDimensions.height}
                  </span>
                )}
              </div>

              {/* Floating Contextual Action Bar */}
              <div className="absolute -top-9 right-0 pointer-events-auto flex items-center gap-0.5 bg-slate-900/90 backdrop-blur-xs text-white p-1 rounded-lg shadow-xl border border-slate-700 animate-in fade-in duration-100">
                <button
                  type="button"
                  title="Move Up"
                  disabled={!selectedElement.previousElementSibling}
                  onClick={() => performMove('up')}
                  className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300 hover:text-white"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  title="Move Down"
                  disabled={!selectedElement.nextElementSibling}
                  onClick={() => performMove('down')}
                  className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300 hover:text-white"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

                <button
                  type="button"
                  title="Inspect & Edit Styles"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenStyleModal();
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-indigo-400"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  title="Edit Raw HTML of this element"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenHtmlModal();
                  }}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-emerald-400"
                >
                  <Code2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  title="Duplicate element"
                  onClick={() => performDuplicate()}
                  className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  title="Delete element"
                  onClick={() => performDelete()}
                  className="p-1 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Image Resize Handles (If selected element is an image) */}
              {selectedElement.tagName.toLowerCase() === 'img' && (
                <>
                  <div
                    onMouseDown={(e) => startImageResize(e, 'nw')}
                    className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nwse-resize pointer-events-auto shadow-sm"
                  />
                  <div
                    onMouseDown={(e) => startImageResize(e, 'n')}
                    className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-ns-resize pointer-events-auto shadow-sm"
                  />
                  <div
                    onMouseDown={(e) => startImageResize(e, 'ne')}
                    className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nesw-resize pointer-events-auto shadow-sm"
                  />
                  <div
                    onMouseDown={(e) => startImageResize(e, 'e')}
                    className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-ew-resize pointer-events-auto shadow-sm"
                  />
                  <div
                    onMouseDown={(e) => startImageResize(e, 'se')}
                    className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nwse-resize pointer-events-auto shadow-sm"
                  />
                  <div
                    onMouseDown={(e) => startImageResize(e, 's')}
                    className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-ns-resize pointer-events-auto shadow-sm"
                  />
                  <div
                    onMouseDown={(e) => startImageResize(e, 'sw')}
                    className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nesw-resize pointer-events-auto shadow-sm"
                  />
                  <div
                    onMouseDown={(e) => startImageResize(e, 'w')}
                    className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-ew-resize pointer-events-auto shadow-sm"
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb Hierarchy Bottom Bar */}
      <div className="h-7 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 flex items-center gap-1.5 text-xs text-slate-500 shrink-0 select-none overflow-x-auto">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Path:</span>
        <button
          onClick={() => updateSelectionState(iframeRef.current?.contentDocument?.body || null)}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 font-mono text-[11px]"
        >
          body
        </button>

        {tagPath.map((node, index) => (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <button
              onClick={() => updateSelectionState(node)}
              className={`font-mono text-[11px] px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                node === selectedElement
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              {node.tagName.toLowerCase()}
              {node.className ? `.${node.className.split(' ')[0]}` : ''}
            </button>
          </React.Fragment>
        ))}

        {tagPath.length === 0 && (
          <span className="text-[11px] text-slate-400 italic">Click on any text or element to inspect</span>
        )}
      </div>
    </div>
  );
});

Canvas.displayName = 'Canvas';
