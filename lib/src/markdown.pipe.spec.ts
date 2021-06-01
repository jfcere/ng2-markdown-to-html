import { ElementRef, NgZone } from '@angular/core';
import { fakeAsync, TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';

import { MarkdownModule } from './markdown.module';
import { MarkdownPipe } from './markdown.pipe';
import { MarkdownService } from './markdown.service';

describe('MarkdownPipe', () => {
  let domSanitizer: DomSanitizer;
  const elementRef = new ElementRef(document.createElement('div'));
  let markdownService: MarkdownService;
  let pipe: MarkdownPipe;
  let zone: NgZone;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MarkdownModule.forRoot(),
      ],
    });
  });

  beforeEach(() => {
    domSanitizer = TestBed.inject(DomSanitizer);
    markdownService = TestBed.inject(MarkdownService);
    zone = TestBed.inject(NgZone);
    pipe = new MarkdownPipe(domSanitizer, elementRef, markdownService, zone);
  });

  it('should return empty string when value is null/undefined', () => {

    const markdowns: any[] = [undefined, null];

    markdowns.forEach(markdown => {
      const result = pipe.transform(markdown);
      expect(result).toBe('');
    });
  });

  it('should log error and return value when parameter is not a string', () => {

    const markdowns: any[] = [0, {}, [], /regex/];

    spyOn(console, 'error');

    markdowns.forEach(markdown => {
      const result = pipe.transform(markdown);

      expect(result).toBe(markdown);
      expect(console.error).toHaveBeenCalledWith(`MarkdownPipe has been invoked with an invalid value type [${typeof markdown}]`);
    });
  });

  it('should apply synthax highlight when zone is stable', fakeAsync(() => {

    const markdown = '# Markdown';

    spyOn(markdownService, 'highlight');

    pipe.transform(markdown);

    expect(markdownService.highlight).not.toHaveBeenCalled();

    zone.onStable.emit(null);

    expect(markdownService.highlight).toHaveBeenCalledWith(elementRef.nativeElement);
  }));

  it('should return compiled markdown', () => {

    const markdown = '# Markdown';
    const mockCompiled = 'compiled-x';
    const mockBypassSecurity = 'bypass-x';

    spyOn(markdownService, 'compile').and.returnValue(mockCompiled);
    spyOn(domSanitizer, 'bypassSecurityTrustHtml').and.returnValue(mockBypassSecurity);

    const result = pipe.transform(markdown);

    expect(markdownService.compile).toHaveBeenCalledWith(markdown);
    expect(domSanitizer.bypassSecurityTrustHtml).toHaveBeenCalledWith(mockCompiled);
    expect(result).toBe(mockBypassSecurity);
  });
});
