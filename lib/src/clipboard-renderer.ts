import { MarkedRenderer } from './marked-renderer';
export class ClipboardRenderer extends MarkedRenderer {

   private static readonly WRAPPER_START = '<div class="markdown-copier-wrapper"><div class="markdown-copier">';
   private static readonly BUTTON = '<svg xmlns="http://www.w3.org/2000/svg" class="markdown-copier-svg"><path class="markdown-copier-path-1" d="M0 0h24v24H0z"/><path class="markdown-copier-path-2" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm-1 4l6 6v10c0 1.1-.9 2-2 2H7.99C6.89 23 6 22.1 6 21l.01-14c0-1.1.89-2 1.99-2h7zm-1 7h5.5L14 6.5V12z"/></svg>';
   private static readonly WRAPPER_END = '</div></div>';
   private static readonly CLIPBOARD_ELEMENT = ClipboardRenderer.WRAPPER_START + ClipboardRenderer.BUTTON + ClipboardRenderer.WRAPPER_END;
   private static readonly PATTERN = '\<pre.*?\>';

   constructor() {
    super();
   }

   // overriden
   code(content: string, language: string, isEscaped: boolean): string {
    const codeBlock = super.code(content, language, isEscaped);
    const regExp = new RegExp(ClipboardRenderer.PATTERN);
    const match = regExp.exec(codeBlock);
    if (match) {
      const patternEndIndex = match[0].length;
      return codeBlock.slice(0, patternEndIndex) + ClipboardRenderer.CLIPBOARD_ELEMENT + codeBlock.slice(patternEndIndex);
    } else {
      return codeBlock;
    }
   }

}
