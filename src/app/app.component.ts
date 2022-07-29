import { Component, OnInit } from '@angular/core';
import { EnvService } from '@myrmidon/ng-tools';
import { GraphService } from 'projects/myrmidon/cadmus-graph-ui/src/public-api';
import { take } from 'rxjs';

import { Node as GraphNode } from '@swimlane/ngx-graph';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public nodeId: number;
  public version: string;

  constructor(private _graphService: GraphService, env: EnvService) {
    this.nodeId = 0;
    this.version = env.get('version') || '';
  }

  ngOnInit(): void {
    this._graphService
      .getNodeByUri('x:guys/francesco_petrarca')
      .pipe(take(1))
      .subscribe((node) => {
        this.nodeId = node.id;
      });
  }

  public onNodePick(node: GraphNode): void {
    console.log(node.id);
  }
}
