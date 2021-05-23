import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SecurityContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { parse } from 'marked';

import { KatexOptions } from './katex-options';
import { MarkdownModule } from './markdown.module';
import { errorJoyPixelsNotLoaded, errorKatexNotLoaded, MarkdownService, SECURITY_CONTEXT } from './markdown.service';

declare let global: any;
declare let Prism: any;
declare let joypixels: any;
declare let katex: any;

describe('MarkdowService', () => {
  let domSanitizer: DomSanitizer;
  let http: HttpTestingController;
  let markdownService: MarkdownService;

  describe('with SecurityContext.HTML', () => {

    describe('compile', () => {

      beforeEach(() => {
        TestBed.configureTestingModule({
          imports: [
            MarkdownModule.forRoot({ sanitize: SecurityContext.HTML }),
          ],
        });
      });

      beforeEach(() => {
        domSanitizer = TestBed.inject(DomSanitizer);
        markdownService = TestBed.inject(MarkdownService);
      });

      it('should sanitize parsed markdown', () => {

        const securityContext = TestBed.inject(SECURITY_CONTEXT);

        const mockRaw = '### Markdown-x';
        const sanitized = domSanitizer.sanitize(securityContext, parse(mockRaw));
        const unsanitized = parse(mockRaw);

        expect(markdownService.compile(mockRaw, false)).toBe(sanitized!);
        expect(markdownService.compile(mockRaw, false)).not.toBe(unsanitized);
      });
    });
  });

  describe('with SecurityContext.NONE', () => {

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          BrowserModule,
          HttpClientTestingModule,
          MarkdownModule.forRoot({ sanitize: SecurityContext.NONE }),
        ],
      });
    });

    beforeEach(() => {
      http = TestBed.inject(HttpTestingController);
      markdownService = TestBed.inject(MarkdownService);
    });

    describe('options', () => {

      it('should be initialized correctly', () => {

        expect(markdownService.options).toBeDefined();
        expect(markdownService.options.renderer).toBeDefined();
      });

      it('should update correctly', () => {

        const mockBaseUrl = 'mock-url';

        markdownService.options = { baseUrl: mockBaseUrl };

        expect(markdownService.options.baseUrl).toBe(mockBaseUrl);
        expect(markdownService.options.renderer).toBeDefined();
      });
    });

    describe('renderer', () => {

      it('should be initialized correctly', () => {

        expect(markdownService.renderer).toBeDefined();
      });

      it('should update option.renderer when updated', () => {

        const blockquote = (quote: string) => `<mock-blockquote>${quote}</mock-blockquote>`;

        markdownService.renderer.blockquote = blockquote;

        const quoteText = 'foobar';
        const expectedBlockquote = blockquote(quoteText);
        const rendererBlockquote = markdownService.renderer.blockquote(quoteText);
        const optionsRendererBlockquote = markdownService.options.renderer!.blockquote(quoteText);

        expect(rendererBlockquote).toBe(expectedBlockquote);
        expect(optionsRendererBlockquote).toBe(expectedBlockquote);
      });
    });

    describe('re-render markdown', () => {

      it('should request reload fn', () => {

        markdownService._trigger$.subscribe(res => {
          expect(res).toBe(1);
        });

        markdownService.reload();
      });
    });

    describe('compile', () => {

      it('should return parsed markdown correctly', () => {

        const mockRaw = '### Markdown-x';

        expect(markdownService.compile(mockRaw)).toBe(parse(mockRaw));
      });

      it('should return empty string when raw is null/undefined/empty', () => {

        expect(markdownService.compile(null!)).toBe('');
        expect(markdownService.compile(undefined!)).toBe('');
        expect(markdownService.compile('')).toBe('');
      });

      it('should remove leading whitespaces offset while keeping indent', () => {

        const mockRaw =  [
          '',               // wait for line with non-whitespaces
          '  * list',       // find first line with non-whitespaces to set offset
          '     * sub-list', // keep indent while removing from previous row offset
        ].join('\n');

        const expected = [
          '',
          '* list',
          '   * sub-list',
        ].join('\n');

        expect(markdownService.compile(mockRaw)).toBe(parse(expected));
      });

      it('should return line with indent correctly', () => {

        const mockRaw =  [
          '   ',              // first line with only whitespaces should not determine indent offset
          '  * list',         // find first line with non-whitespaces to set offset
          '     * sub-list',   // keep indent while removing from previous row offset
          '  ',               // keep blank line
          ' Negative indent', // keep line with negative offset according to first non-whitespaces line indent
          '  Lorem Ipsum',    // keep indent like equals to first non-whitespaces line ident
        ].join('\n');

        const expected = [
          '* list',
          '   * sub-list',
          '',
          'Negative indent',
          'Lorem Ipsum',
        ].join('\n');

        expect(markdownService.compile(mockRaw)).toBe(parse(expected));
      });

      it('should decode HTML correctly when decodeHtml is true ', () => {

        const mockRaw = '&lt;html&gt;';
        const expected = '<html>';

        expect(markdownService.compile(mockRaw, true)).toBe(expected);
      });

      it('should not decode HTML when decodeHtml is omitted/false/null/undefined', () => {

        const mockRaw = '&lt;html&gt;';
        const expected = '<p>&lt;html&gt;</p>\n';

        expect(markdownService.compile(mockRaw)).toBe(expected);
        expect(markdownService.compile(mockRaw, false)).toBe(expected);
        expect(markdownService.compile(mockRaw, null!)).toBe(expected);
        expect(markdownService.compile(mockRaw, undefined)).toBe(expected);
      });

      it('should not decode HTML when platform is not browser as it uses `document`', () => {

        const mockRaw = '&lt;html&gt;';
        const expected = '<p>&lt;html&gt;</p>\n';

        markdownService['platform'] = 'server';

        expect(markdownService.compile(mockRaw, true)).toBe(expected);
      });

      it('should not sanitize parsed markdown', () => {

        const mockRaw = '### Markdown-x';
        const expected = parse(mockRaw);

        expect(markdownService.compile(mockRaw, false)).toBe(expected);
        expect(markdownService.compile(mockRaw, false)).toBe(expected);
      });

      it('should throw when emojify is true but emoji-toolkit is not loaded', () => {

        global['joypixels'] = undefined;

        expect(() => markdownService.compile('I :heart: ngx-markdown', false, true)).toThrowError(errorJoyPixelsNotLoaded);

        global['joypixels'] = { shortnameToUnicode: undefined };

        expect(() => markdownService.compile('I :heart: ngx-markdown', false, true)).toThrowError(errorJoyPixelsNotLoaded);
      });

      it('should call joypixels when emojify is true', () => {

        const mockRaw = 'I :heart: ngx-markdown';
        const mockEmojified = 'I ❤️ ngx-markdown';

        global['joypixels'] = { shortnameToUnicode: () => {} };

        spyOn(joypixels, 'shortnameToUnicode').and.returnValue(mockEmojified);

        expect(markdownService.compile(mockRaw, false, true)).toEqual(parse(mockEmojified));
        expect(joypixels.shortnameToUnicode).toHaveBeenCalledWith(mockRaw);
      });

      it('should not call joypixels when emojify is omitted/false/null/undefined', () => {

        const mockRaw = '### Markdown-x';

        global['joypixels'] = { shortnameToUnicode: () => {} };

        spyOn(joypixels, 'shortnameToUnicode');

        const useCases = [
          () => markdownService.compile(mockRaw, false),
          () => markdownService.compile(mockRaw, false, false),
          () => markdownService.compile(mockRaw, false, null!),
          () => markdownService.compile(mockRaw, false, undefined),
        ];

        useCases.forEach(func => {
          func();
          expect(joypixels.shortnameToUnicode).not.toHaveBeenCalled();
        });
      });

      it('should not call joypixels or throw when platform is not browser', () => {

        const mockRaw = 'I :heart: ngx-markdown';

        global['joypixels'] = { shortnameToUnicode: () => {} };

        spyOn(joypixels, 'shortnameToUnicode');

        markdownService['platform'] = 'server';

        expect(() => markdownService.compile(mockRaw, false, true)).not.toThrowError();
        expect(joypixels.shortnameToUnicode).not.toHaveBeenCalled();
      });
    });

    describe('getSource', () => {

      it('should call http service to get src content', () => {

        const mockSrc = 'file-x.md';
        const mockResponse = 'response-x';

        markdownService
          .getSource(mockSrc)
          .subscribe(data => {
            expect(data).toEqual(mockResponse);
          });

        http.expectOne(mockSrc).flush(mockResponse);
      });

      it('should return src content with language tick when file extension is not .md', () => {

        const mockSrc = './src-example/file.cpp';
        const mockResponse = 'response-x';

        markdownService
          .getSource(mockSrc)
          .subscribe(data => {
            expect(data).toEqual('```cpp\n' + mockResponse + '\n```');
          });

        http.expectOne(mockSrc).flush(mockResponse);

      });

      it('should return src content without language tick when file extension is .md', () => {

        const mockSrc = './src-example/file.md';
        const mockResponse = 'response-x';

        markdownService
          .getSource(mockSrc)
          .subscribe(data => {
            expect(data).toEqual(mockResponse);
          });

        http.expectOne(mockSrc).flush(mockResponse);
      });

      it('should ignore query parameters when resolving file extension', () => {

        const mockSrc = './src-example/file.js?param=123&another=abc';
        const mockResponse = 'response-x';

        markdownService
          .getSource(mockSrc)
          .subscribe(data => {
            expect(data).toEqual('```js\n' + mockResponse + '\n```');
          });

        http.expectOne(mockSrc).flush(mockResponse);
      });
    });

    describe('highlight', () => {

      it('should not call Prism or throw when platform is not browser', () => {

        const mockHtmlElement = document.createElement('div');

        global['Prism'] = { highlightAllUnder: () => {} };

        spyOn(Prism, 'highlightAllUnder');

        markdownService['platform'] = 'server';

        expect(() => markdownService.highlight(mockHtmlElement)).not.toThrow();
        expect(Prism.highlightAllUnder).not.toHaveBeenCalled();
      });

      it('should not call Prism when not available', () => {

        const mockHtmlElement = document.createElement('div');

        global['Prism'] = undefined;

        expect(() => markdownService.highlight(mockHtmlElement)).not.toThrow();
      });

      it('should add `language-none` class on code blocks with no language class', () => {

        const preElement = document.createElement('pre');
        const codeElement = document.createElement('code');
        preElement.appendChild(codeElement);

        global['Prism'] = { highlightAllUnder: () => {} };

        markdownService.highlight(preElement);

        expect(codeElement.classList).toContain('language-none');
      });

      it('should not add `language-none` class on code blocks with language class', () => {

        const preElement = document.createElement('pre');
        const codeElement = document.createElement('code');
        codeElement.classList.add('language-mock');
        preElement.appendChild(codeElement);

        global['Prism'] = { highlightAllUnder: () => {} };

        markdownService.highlight(preElement);

        expect(codeElement.classList).not.toContain('language-none');
        expect(codeElement.classList).toContain('language-mock');
      });

      it('should not add `language-none` class on element other than code blocks without language class', () => {

        const divElement = document.createElement('div');
        const codeElement = document.createElement('code');
        codeElement.classList.add('language-mock');
        divElement.appendChild(codeElement);

        global['Prism'] = { highlightAllUnder: () => {} };

        markdownService.highlight(divElement);

        expect(codeElement.classList).not.toContain('language-none');
        expect(codeElement.classList).toContain('language-mock');
      });

      it('should call Prism when available and element parameter is present', () => {

        const mockHtmlElement = document.createElement('div');

        global['Prism'] = { highlightAllUnder: () => {} };

        spyOn(Prism, 'highlightAllUnder');

        markdownService.highlight(mockHtmlElement);

        expect(Prism.highlightAllUnder).toHaveBeenCalledWith(mockHtmlElement);
      });

      it('should call Prism when available and element parameter is ommited/null/undefined', () => {

        global['Prism'] = { highlightAllUnder: () => {} };

        spyOn(Prism, 'highlightAllUnder');

        const useCases = [
          () => markdownService.highlight(),
          () => markdownService.highlight(null!),
          () => markdownService.highlight(undefined),
        ];

        useCases.forEach(func => {
          func();
          expect(Prism.highlightAllUnder).toHaveBeenCalledWith(document);
          Prism.highlightAllUnder.calls.reset();
        });
      });
    });

    describe('renderKatex', () => {

      it('should not call katex or throw when platform is not browser', () => {

        const mockRaw = '$E=mc^2$';

        global['katex'] = { renderToString: (tex: string, options?: KatexOptions) => '' };

        spyOn(katex, 'renderToString');

        markdownService['platform'] = 'server';

        expect(() => markdownService.renderKatex(mockRaw)).not.toThrowError();
        expect(katex.renderToString).not.toHaveBeenCalled();
      });

      it('should throw when katex is called but not loaded', () => {

        global['katex'] = undefined;

        expect(() => markdownService.renderKatex('$example$')).toThrowError(errorKatexNotLoaded);

        global['katex'] = { renderToString: undefined };

        expect(() => markdownService.renderKatex('$example$')).toThrowError(errorKatexNotLoaded);
      });

      it('should call katex with math expressions', () => {

        global['katex'] = { renderToString: (tex: string, options?: KatexOptions) => '' };

        spyOn(katex, 'renderToString');

        const useCases = [
          { tex: '$E=mc^2$' },
          { tex: '$x^2 + y^2 = z^2$', options: { displayMode: true } },
        ];

        useCases.forEach(useCase => {
          markdownService.renderKatex(useCase.tex, useCase.options);
          expect(katex.renderToString).toHaveBeenCalledWith(useCase.tex.replace(/\$/gm, ''), useCase.options);
          katex.renderToString.calls.reset();
        });
      });
    });
  });
});
