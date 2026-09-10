import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RotateCw,
  Move,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sliders,
  Code2,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
} from 'lucide-react';
import { ViewMode } from '../types';

export interface ImageTransformerProps {
  imageElement: HTMLImageElement;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  zoom: number;
  viewMode: ViewMode;
  onTransformStart: () => void;
  onTransformEnd: () => void;
  onUpdate: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onOpenStyleModal: () => void;
  onOpenHtmlModal: () => void;
  onMoveElement: (dir: 'up' | 'down') => void;
}

type HandleType = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface TransformState {
  type: 'resize' | 'rotate' | 'drag';
  handle?: HandleType;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  aspectRatio: number;
  startRotation: number;
  centerX: number;
  centerY: number;
  isProportional: boolean;
  dropTargetElement?: HTMLElement | null;
  dropPosition?: 'before' | 'after';
}

/**
 * Extract rotation angle in degrees from element inline styles or computed transform matrix.
 */
function getElementRotation(el: HTMLElement): number {
  const transform = el.style.transform || '';
  const match = transform.match(/rotate\(\s*(-?[\d.]+)deg\s*\)/i);
  if (match) {
    let deg = parseFloat(match[1]);
    deg = ((Math.round(deg) % 360) + 360) % 360;
    if (deg > 180) deg -= 360;
    return deg;
  }

  const win = el.ownerDocument?.defaultView;
  if (win) {
    const computed = win.getComputedStyle(el).transform;
    if (computed && computed !== 'none') {
      const parts = computed.split('(')[1]?.split(')')[0]?.split(',');
      if (parts && parts.length >= 2) {
        const a = parseFloat(parts[0]);
        const b = parseFloat(parts[1]);
        let deg = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        deg = ((deg % 360) + 360) % 360;
        if (deg > 180) deg -= 360;
        return deg;
      }
    }
  }
  return 0;
}

export const ImageTransformer: React.FC<ImageTransformerProps> = ({
  imageElement,
  iframeRef,
  zoom,
  onTransformStart,
  onTransformEnd,
  onUpdate,
  onDelete,
  onDuplicate,
  onOpenStyleModal,
  onOpenHtmlModal,
  onMoveElement,
}) => {
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: imageElement.offsetWidth || 100,
    height: imageElement.offsetHeight || 100,
  });
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [activeTransform, setActiveTransform] = useState<'resize' | 'rotate' | 'drag' | null>(null);
  const [activeRotationDegrees, setActiveRotationDegrees] = useState<number | null>(null);
  const [isSnappingActive, setIsSnappingActive] = useState<boolean>(false);

  const transformStateRef = useRef<TransformState | null>(null);
  const dropIndicatorRef = useRef<HTMLElement | null>(null);

  // Sync state with DOM element
  const syncFromElement = useCallback(() => {
    if (!imageElement || !imageElement.isConnected) return;
    const r = imageElement.getBoundingClientRect();
    const w = imageElement.offsetWidth || r.width;
    const h = imageElement.offsetHeight || r.height;
    const rot = getElementRotation(imageElement);

    const centerX = r.left + r.width / 2;
    const centerY = r.top + r.height / 2;

    setDimensions({ width: Math.round(w), height: Math.round(h) });
    setPosition({
      left: Math.round(centerX - w / 2),
      top: Math.round(centerY - h / 2),
    });
    setRotation(rot);
  }, [imageElement]);

  useEffect(() => {
    syncFromElement();

    // Prevent native drag ghosting on the image
    imageElement.setAttribute('draggable', 'false');

    const handleScrollOrResize = () => syncFromElement();
    const win = imageElement.ownerDocument?.defaultView;
    win?.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      win?.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [imageElement, syncFromElement]);

  // Safe removal of drop indicator inside iframe
  const removeDropIndicator = useCallback(() => {
    if (dropIndicatorRef.current && dropIndicatorRef.current.parentNode) {
      dropIndicatorRef.current.remove();
    }
    dropIndicatorRef.current = null;
  }, []);

  // Isolate contenteditable while dragging/resizing/rotating
  const lockContentEditable = useCallback(() => {
    const doc = imageElement.ownerDocument;
    if (doc?.body) {
      doc.body.contentEditable = 'false';
    }
    onTransformStart();
  }, [imageElement, onTransformStart]);

  const unlockContentEditable = useCallback(() => {
    const doc = imageElement.ownerDocument;
    if (doc?.body) {
      doc.body.contentEditable = 'true';
    }
    removeDropIndicator();
    onTransformEnd();
  }, [imageElement, onTransformEnd, removeDropIndicator]);

  // -------------------------------------------------------------
  // Pointer Event Handlers: Resizing
  // -------------------------------------------------------------
  const handleResizePointerDown = (e: React.PointerEvent, handle: HandleType) => {
    e.preventDefault();
    e.stopPropagation();

    lockContentEditable();
    setActiveTransform('resize');

    const startW = imageElement.offsetWidth || dimensions.width;
    const startH = imageElement.offsetHeight || dimensions.height;
    const r = imageElement.getBoundingClientRect();
    const iframeRect = iframeRef.current?.getBoundingClientRect();
    const scale = zoom / 100 || 1;

    const centerX = (iframeRect?.left ?? 0) + (r.left + r.width / 2) * scale;
    const centerY = (iframeRect?.top ?? 0) + (r.top + r.height / 2) * scale;

    const isCorner = ['nw', 'ne', 'se', 'sw'].includes(handle);
    const isProportional = isCorner ? !e.shiftKey : e.shiftKey;

    transformStateRef.current = {
      type: 'resize',
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startW,
      startH,
      aspectRatio: startW / (startH || 1),
      startRotation: rotation,
      centerX,
      centerY,
      isProportional,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const state = transformStateRef.current;
      if (!state || state.type !== 'resize' || !state.handle) return;

      const deltaScreenX = (moveEvent.clientX - state.startX) / scale;
      const deltaScreenY = (moveEvent.clientY - state.startY) / scale;

      // Rotate delta vector into image's local unrotated coordinate space
      const rad = (state.startRotation * Math.PI) / 180;
      const cos = Math.cos(-rad);
      const sin = Math.sin(-rad);
      const localDx = deltaScreenX * cos - deltaScreenY * sin;
      const localDy = deltaScreenX * sin + deltaScreenY * cos;

      let newW = state.startW;
      let newH = state.startH;

      const isCornerHandle = ['nw', 'ne', 'se', 'sw'].includes(state.handle);
      // Corner handles scale proportionally by default; allow free scaling when holding Shift
      const proportional = isCornerHandle ? !moveEvent.shiftKey : moveEvent.shiftKey;

      if (state.handle.includes('e')) newW = state.startW + localDx;
      if (state.handle.includes('w')) newW = state.startW - localDx;
      if (state.handle.includes('s')) newH = state.startH + localDy;
      if (state.handle.includes('n')) newH = state.startH - localDy;

      if (proportional) {
        if (state.handle === 'e' || state.handle === 'w') {
          newH = newW / state.aspectRatio;
        } else if (state.handle === 'n' || state.handle === 's') {
          newW = newH * state.aspectRatio;
        } else {
          // Corner: determine dominant direction
          if (Math.abs(localDx) > Math.abs(localDy)) {
            newH = newW / state.aspectRatio;
          } else {
            newW = newH * state.aspectRatio;
          }
        }
      }

      // Enforce min 20px constraint (prevent collapsing or negative flip)
      newW = Math.max(20, Math.round(newW));
      newH = Math.max(20, Math.round(newH));

      // Apply directly to element inline style and attributes
      imageElement.style.width = `${newW}px`;
      imageElement.style.height = `${newH}px`;
      imageElement.width = newW;
      imageElement.height = newH;

      setDimensions({ width: newW, height: newH });
      syncFromElement();
      onUpdate();
    };

    const handlePointerUp = () => {
      transformStateRef.current = null;
      setActiveTransform(null);

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      const win = imageElement.ownerDocument?.defaultView;
      win?.removeEventListener('pointermove', handlePointerMove);
      win?.removeEventListener('pointerup', handlePointerUp);

      syncFromElement();
      unlockContentEditable();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    const win = imageElement.ownerDocument?.defaultView;
    win?.addEventListener('pointermove', handlePointerMove);
    win?.addEventListener('pointerup', handlePointerUp);
  };

  // -------------------------------------------------------------
  // Pointer Event Handlers: Rotation
  // -------------------------------------------------------------
  const handleRotatePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    lockContentEditable();
    setActiveTransform('rotate');

    const r = imageElement.getBoundingClientRect();
    const iframeRect = iframeRef.current?.getBoundingClientRect();
    const scale = zoom / 100 || 1;

    // Center of image in client coordinates
    const centerX = (iframeRect?.left ?? 0) + (r.left + r.width / 2) * scale;
    const centerY = (iframeRect?.top ?? 0) + (r.top + r.height / 2) * scale;

    transformStateRef.current = {
      type: 'rotate',
      startX: e.clientX,
      startY: e.clientY,
      startW: dimensions.width,
      startH: dimensions.height,
      aspectRatio: 1,
      startRotation: rotation,
      centerX,
      centerY,
      isProportional: false,
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const state = transformStateRef.current;
      if (!state || state.type !== 'rotate') return;

      const pointerX = moveEvent.clientX;
      const pointerY = moveEvent.clientY;

      // Handle extends above top-center (at -90° from center)
      const rad = Math.atan2(pointerY - state.centerY, pointerX - state.centerX);
      let deg = rad * (180 / Math.PI) + 90;

      // Normalize to -180..180 or 0..360
      deg = ((deg % 360) + 360) % 360;
      if (deg > 180) deg -= 360;

      // Holding Shift snaps to 15-degree increments
      const snap = moveEvent.shiftKey;
      setIsSnappingActive(snap);
      if (snap) {
        deg = Math.round(deg / 15) * 15;
      } else {
        deg = Math.round(deg);
      }

      setActiveRotationDegrees(deg);
      setRotation(deg);

      // Store rotation cleanly as `transform: rotate(Xdeg);` in inline styles
      if (deg === 0 || deg === 360) {
        imageElement.style.transform = '';
      } else {
        imageElement.style.transform = `rotate(${deg}deg)`;
      }

      syncFromElement();
      onUpdate();
    };

    const handlePointerUp = () => {
      transformStateRef.current = null;
      setActiveTransform(null);
      setActiveRotationDegrees(null);
      setIsSnappingActive(false);

      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      const win = imageElement.ownerDocument?.defaultView;
      win?.removeEventListener('pointermove', handlePointerMove);
      win?.removeEventListener('pointerup', handlePointerUp);

      syncFromElement();
      unlockContentEditable();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    const win = imageElement.ownerDocument?.defaultView;
    win?.addEventListener('pointermove', handlePointerMove);
    win?.addEventListener('pointerup', handlePointerUp);
  };

  // -------------------------------------------------------------
  // Pointer Event Handlers: Dragging & DOM Repositioning
  // -------------------------------------------------------------
  const handleDragPointerDown = (e: React.PointerEvent) => {
    // Only trigger drag if clicked on the bounding box body (not handle or toolbar)
    if ((e.target as HTMLElement).closest('.action-toolbar') || (e.target as HTMLElement).closest('.resize-handle')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    lockContentEditable();

    const startX = e.clientX;
    const startY = e.clientY;
    let hasMoved = false;

    const doc = imageElement.ownerDocument;
    const scale = zoom / 100 || 1;

    // Create or get visual drop indicator inside the iframe
    const getOrCreateDropIndicator = (): HTMLElement => {
      if (dropIndicatorRef.current && dropIndicatorRef.current.isConnected) {
        return dropIndicatorRef.current;
      }
      const indicator = doc.createElement('div');
      indicator.setAttribute('data-editor-drop-indicator', 'true');
      indicator.style.height = '4px';
      indicator.style.backgroundColor = '#4f46e5';
      indicator.style.borderRadius = '2px';
      indicator.style.margin = '8px 0';
      indicator.style.boxShadow = '0 0 10px rgba(79, 70, 229, 0.7)';
      indicator.style.pointerEvents = 'none';
      indicator.style.transition = 'all 0.1s ease';
      dropIndicatorRef.current = indicator;
      return indicator;
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dist = Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY);
      if (!hasMoved && dist > 4) {
        hasMoved = true;
        setActiveTransform('drag');
      }

      if (!hasMoved) return;

      const iframeRect = iframeRef.current?.getBoundingClientRect();
      if (!iframeRect) return;

      // Pointer coordinates relative to iframe document
      const docX = (moveEvent.clientX - iframeRect.left) / scale;
      const docY = (moveEvent.clientY - iframeRect.top) / scale;

      // Locate element under pointer inside iframe
      const elementUnder = doc.elementFromPoint(docX, docY) as HTMLElement | null;

      if (!elementUnder || elementUnder === imageElement || imageElement.contains(elementUnder)) {
        return;
      }

      // Find nearest suitable block element (paragraph, heading, blockquote, div, section, etc.)
      let blockTarget: HTMLElement | null = elementUnder;
      while (
        blockTarget &&
        blockTarget.parentElement &&
        blockTarget.parentElement !== doc.body &&
        !['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'blockquote', 'section', 'article', 'li', 'figure'].includes(
          blockTarget.tagName.toLowerCase()
        )
      ) {
        blockTarget = blockTarget.parentElement;
      }

      if (blockTarget && blockTarget !== doc.body && blockTarget !== doc.documentElement && blockTarget !== imageElement) {
        const targetRect = blockTarget.getBoundingClientRect();
        const relativeY = docY - targetRect.top;
        const isTopHalf = relativeY < targetRect.height / 2;

        const indicator = getOrCreateDropIndicator();
        if (isTopHalf) {
          blockTarget.before(indicator);
          transformStateRef.current = {
            type: 'drag',
            startX,
            startY,
            startW: dimensions.width,
            startH: dimensions.height,
            aspectRatio: 1,
            startRotation: rotation,
            centerX: 0,
            centerY: 0,
            isProportional: false,
            dropTargetElement: blockTarget,
            dropPosition: 'before',
          };
        } else {
          blockTarget.after(indicator);
          transformStateRef.current = {
            type: 'drag',
            startX,
            startY,
            startW: dimensions.width,
            startH: dimensions.height,
            aspectRatio: 1,
            startRotation: rotation,
            centerX: 0,
            centerY: 0,
            isProportional: false,
            dropTargetElement: blockTarget,
            dropPosition: 'after',
          };
        }
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      const win = imageElement.ownerDocument?.defaultView;
      win?.removeEventListener('pointermove', handlePointerMove);
      win?.removeEventListener('pointerup', handlePointerUp);

      const state = transformStateRef.current;
      if (hasMoved && state?.type === 'drag' && state.dropTargetElement && dropIndicatorRef.current?.isConnected) {
        // Place image at drop indicator position
        dropIndicatorRef.current.replaceWith(imageElement);
      }

      removeDropIndicator();
      transformStateRef.current = null;
      setActiveTransform(null);

      syncFromElement();
      unlockContentEditable();
      onUpdate();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    const win = imageElement.ownerDocument?.defaultView;
    win?.addEventListener('pointermove', handlePointerMove);
    win?.addEventListener('pointerup', handlePointerUp);
  };

  // -------------------------------------------------------------
  // Alignment & Wrapping Helpers
  // -------------------------------------------------------------
  const applyWrapping = (mode: 'float-left' | 'float-right' | 'block-center' | 'block-left') => {
    lockContentEditable();
    if (mode === 'float-left') {
      imageElement.style.float = 'left';
      imageElement.style.display = 'inline-block';
      imageElement.style.margin = '0 20px 20px 0';
    } else if (mode === 'float-right') {
      imageElement.style.float = 'right';
      imageElement.style.display = 'inline-block';
      imageElement.style.margin = '0 0 20px 20px';
    } else if (mode === 'block-center') {
      imageElement.style.float = 'none';
      imageElement.style.display = 'block';
      imageElement.style.margin = '16px auto';
    } else if (mode === 'block-left') {
      imageElement.style.float = 'none';
      imageElement.style.display = 'block';
      imageElement.style.margin = '16px 0';
    }

    syncFromElement();
    unlockContentEditable();
    onUpdate();
  };

  const handleResetRotation = (e: React.MouseEvent) => {
    e.stopPropagation();
    lockContentEditable();
    imageElement.style.transform = '';
    setRotation(0);
    syncFromElement();
    unlockContentEditable();
    onUpdate();
  };

  const computedStyle = imageElement.ownerDocument?.defaultView?.getComputedStyle(imageElement);
  const currentFloat = imageElement.style.float || computedStyle?.float;
  const currentDisplay = imageElement.style.display || computedStyle?.display;
  const currentMargin = imageElement.style.margin || '';

  const isFloatLeft = currentFloat === 'left';
  const isFloatRight = currentFloat === 'right';
  const isBlockCenter = currentDisplay === 'block' && currentMargin.includes('auto');
  const isBlockLeft = currentDisplay === 'block' && !isBlockCenter && !isFloatLeft && !isFloatRight;

  return (
    <div
      className="absolute select-none z-30 transition-shadow duration-100"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        transform: rotation !== 0 ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'center center',
      }}
      onPointerDown={handleDragPointerDown}
    >
      {/* Visual Bounding Box Border */}
      <div
        className={`absolute inset-0 border-2 rounded-xs pointer-events-auto cursor-move transition-colors ${
          activeTransform === 'drag'
            ? 'border-indigo-500 bg-indigo-500/10 shadow-lg'
            : activeTransform
            ? 'border-indigo-600'
            : 'border-indigo-600 hover:border-indigo-500 hover:bg-indigo-500/5'
        }`}
        title="انقر واسحب لتحريك الصورة / Drag to reposition image"
      >
        {/* Subtle crosshair center mark when active */}
        {activeTransform && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="w-2.5 h-0.5 bg-indigo-600" />
            <div className="w-0.5 h-2.5 bg-indigo-600 absolute" />
          </div>
        )}
      </div>

      {/* Rotation Stem & Handle (Extends above top-center) */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-auto z-40">
        {/* Active angle tooltip pill */}
        {activeRotationDegrees !== null && (
          <div className="absolute -top-6 whitespace-nowrap bg-slate-900 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-lg border border-indigo-500">
            {activeRotationDegrees}° {isSnappingActive ? '(15° Snap)' : ''}
          </div>
        )}

        {/* Circular Rotation Handle Pin */}
        <button
          type="button"
          onPointerDown={handleRotatePointerDown}
          title="تدوير الصورة (اضغط Shift لتقريب الزوايا إلى 15 درجة) / Rotate image (Hold Shift for 15° snap)"
          className={`w-5 h-5 rounded-full bg-white border-2 border-indigo-600 shadow-md flex items-center justify-center text-indigo-600 hover:bg-indigo-50 active:scale-95 cursor-grab active:cursor-grabbing transition-transform ${
            activeTransform === 'rotate' ? 'ring-2 ring-indigo-400 scale-110' : ''
          }`}
        >
          <RotateCw className="w-2.5 h-2.5" />
        </button>

        {/* Stem Line connecting pin to N handle */}
        <div className="w-0.5 h-2.5 bg-indigo-600" />
      </div>

      {/* 8 Resize Handles */}
      {/* Top Left (NW) */}
      <div
        onPointerDown={(e) => handleResizePointerDown(e, 'nw')}
        title="Resize diagonally (Hold Shift for free scaling)"
        className="resize-handle absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nwse-resize pointer-events-auto shadow-sm hover:scale-125 transition-transform"
      />
      {/* Top (N) */}
      <div
        onPointerDown={(e) => handleResizePointerDown(e, 'n')}
        title="Resize height"
        className="resize-handle absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-ns-resize pointer-events-auto shadow-sm hover:scale-125 transition-transform"
      />
      {/* Top Right (NE) */}
      <div
        onPointerDown={(e) => handleResizePointerDown(e, 'ne')}
        title="Resize diagonally (Hold Shift for free scaling)"
        className="resize-handle absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nesw-resize pointer-events-auto shadow-sm hover:scale-125 transition-transform"
      />
      {/* Right (E) */}
      <div
        onPointerDown={(e) => handleResizePointerDown(e, 'e')}
        title="Resize width"
        className="resize-handle absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-ew-resize pointer-events-auto shadow-sm hover:scale-125 transition-transform"
      />
      {/* Bottom Right (SE) */}
      <div
        onPointerDown={(e) => handleResizePointerDown(e, 'se')}
        title="Resize diagonally (Hold Shift for free scaling)"
        className="resize-handle absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nwse-resize pointer-events-auto shadow-sm hover:scale-125 transition-transform"
      />
      {/* Bottom (S) */}
      <div
        onPointerDown={(e) => handleResizePointerDown(e, 's')}
        title="Resize height"
        className="resize-handle absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-ns-resize pointer-events-auto shadow-sm hover:scale-125 transition-transform"
      />
      {/* Bottom Left (SW) */}
      <div
        onPointerDown={(e) => handleResizePointerDown(e, 'sw')}
        title="Resize diagonally (Hold Shift for free scaling)"
        className="resize-handle absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-nesw-resize pointer-events-auto shadow-sm hover:scale-125 transition-transform"
      />
      {/* Left (W) */}
      <div
        onPointerDown={(e) => handleResizePointerDown(e, 'w')}
        title="Resize width"
        className="resize-handle absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-3 bg-white border-2 border-indigo-600 rounded-xs cursor-ew-resize pointer-events-auto shadow-sm hover:scale-125 transition-transform"
      />

      {/* Info Badge & Dimensions */}
      <div className="absolute -top-7 left-0 pointer-events-auto flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-mono font-semibold px-2 py-0.5 rounded-t-md shadow-md">
        <span>&lt;img&gt;</span>
        <span className="text-indigo-200 font-sans ml-1 text-[9px]">
          {dimensions.width} × {dimensions.height}
        </span>
        {rotation !== 0 && (
          <span className="text-amber-300 font-mono ml-1 text-[9px]">
            · {rotation}°
          </span>
        )}
      </div>

      {/* Floating Action & Wrapping Toolbar (Unrotated counter-balance for comfortable clicking) */}
      <div
        className="action-toolbar absolute -top-9 right-0 pointer-events-auto flex items-center gap-0.5 bg-slate-900/95 backdrop-blur-xs text-white p-1 rounded-lg shadow-xl border border-slate-700 animate-in fade-in duration-100 z-50 select-none"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Text Wrapping: Float Left */}
        <button
          type="button"
          title="التفاف النص لليمين (Float Left)"
          onClick={() => applyWrapping('float-left')}
          className={`p-1 rounded transition ${
            isFloatLeft
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>

        {/* Text Wrapping: Block Center */}
        <button
          type="button"
          title="توسيط ككتلة منفصلة (Block Center)"
          onClick={() => applyWrapping('block-center')}
          className={`p-1 rounded transition ${
            isBlockCenter
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>

        {/* Text Wrapping: Float Right */}
        <button
          type="button"
          title="التفاف النص لليسار (Float Right)"
          onClick={() => applyWrapping('float-right')}
          className={`p-1 rounded transition ${
            isFloatRight
              ? 'bg-indigo-600 text-white'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>

        {/* Reset Rotation if rotated */}
        {rotation !== 0 && (
          <button
            type="button"
            title="إعادة تعيين زاوية الدوران إلى 0°"
            onClick={handleResetRotation}
            className="p-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded flex items-center gap-0.5 text-[10px] font-mono px-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            0°
          </button>
        )}

        <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

        {/* Move Up */}
        <button
          type="button"
          title="نقل للأعلى"
          disabled={!imageElement.previousElementSibling}
          onClick={() => onMoveElement('up')}
          className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300 hover:text-white"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>

        {/* Move Down */}
        <button
          type="button"
          title="نقل للأسفل"
          disabled={!imageElement.nextElementSibling}
          onClick={() => onMoveElement('down')}
          className="p-1 hover:bg-slate-800 disabled:opacity-30 rounded text-slate-300 hover:text-white"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-3.5 bg-slate-700 mx-0.5" />

        {/* Styles Modal */}
        <button
          type="button"
          title="تعديل تنسيقات وأنماط الصورة"
          onClick={onOpenStyleModal}
          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-indigo-400"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>

        {/* Raw HTML Modal */}
        <button
          type="button"
          title="تعديل كود HTML الخاص بالصورة"
          onClick={onOpenHtmlModal}
          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-emerald-400"
        >
          <Code2 className="w-3.5 h-3.5" />
        </button>

        {/* Duplicate */}
        <button
          type="button"
          title="تكرار الصورة"
          onClick={onDuplicate}
          className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>

        {/* Delete */}
        <button
          type="button"
          title="حذف الصورة"
          onClick={onDelete}
          className="p-1 hover:bg-rose-950/60 text-rose-400 hover:text-rose-300 rounded"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
