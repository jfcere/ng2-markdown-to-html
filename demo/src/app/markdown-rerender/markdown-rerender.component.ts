import { Component, OnInit } from '@angular/core';
import { MarkdownService } from 'ngx-markdown';

@Component({
  selector: 'app-markdown-rerender',
  templateUrl: './markdown-rerender.component.html',
  styleUrls: ['./markdown-rerender.component.css']
})
export class MarkdownRerenderComponent implements OnInit {

  private _accentColor = "";
  private readonly ZERO_WIDTH_SPACE = "​"; // This is NOT an empty string!

  get accentColor() {
    return this._accentColor;
  }
  set accentColor(value: string) {
    if (this._accentColor === value) {
      return;
    }

    this._accentColor = value;
    this.changeAccentColor();
  }

  constructor(
    private markdownService: MarkdownService
  ) {}

  ngOnInit() {
    this.changeAccentColor();
  }

  private changeAccentColor() {
    const styleAttribute = this.accentColor
      ? ` style="color: ${this.accentColor}"`
      : "";
    this.markdownService.renderer.heading = (text: string, level: number) => {
      return `<h${level}${styleAttribute}>${text}</h${level}>`;
    };
    /*this.markdown += this.ZERO_WIDTH_SPACE;
    setTimeout(
      () => (this.markdown = this.markdown.replace(this.ZERO_WIDTH_SPACE, ""))
    );*/
    this.markdownService.reload();
  }

  markdown = `## Markdown __rulez__!
---

### Syntax highlight
\`\`\`typescript
const language = 'typescript';
\`\`\`

### Lists
1. Ordered list
2. Another bullet point
  - Unordered list
  - Another unordered bullet point

### Blockquote
> Blockquote to the max`;
}
