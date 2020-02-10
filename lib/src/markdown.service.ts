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

declare var katex: {
  renderToString(tex: string, options?: KatexOptions): string;
};

declare var Prism: {
  highlightAllUnder: (element: Element | Document) => void;
};

// tslint:disable:max-line-length
export const errorKatexNotLoaded = '[ngx-markdown When using the [katex] attribute you *have to* include KaTeX files to `angular.json` or use imports. See README for more information';
export const errorSrcWithoutHttpClient = '[ngx-markdown] When using the [src] attribute you *have to* pass the `HttpClient` as a parameter of the `forRoot` method. See README for more information';
// tslint:enable:max-line-length

export const SECURITY_CONTEXT = new InjectionToken<SecurityContext>('SECURITY_CONTEXT');

@Injectable()
export class MarkdownService {

  private readonly initialMarkedOptions: MarkedOptions = {
    renderer: new MarkedRenderer(),
    smartLists: true,
  };

  private _options: MarkedOptions;
  get options(): MarkedOptions { return this._options; }
  set options(value: MarkedOptions) {
    this._options = Object.assign({},
      { ...this.initialMarkedOptions },
      this._options,
      value,
    );
  }

  get renderer(): MarkedRenderer { return this.options.renderer; }
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

  compile(markdown: string, decodeHtml = false, markedOptions = this.options): string {
    const trimmed = this.trimIndentation(markdown);
    const decoded = decodeHtml ? this.decodeHtml(trimmed) : trimmed;
    const compiled = marked.parse(decoded, markedOptions);
    return this.sanitizer.sanitize(this.securityContext, compiled);
  }

  getSource(src: string): Observable<string> {
    if (!this.http) {
      throw new Error(errorSrcWithoutHttpClient);
    }
    return this.http
      .get(src, { responseType: 'text' })
      .pipe(map(markdown => this.handleExtension(src, markdown)));
  }

  highlight(element?: Element | Document) {
    if (isPlatformBrowser(this.platform) && typeof Prism !== 'undefined') {
      if (!element) {
        element = document;
      }
      const noLanguageElements = element.querySelectorAll('pre code:not([class*="language-"])');
      Array.prototype.forEach.call(noLanguageElements, (x: Element) => x.classList.add('language-none'));
      Prism.highlightAllUnder(element);
    }
  }

  renderKatex(html: string, options?: KatexOptions): string {
    if (typeof katex === 'undefined' || typeof katex.renderToString === 'undefined') {
      throw new Error(errorKatexNotLoaded);
    }
    return html.replace(/\$([^\s][^$]*?[^\s])\$/gm, (_, tex) => katex.renderToString(tex, options));
  }

  private decodeHtml(html: string): string {
    if (isPlatformBrowser(this.platform)) {
      const textarea = document.createElement('textarea');
      textarea.innerHTML = html;
      return textarea.value;
    }
    return html;
  }

  private handleExtension(src: string, markdown: string): string {
    const extension = src
      ? src.split('?')[0].split('.').splice(-1).join()
      : null;
    return extension !== 'md'
      ? '```' + extension + '\n' + markdown + '\n```'
      : markdown;
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
