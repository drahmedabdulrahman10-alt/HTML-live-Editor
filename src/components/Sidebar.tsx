import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Upload,
  Trash2,
  Copy,
  Download,
  Search,
  FileCode,
  Sparkles,
  AlertTriangle,
  HardDrive,
  X,
  Layers,
  ChevronRight,
  Clock
} from 'lucide-react';
import { DocumentItem } from '../types';
import { TEMPLATES } from '../services/templates';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  documents: DocumentItem[];
  activeDocId: string;
  onSelectDoc: (id: string) => void;
  onCreateNewDoc: (templateId?: string) => void;
  onUploadFile: (file: File) => void;
  onDuplicateDoc: (id: string) => void;
  onDeleteDoc: (id: string) => void;
  onClearAllData: () => void;
  onExportDoc: (doc: DocumentItem) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  documents,
  activeDocId,
  onSelectDoc,
  onCreateNewDoc,
  onUploadFile,
  onDuplicateDoc,
  onDeleteDoc,
  onClearAllData,
  onExportDoc,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  return (
    <>
      {/* Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 sm:w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } shadow-2xl md:shadow-none`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-600 text-white rounded-lg shadow-2xs">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                HTML Live Editor
              </h2>
              <div className="text-[11px] text-slate-400">Local Documents Library</div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Buttons: New Document & Upload */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowTemplatesModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition"
            >
              <Plus className="w-4 h-4" /> New Document
            </button>

            <label className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-indigo-500" /> Open .html
              <input
                type="file"
                accept=".html,.htm,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onUploadFile(file);
                    e.target.value = '';
                  }
                }}
                className="hidden"
              />
            </label>
          </div>

          {/* Quick Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            className={`border border-dashed rounded-lg p-2.5 text-center transition ${
              dragOver
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600'
                : 'border-slate-200 dark:border-slate-800 text-slate-400'
            }`}
          >
            <div className="text-[11px] font-medium">Drag & drop any .html file here</div>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Documents List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Saved Documents ({documents.length})
          </div>

          {filteredDocs.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-slate-400">
              {searchQuery ? 'No documents match your search.' : 'No saved documents yet.'}
            </div>
          ) : (
            filteredDocs.map((doc) => {
              const isActive = doc.id === activeDocId;
              return (
                <div
                  key={doc.id}
                  onClick={() => onSelectDoc(doc.id)}
                  className={`group relative flex flex-col p-2.5 rounded-lg text-left transition cursor-pointer border ${
                    isActive
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-950 dark:text-indigo-200'
                      : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                        }`}
                      />
                      <span className="text-xs font-semibold truncate">{doc.title}</span>
                    </div>

                    {/* Action buttons on hover */}
                    <div
                      className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        title="Duplicate document"
                        onClick={() => onDuplicateDoc(doc.id)}
                        className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 rounded"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Download .html"
                        onClick={() => onExportDoc(doc)}
                        className="p-1 hover:text-indigo-600 dark:hover:text-indigo-400 rounded"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Delete document"
                        onClick={() => onDeleteDoc(doc.id)}
                        className="p-1 hover:text-rose-600 dark:hover:text-rose-400 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 pl-6">
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTimeAgo(doc.updatedAt)}
                    </span>
                    <span>&bull;</span>
                    <span>{doc.wordCount || 0} words</span>
                    <span>&bull;</span>
                    <span>{formatFileSize(doc.fileSize)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Reset Data */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-[11px]">
            <HardDrive className="w-3.5 h-3.5 text-slate-400" />
            <span>IndexedDB Storage</span>
          </div>

          <button
            onClick={() => setShowClearConfirm(true)}
            className="text-[11px] text-rose-500 hover:text-rose-600 font-medium hover:underline"
          >
            Clear All Data
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden text-slate-800 dark:text-slate-100">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-base">Choose a Template</h3>
              </div>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => {
                    onCreateNewDoc(tmpl.id);
                    setShowTemplatesModal(false);
                    onClose();
                  }}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/30 transition cursor-pointer flex flex-col justify-between text-left group shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {tmpl.badge}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                      {tmpl.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {tmpl.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden text-slate-800 dark:text-slate-100 p-5">
            <div className="flex items-center gap-3 mb-3 text-rose-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Clear All Local Documents?
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
              This will permanently delete all locally saved documents and reset the editor storage. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllData();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-xs"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
