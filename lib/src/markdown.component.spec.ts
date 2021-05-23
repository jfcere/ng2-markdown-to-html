import { ElementRef } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { first } from 'rxjs/operators';

import { KatexOptions } from './katex-options';
import { MarkdownComponent } from './markdown.component';
import { MarkdownModule } from './markdown.module';
import { MarkdownService } from './markdown.service';

describe('MarkdownComponent', () => {
  let fixture: ComponentFixture<MarkdownComponent>;
  let component: MarkdownComponent;
  let markdownService: MarkdownService;

  beforeEach(waitForAsync(() => {
    void TestBed.configureTestingModule({
      imports: [
        MarkdownModule.forRoot(),
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    markdownService = TestBed.inject(MarkdownService);
    fixture = TestBed.createComponent(MarkdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('data', () => {

    it('should call render with provided data when set', () => {

      const spyRender = spyOn(component, 'render');

      const useCases = [
        '',
        '# Markdown',
        '<p>Html</p>',
      ];

      useCases.forEach(data => {
        component.data = data;
        component.ngOnChanges();
        expect(component.render).toHaveBeenCalledWith(data);
        spyRender.calls.reset();
      });
    });

    it('should return value correctly when get', () => {

      const mockData = '# Markdown';

      component.data = mockData;

      expect(component.data).toBe(mockData);
    });
  });

  describe('src', () => {

    it('should call render with retreived content when set', waitForAsync(() => {

      const mockSrc = './src-example/file.md';
      const mockContent = 'source-content';

      spyOn(component, 'render');
      spyOn(markdownService, 'getSource').and.returnValue(of(mockContent));

      component.src = mockSrc;

      component.ngOnChanges();

      expect(markdownService.getSource).toHaveBeenCalledWith(mockSrc);
      expect(component.render).toHaveBeenCalledWith(mockContent);
    }));

    it('should return value correctly when get', () => {

      const mockSrc = './src-example/file.md';

      spyOn(markdownService, 'getSource').and.returnValue(of());

      component.src = mockSrc;

      expect(component.src).toBe(mockSrc);
    });

    it('should emit load when get', () => {

      const mockSrc = './src-example/file.md';
      const mockSrcReturn = 'src-return-value';

      spyOn(markdownService, 'getSource').and.returnValue(of(mockSrcReturn));
      spyOn(component.load, 'emit');

      component.src = mockSrc;

      component.ngOnChanges();

      expect(component.load.emit).toHaveBeenCalledWith(mockSrcReturn);
    });

    it('should emit error when and error occurs', () => {

      const mockSrc = './src-example/file.md';
      const mockError = 'error-x';

      spyOn(markdownService, 'getSource').and.returnValue(throwError(mockError));
      spyOn(component.error, 'emit');

      component.src = mockSrc;

      component.ngOnChanges();

      expect(component.error.emit).toHaveBeenCalledWith(mockError);
    });
  });

  describe('ngAfterViewInit', () => {

    it('should call render method and decodeHtml when neither data or src input property is provided', () => {

      const mockHtmlElement = document.createElement('div');
      mockHtmlElement.innerHTML = 'inner-html';

      spyOn(markdownService, 'getSource').and.returnValue(of());

      component.element = new ElementRef(mockHtmlElement);
      component.data = undefined;
      component.src = undefined;

      spyOn(component, 'render');

      component.ngAfterViewInit();

      expect(component.render).toHaveBeenCalledWith(mockHtmlElement.innerHTML, true);
    });

    it('should not call render method when src is provided', () => {

      const mockHtmlElement = document.createElement('div');
      mockHtmlElement.innerHTML = 'inner-html';

      spyOn(markdownService, 'getSource').and.returnValue(of());

      component.element = new ElementRef(mockHtmlElement);
      component.src = './src-example/file.md';

      spyOn(component, 'render');

      component.ngAfterViewInit();

      expect(component.render).not.toHaveBeenCalled();
    });

    it('should not call render method when data is provided', () => {

      const mockHtmlElement = document.createElement('div');
      mockHtmlElement.innerHTML = 'inner-html';

      component.element = new ElementRef(mockHtmlElement);
      component.data = '# Markdown';

      spyOn(component, 'render');

      component.ngAfterViewInit();

      expect(component.render).not.toHaveBeenCalled();
    });

    it('should rerender content on demand', () => {

      spyOn(component, 'loadContent');

      markdownService.reload();

      expect(component.loadContent).toHaveBeenCalled();
    });
  });

  describe('render', () => {

    it('should set innerHTML with compiled/decoded html markdown when decodeHtml is true', () => {

      const raw = '### Raw';
      const decoded = '<h3>Compiled</h3>';

      spyOn(markdownService, 'compile').and.callFake((markdown: string, decodeHtml: boolean, emojify: boolean) => {
        return decodeHtml ? decoded : '';
      });

      component.render(raw, true);

      expect(markdownService.compile).toHaveBeenCalledWith(raw, true, false);
      expect(component.element.nativeElement.innerHTML).toBe(decoded);
    });

    it('should set innerHTML with compiled/undecoded html markdown when decodeHtml is omitted/false/null/undefined', () => {

      const raw = '### Raw';
      const undecoded = '<h3>Compiled-Undecoded</h3>';

      spyOn(markdownService, 'compile').and.callFake((markdown: string, decodeHtml: boolean, emojify: boolean) => {
        return decodeHtml ? '' : undecoded;
      });

      component.render(raw);

      expect(markdownService.compile).toHaveBeenCalledWith(raw, false, false);
      expect(component.element.nativeElement.innerHTML).toBe(undecoded);

      component.render(raw, false);

      expect(markdownService.compile).toHaveBeenCalledWith(raw, false, false);
      expect(component.element.nativeElement.innerHTML).toBe(undecoded);

      component.render(raw, null!);

      expect(markdownService.compile).toHaveBeenCalledWith(raw, false, false);
      expect(component.element.nativeElement.innerHTML).toBe(undecoded);

      component.render(raw, undefined);

      expect(markdownService.compile).toHaveBeenCalledWith(raw, false, false);
      expect(component.element.nativeElement.innerHTML).toBe(undecoded);
    });

    it('should set innerHTML with compiled/decoded html markdown', () => {

      const raw = '### Raw';
      const compiled = '<h3>Compiled</h3>';

      spyOn(markdownService, 'compile').and.returnValue(compiled);

      component.render(raw);

      expect(markdownService.compile).toHaveBeenCalledWith(raw, false, false);
      expect(component.element.nativeElement.innerHTML).toBe(compiled);
    });

    it('should apply highlight', () => {

      spyOn(markdownService, 'highlight');

      component.render('### Raw');

      expect(markdownService.highlight).toHaveBeenCalledWith(component.element.nativeElement);
    });

    it('should handle lineNumbers plugin correctly', () => {

      const markdown = '```javascript\nconst random = \'Math.random();\n```';
      const getHTMLPreElement = () => (fixture.nativeElement as HTMLElement).querySelector('pre');

      component.lineNumbers = true;
      component.render(markdown);

      expect(getHTMLPreElement()?.classList).toContain('line-numbers');
      expect(getHTMLPreElement()?.attributes.getNamedItem('data-start')).toBeNull();

      component.start = 5;
      component.render(markdown);

      expect(getHTMLPreElement()?.attributes.getNamedItem('data-start')?.value).toBe('5');
    });

    it('should handle lineHighlight plugin correctly', () => {

      const markdown = '```javascript\nconst random = \'Math.random();\n```';
      const getHTMLPreElement = () => (fixture.nativeElement as HTMLElement).querySelector('pre');

      component.lineHighlight = true;
      component.line = '6, 10-16';
      component.render(markdown);

      expect(getHTMLPreElement()?.attributes.getNamedItem('data-line')?.value).toBe('6, 10-16');
      expect(getHTMLPreElement()?.attributes.getNamedItem('data-line-offset')).toBeNull();

      component.lineOffset = 5;
      component.render(markdown);

      expect(getHTMLPreElement()?.attributes.getNamedItem('data-line-offset')?.value).toBe('5');
    });

    it('should apply emoji plugin correctly', () => {

      const raw = 'I :heart: ngx-markdown';
      const emojified = 'I ❤️ ngx-markdown';

      spyOn(markdownService, 'compile').and.callFake((markdown: string, decodeHtml: boolean, emojify: boolean) => {
        return emojify ? emojified : '';
      });

      component.emoji = true;
      component.render(raw);

      expect(markdownService.compile).toHaveBeenCalledWith(raw, false, true);
      expect(component.element.nativeElement.innerHTML).toBe(emojified);
    });

    it('should apply katex plugin correctly', () => {

      const markdown = '$E=mc^2$';
      const katexOptions: KatexOptions = { errorColor: '#ff00dd', throwOnError: true };
      const compiled = '<p>$E=mc^2$</p>';

      spyOn(markdownService, 'compile').and.returnValue(compiled);
      spyOn(markdownService, 'renderKatex');

      component.katex = true;
      component.katexOptions = katexOptions;
      component.render(markdown);

      expect(markdownService.renderKatex).toHaveBeenCalledWith(compiled, katexOptions);
    });

    it('should emit `ready` when done parsing', waitForAsync(() => {

      const markdown = '# Markdown';
      const compiled = '<h1 id="markdown">Markdown</h1>';

      spyOn(markdownService, 'compile').and.returnValue(compiled);
      spyOn(markdownService, 'renderKatex').and.returnValue(compiled);
      spyOn(markdownService, 'highlight');

      component.ready
        .pipe(first())
        .subscribe(() => {
          expect(markdownService.compile).toHaveBeenCalled();
          expect(markdownService.renderKatex).toHaveBeenCalled();
          expect(markdownService.highlight).toHaveBeenCalled();
          expect(component.element.nativeElement.innerHTML).toBe(compiled);
        });

      component.katex = true;
      component.render(markdown);
    }));
  });
});
