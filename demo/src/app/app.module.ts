import { HttpClient, HttpClientModule } from '@angular/common/http';
import { NgModule, SecurityContext } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MarkdownModule, MarkedOptions, MarkedRenderer } from 'ngx-markdown';

import { AnchorModule } from '@shared/anchor/anchor.module';
import { AnchorService } from '@shared/anchor/anchor.service';
import { SharedModule } from '@shared/shared.module';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MarkdownRerenderComponent } from './markdown-rerender/markdown-rerender.component';
import { FormsModule } from '@angular/forms';

export function markedOptionsFactory(anchorService: AnchorService): MarkedOptions {
  const renderer = new MarkedRenderer();

  // fix `href` for absolute link with fragments so that _copy-paste_ urls are correct
  renderer.link = (href: string, title: string, text: string) => {
    return MarkedRenderer.prototype.link.call(renderer, anchorService.normalizeExternalUrl(href), title, text) as string;
  };

  return { renderer };
}

@NgModule({
  imports: [
    AnchorModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MarkdownModule.forRoot({
      loader: HttpClient,
      markedOptions: {
        provide: MarkedOptions,
        useFactory: markedOptionsFactory,
        deps: [AnchorService],
      },
      sanitize: SecurityContext.NONE,
    }),
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatToolbarModule,
    SharedModule,
    FormsModule,
  ],
  declarations: [AppComponent, MarkdownRerenderComponent],
  bootstrap: [AppComponent],
})
export class AppModule { }
