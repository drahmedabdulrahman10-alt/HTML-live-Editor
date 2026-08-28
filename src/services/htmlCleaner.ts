/**
 * Utilities for cleaning, preparing, and downloading HTML content
 * while strictly preserving original styles, head tags, fonts, and structures.
 */

export function cleanHtmlForExport(rawHtml: string): string {
  if (!rawHtml) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Remove editor-specific attributes and elements
  const allElements = doc.querySelectorAll('*');
  allElements.forEach((el) => {
    // Remove contenteditable if injected by the editor
    el.removeAttribute('contenteditable');
    el.removeAttribute('data-editor-selected');
    el.removeAttribute('data-editor-hover');
    el.removeAttribute('data-editor-highlight');
    
    // Remove editor-specific classes if any were added
    if (el.classList.contains('live-editor-active-element')) {
      el.classList.remove('live-editor-active-element');
    }
    if (el.classList.contains('live-editor-hover-element')) {
      el.classList.remove('live-editor-hover-element');
    }
    if (el.getAttribute('class') === '') {
      el.removeAttribute('class');
    }
  });

  // Remove any injected editor style tags
  const editorStyles = doc.querySelectorAll('style[data-editor-internal]');
  editorStyles.forEach(s => s.remove());

  // Remove any injected editor overlays or scripts
  const editorUI = doc.querySelectorAll('[data-editor-ui]');
  editorUI.forEach(ui => ui.remove());

  // Check if original had doctype
  const hasDoctype = rawHtml.trim().toLowerCase().startsWith('<!doctype html');
  const doctype = hasDoctype ? '<!DOCTYPE html>\n' : '';

  return doctype + doc.documentElement.outerHTML;
}

export function formatHtml(html: string): string {
  try {
    let formatted = '';
    const reg = /(>)(<)(\/*)/g;
    let xml = html.replace(reg, '$1\r\n$2$3');
    let pad = 0;

    xml.split('\r\n').forEach((node) => {
      let indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
        indent = 0;
      } else if (node.match(/^<\/\w/)) {
        if (pad !== 0) {
          pad -= 1;
        }
      } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
        indent = 1;
      } else {
        indent = 0;
      }

      const padding = '  '.repeat(pad);
      formatted += padding + node + '\n';
      pad += indent;
    });

    return formatted.trim();
  } catch {
    return html;
  }
}

export function downloadHtmlFile(html: string, filename: string = 'document.html'): void {
  const clean = cleanHtmlForExport(html);
  const blob = new Blob([clean], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  let validName = filename.trim();
  if (!validName.toLowerCase().endsWith('.html') && !validName.toLowerCase().endsWith('.htm')) {
    validName += '.html';
  }
  
  link.href = url;
  link.download = validName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyHtmlToClipboard(html: string): Promise<boolean> {
  try {
    const clean = cleanHtmlForExport(html);
    await navigator.clipboard.writeText(clean);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard', err);
    return false;
  }
}

export function printHtml(html: string): void {
  const clean = cleanHtmlForExport(html);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(clean);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }
}
