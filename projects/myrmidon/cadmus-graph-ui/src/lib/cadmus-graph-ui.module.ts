import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NgxGraphModule } from '@swimlane/ngx-graph';

import { NgToolsModule } from '@myrmidon/ng-tools';
import { NgMatToolsModule } from '@myrmidon/ng-mat-tools';

import { GraphWalkerComponent } from './components/graph-walker/graph-walker.component';
import { TripleFilterComponent } from './components/triple-filter/triple-filter.component';
import { LinkedLiteralFilterComponent } from './components/linked-literal-filter/linked-literal-filter.component';
import { LinkedNodeFilterComponent } from './components/linked-node-filter/linked-node-filter.component';
import { GraphNodeLabelPipe } from './pipes/graph-node-label.pipe';
import { CadmusRefsLookupModule } from '@myrmidon/cadmus-refs-lookup';

@NgModule({
  declarations: [
    GraphNodeLabelPipe,
    GraphWalkerComponent,
    LinkedLiteralFilterComponent,
    LinkedNodeFilterComponent,
    TripleFilterComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    // material
    MatAutocompleteModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTabsModule,
    MatTooltipModule,
    // vendor
    NgxGraphModule,
    // Cadmus
    NgToolsModule,
    NgMatToolsModule,
    CadmusRefsLookupModule
  ],
  exports: [
    GraphNodeLabelPipe,
    GraphWalkerComponent,
    LinkedLiteralFilterComponent,
    LinkedNodeFilterComponent,
    TripleFilterComponent,
  ],
})
export class CadmusGraphUiModule {}
