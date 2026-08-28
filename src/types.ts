export interface DocumentItem {
  id: string;
  title: string;
  content: string; // Full HTML string including <!DOCTYPE>, <html>, <head>, <style>, <body>
  createdAt: number;
  updatedAt: number;
  wordCount: number;
  charCount: number;
  fileSize: number; // in bytes
}

export type ViewMode = 'page' | 'web' | 'split';
export type DevicePreset = 'desktop' | 'tablet' | 'mobile';

export interface SelectionInfo {
  tagName: string;
  id?: string;
  className?: string;
  rect: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  isImage: boolean;
  isTable: boolean;
  isTableCell: boolean;
  isHeading: boolean;
  isParagraph: boolean;
  isLink: boolean;
  isList: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  path: string[];
  computedStyles?: {
    color?: string;
    backgroundColor?: string;
    fontSize?: string;
    fontFamily?: string;
    textAlign?: string;
    fontWeight?: string;
    fontStyle?: string;
    textDecoration?: string;
  };
}

export interface ImageAttributes {
  src: string;
  alt: string;
  width?: string | number;
  height?: string | number;
  align?: 'left' | 'center' | 'right' | 'float-left' | 'float-right';
  borderRadius?: string;
  shadow?: boolean;
}

export interface TableOptions {
  rows: number;
  cols: number;
  headerRow: boolean;
  bordered: boolean;
  striped: boolean;
}

export interface LinkAttributes {
  url: string;
  text: string;
  openInNewTab: boolean;
}

export interface CalloutOptions {
  type: 'info' | 'success' | 'warning' | 'error' | 'quote';
  title?: string;
  text: string;
}

/** Actions the in-iframe keyboard handler can forward to the app shell. */
export type ShortcutAction =
  | 'export'
  | 'find'
  | 'undo'
  | 'redo'
  | 'print'
  | 'duplicate';

export interface DocumentStats {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  paragraphs: number;
  headings: number;
  images: number;
  tables: number;
  readingTimeMinutes: number;
}
