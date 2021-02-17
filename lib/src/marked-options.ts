import { MarkedRenderer } from './marked-renderer';

export class MarkedOptions {
  /**
   * A prefix URL for any relative link.
   */
  baseUrl?: string;

  /**
   * Enable GFM line breaks. This option requires the gfm option to be true.
   */
  breaks?: boolean;

  /**
   * Enable GitHub flavored markdown.
   */
  gfm?: boolean;

  /**
   * Include an id attribute when emitting headings.
   */
  headerIds?: boolean;

  /**
   * Set the prefix for header tag ids.
   */
  headerPrefix?: string;

  /**
   * Set the prefix for code block classes.
   */
  langPrefix?: string;

  /**
   * Mangle autolinks (<email@domain.com>).
   */
  mangle?: boolean;

  /**
   * Conform to obscure parts of markdown.pl as much as possible. Don't fix any of the original markdown bugs or poor behavior.
   */
  pedantic?: boolean;

  /**
   * Type: object Default: new Renderer()
   *
   * An object containing functions to render tokens to HTML.
   */
  renderer?: MarkedRenderer;

  /**
   * Shows an HTML error message when rendering fails.
   */
  silent?: boolean;

  /**
   * Use smarter list behavior than the original markdown. May eventually be default with the old behavior moved into pedantic.
   */
  smartLists?: boolean;

  /**
   * Use "smart" typograhic punctuation for things like quotes and dashes.
   */
  smartypants?: boolean;

  /**
   * Generate closing slash for self-closing tags (<br/> instead of <br>)
   */
  xhtml?: boolean;

  /**
   * Ignore url suffix check when web request to load markdown file, ignore file extension check
   */
  ignoreFileExtensionCheck?: boolean;

  /**
   * ignore file extension check function
   */
  ignoreFileExtensionCheckFn?(url: string): boolean;

  /**
   * A function to highlight code blocks. The function takes three arguments: code, lang, and callback.
   */
  highlight?(code: string, lang: string, callback?: (error: any | undefined, code: string) => void): string;
}
