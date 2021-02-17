import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, InjectionToken, Optional, PLATFORM_ID, SecurityContext } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import * as marked from 'marked';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { KatexOptions } from './katex-options';
import { MarkedOptions } from './marked-options';
import { MarkedRenderer } from './marked-renderer';

declare var joypixels: {
  shortnameToUnicode(input: string): string;
};

declare var katex: {
  renderToString(tex: string, options?: KatexOptions): string;
};

declare var Prism: {
  highlightAllUnder: (element: Element | Document) => void;
};

// tslint:disable:max-line-length
export const errorJoyPixelsNotLoaded = '[ngx-markdown] When using the `emoji` attribute you *have to* include Emoji-Toolkit files to `angular.json` or use imports. See README for more information';
export const errorKatexNotLoaded = '[ngx-markdown] When using the `katex` attribute you *have to* include KaTeX files to `angular.json` or use imports. See README for more information';
export const errorSrcWithoutHttpClient = '[ngx-markdown] When using the `src` attribute you *have to* pass the `HttpClient` as a parameter of the `forRoot` method. See README for more information';
// tslint:enable:max-line-length

export const SECURITY_CONTEXT = new InjectionToken<SecurityContext>('SECURITY_CONTEXT');

@Injectable()
export class MarkdownService {

  private readonly initialMarkedOptions: MarkedOptions = {
    renderer: new MarkedRenderer(),
  };

  private _options: MarkedOptions | undefined;

  get options(): MarkedOptions {
    return this._options!;
  }

  set options(value: MarkedOptions) {
    this._options = {...this.initialMarkedOptions, ...value};
  }

  get renderer(): MarkedRenderer {
    return this.options.renderer!;
  }

  set renderer(value: MarkedRenderer) {
    this.options.renderer = value;
  }

  constructor(
    @Inject(PLATFORM_ID) private platform: Object,
    @Inject(SECURITY_CONTEXT) private securityContext: SecurityContext,
    @Optional() private http: HttpClient,
    @Optional() options: MarkedOptions,
    private sanitizer: DomSanitizer,
  ) {
    this.options = options;
  }

  compile(markdown: string, decodeHtml = false, emojify = false, markedOptions = this.options): string {
    const trimmed = this.trimIndentation(markdown);
    const decoded = decodeHtml ? this.decodeHtml(trimmed) : trimmed;
    const emojified = emojify ? this.renderEmoji(decoded) : decoded;
    const compiled = marked.parse(emojified, markedOptions);
    return this.sanitizer.sanitize(this.securityContext, compiled) || '';
  }

  getSource(src: string): Observable<string> {
    if (!this.http) {
      throw new Error(errorSrcWithoutHttpClient);
    }
    return this.http
      .get(src, {responseType: 'text'})
      .pipe(map(markdown => this.handleExtension(src, markdown)));
  }

  highlight(element?: Element | Document): void {
    if (!isPlatformBrowser(this.platform)) {
      return;
    }
    if (typeof Prism !== 'undefined') {
      if (!element) {
        element = document;
      }
      const noLanguageElements = element.querySelectorAll('pre code:not([class*="language-"])');
      Array.prototype.forEach.call(noLanguageElements, (x: Element) => x.classList.add('language-none'));
      Prism.highlightAllUnder(element);
    }
  }

  renderKatex(html: string, options?: KatexOptions): string {
    if (!isPlatformBrowser(this.platform)) {
      return html;
    }
    if (typeof katex === 'undefined' || typeof katex.renderToString === 'undefined') {
      throw new Error(errorKatexNotLoaded);
    }
    return html.replace(/\$([^\s][^$]*?[^\s])\$/gm, (_, tex) => katex.renderToString(tex, options));
  }

  private decodeHtml(html: string): string {
    if (!isPlatformBrowser(this.platform)) {
      return html;
    }
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
  }

  private handleExtension(src: string, markdown: string): string {
    if (
      (this.options.ignoreFileExtensionCheckFn && this.options.ignoreFileExtensionCheckFn(src)) ||
      this.options.ignoreFileExtensionCheck) {
      return markdown;
    }

    const extension = src
      ? src.split('?')[0].split('.').splice(-1).join()
      : null;
    return extension !== 'md'
      ? '```' + extension + '\n' + markdown + '\n```'
      : markdown;
  }

  private renderEmoji(html: string): string {
    if (!isPlatformBrowser(this.platform)) {
      return html;
    }
    if (typeof joypixels === 'undefined' || typeof joypixels.shortnameToUnicode === 'undefined') {
      throw new Error(errorJoyPixelsNotLoaded);
    }
    return joypixels.shortnameToUnicode(html);
  }

  private trimIndentation(markdown: string): string {
    if (!markdown) {
      return '';
    }
    let indentStart: number;
    return markdown
      .split('\n')
      .map(line => {
        let lineIdentStart = indentStart;
        if (line.length > 0) {
          lineIdentStart = isNaN(lineIdentStart)
            ? line.search(/\S|$/)
            : Math.min(line.search(/\S|$/), lineIdentStart);
        }
        if (isNaN(indentStart)) {
          indentStart = lineIdentStart;
        }
        return !!lineIdentStart
          ? line.substring(lineIdentStart)
          : line;
      }).join('\n');
  }
}
