import { Component, OnInit } from '@angular/core';
import { EnvService } from '@myrmidon/ng-tools';
import { take } from 'rxjs';

import { Node as GraphNode } from '@swimlane/ngx-graph';
import { GraphService } from '@myrmidon/cadmus-api';

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
      // .getNodeByUri('itn:events/83072b67-4019-4722-a967-c74bed325681/alpha-sent')
      .pipe(take(1))
      .subscribe((node) => {
        this.nodeId = node.id;
      });
  }

  public onNodePick(node: GraphNode): void {
    console.log(JSON.stringify(node, null, 2));
  }
}
