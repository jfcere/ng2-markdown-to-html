import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MarkdownRerenderComponent } from './markdown-rerender/markdown-rerender.component';

const routes: Routes = [
  {
    path: 'get-started',
    loadChildren: () => import('./get-started/get-started.module').then(m => m.GetStartedModule),
    data: { label: 'Get Started' },
  },
  {
    path: 'rerender',
    component: MarkdownRerenderComponent
  },
  {
    path: 'cheat-sheet',
    loadChildren: () => import('./cheat-sheet/cheat-sheet.module').then(m => m.CheatSheetModule),
    data: { label: 'Cheat Sheet' },
  },
  {
    path: 'syntax-highlight',
    loadChildren: () => import('./syntax-highlight/syntax-highlight.module').then(m => m.SyntaxHighlightModule),
    data: { label: 'Syntax Highlight' },
  },
  {
    path: 'bindings',
    loadChildren: () => import('./bindings/bindings.module').then(m => m.BindingsModule),
    data: { label: 'Bindings' },
  },
  {
    path: 'plugins',
    loadChildren: () => import('./plugins/plugins.module').then(m => m.PluginsModule),
    data: { label: 'Plugins' },
  },
  {
    path: '**',
    redirectTo: 'get-started',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      anchorScrolling: 'enabled',
      scrollOffset: [0, 64],
      scrollPositionRestoration: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule { }
