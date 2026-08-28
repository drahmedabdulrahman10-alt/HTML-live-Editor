/**
 * Sanitizes untrusted HTML (usually pasted from the clipboard or inserted by
 * third-party sources) so it can never execute script inside the editor.
 *
 * Design goals:
 *  - Strip ALL script execution vectors: <script>, inline event handlers
 *    (onerror, onload, ...), javascript:/vbscript: URLs, <iframe>/<object>/<embed>.
 *  - PRESERVE legitimate formatting: class names, inline styles, tables,
 *    images, links, lists and colors survive untouched.
 */
export interface SanitizeOptions {
  /** Allow <style> tags (used when loading whole documents, not for paste). */
  allowStyleTags?: boolean;
}

const SCRIPT_EXECUTION_TAGS =
  'script,iframe,object,embed,applet,base,meta[http-equiv],link[rel="import"]';

function isSafeUrl(value: string): boolean {
  const url = value.trim().toLowerCase().replace(/[\'"]/g, '');
  // Block dangerous schemes. Allow relative URLs, http(s), mail, tel, anchors,
  // and raster images embedded as data URIs.
  if (/^(javascript|vbscript|file|about|data:text\/html|data:application)/i.test(url)) {
    return false;
  }
  if (/^data:image\/(png|jpe?g|gif|webp|svg\+xml)/i.test(url)) {
    return true;
  }
  return true;
}

export function sanitizeHtmlFragment(html: string, options: SanitizeOptions = {}): string {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 1. Remove script-executing containers.
  doc.querySelectorAll(SCRIPT_EXECUTION_TAGS).forEach((el) => el.remove());

  // 2. Strip inline event handlers and unsafe URL attributes from every node.
  const all = doc.querySelectorAll('*');
  all.forEach((el) => {
    // Remove every attribute starting with "on" (onevent= JS handlers).
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        continue;
      }
      if ((name === 'href' || name === 'src' || name === 'xlink:href') &&
          !isSafeUrl(attr.value)) {
        el.removeAttribute(attr.name);
      }
      // srcdoc can smuggle full documents.
      if (name === 'srcdoc' || name === 'formaction') {
        el.removeAttribute(attr.name);
      }
    }
    if (el.tagName === 'STYLE' && !options.allowStyleTags) {
      el.remove();
    }
  });

  return doc.body.innerHTML;
}
