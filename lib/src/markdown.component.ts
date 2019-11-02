import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { MarkedOptions } from 'ngx-markdown';
import { ClipboardRenderer } from './clipboard-renderer';
import { KatexOptions } from './katex-options';
import { MarkdownService } from './markdown.service';
import { PrismPlugin } from './prism-plugin';


@Component({
  // tslint:disable-next-line:component-selector
  selector: 'markdown, [markdown]',
  template: '<ng-content></ng-content>',
})
export class MarkdownComponent implements OnChanges, AfterViewInit {
  @Input() data: string;
  @Input() src: string;

  // Plugin - katex
  @Input()
  get katex(): boolean { return this._katex; }
  set katex(value: boolean) { this._katex = this.coerceBooleanProperty(value); }
  @Input() katexOptions: KatexOptions;

  // Plugin - lineNumbers
  @Input()
  get lineNumbers(): boolean { return this._lineNumbers; }
  set lineNumbers(value: boolean) { this._lineNumbers = this.coerceBooleanProperty(value); }
  @Input() start: number;

  // Plugin - lineHighlight
  @Input()
  get lineHighlight(): boolean { return this._lineHighlight; }
  set lineHighlight(value: boolean) { this._lineHighlight = this.coerceBooleanProperty(value); }
  @Input() line: string | string[];
  @Input() lineOffset: number;

  @Output() error = new EventEmitter<string>();
  @Output() load = new EventEmitter<string>();

  @Output() buttonClick = new EventEmitter<Element>();

  private _katex = false;
  private _lineHighlight = false;
  private _lineNumbers = false;

  constructor(
    public element: ElementRef<HTMLElement>,
    public markdownService: MarkdownService,
  ) { }

  ngOnChanges() {
    if (this.data != null) {
      this.handleData();
      return;
    }
    if (this.src != null) {
      this.handleSrc();
      return;
    }
  }

  ngAfterViewInit() {
    if (!this.data && !this.src) {
      this.handleTransclusion();
    }
  }

  render(markdown: string, decodeHtml = false) {
    this.markdownService.options = this.getMarkedOptions(this.buttonClick);
    let compiled = this.markdownService.compile(markdown, decodeHtml);
    compiled = this.katex ? this.markdownService.renderKatex(compiled, this.katexOptions) : compiled;
    this.element.nativeElement.innerHTML = compiled;
    this.handlePlugins();
    this.markdownService.highlight(this.element.nativeElement);
    this.markdownService.handleClipboard(this.element.nativeElement, this.buttonClick);
  }

  private getMarkedOptions(emitter: EventEmitter<Element>): MarkedOptions {
    if (this.markdownService.isClipboardCopyEnabled(emitter)) {
      const markedOptions = new MarkedOptions();
      markedOptions.renderer = new ClipboardRenderer();
      return markedOptions;
    } else {
      return this.markdownService.options;
    }
  }

  private coerceBooleanProperty(value: boolean): boolean {
    return value != null && `${value}` !== 'false';
  }

  private handleData() {
    this.render(this.data);
  }

  private handleSrc() {
    this.markdownService
      .getSource(this.src)
      .subscribe(
        markdown => {
          this.render(markdown);
          this.load.emit(markdown);
        },
        error => this.error.emit(error),
      );
  }

  private handleTransclusion() {
    this.render(this.element.nativeElement.innerHTML, true);
  }

  private handlePlugins() {
    if (this.lineHighlight) {
      this.setPluginClass(this.element.nativeElement, PrismPlugin.LineHighlight);
      this.setPluginOptions(this.element.nativeElement, { dataLine: this.line, dataLineOffset: this.lineOffset });
    }
    if (this.lineNumbers) {
      this.setPluginClass(this.element.nativeElement, PrismPlugin.LineNumbers);
      this.setPluginOptions(this.element.nativeElement, { dataStart: this.start });
    }
  }

  private setPluginClass(element: HTMLElement, plugin: string | string[]) {
    const preElements = element.querySelectorAll('pre');
    for (let i = 0; i < preElements.length; i++) {
      const classes = plugin instanceof Array ? plugin : [plugin];
      preElements.item(i).classList.add(...classes);
    }
  }

  private setPluginOptions(element: HTMLElement, options: object) {
    const preElements = element.querySelectorAll('pre');
    for (let i = 0; i < preElements.length; i++) {
      Object.keys(options).forEach(option => {
        const attributeValue = options[option];
        if (!!attributeValue) {
          const attributeName = this.toLispCase(option);
          preElements.item(i).setAttribute(attributeName, attributeValue.toString());
        }
      });
    }
  }

  private toLispCase(value: string) {
    const upperChars = value.match(/([A-Z])/g);
    if (!upperChars) {
      return value;
    }
    let str = value.toString();
    for (let i = 0, n = upperChars.length; i < n; i++) {
      str = str.replace(new RegExp(upperChars[i]), '-' + upperChars[i].toLowerCase());
    }
    if (str.slice(0, 1) === '-') {
      str = str.slice(1);
    }
    return str;
  }
}
