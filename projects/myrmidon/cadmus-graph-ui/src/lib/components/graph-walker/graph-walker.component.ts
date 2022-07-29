import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable, Subject, take } from 'rxjs';

import { Edge, Node as GraphNode } from '@swimlane/ngx-graph';
import { DialogService } from '@myrmidon/ng-mat-tools';

import { GraphWalker, NodeChildTotals } from '../../graph-walker';
import {
  GraphService,
  LinkedLiteralFilter,
  LinkedNodeFilter,
  TripleFilter,
} from '../../graph.service';

/**
 * Graph walker component. This starts from a given node, and let users
 * walk along edges to discover new nodes.
 */
@Component({
  selector: 'cadmus-graph-walker',
  templateUrl: './graph-walker.component.html',
  styleUrls: ['./graph-walker.component.css'],
})
export class GraphWalkerComponent implements OnInit {
  private readonly _walker: GraphWalker;
  private _nodeId: number;

  /**
   * The root origin node ID.
   */
  @Input()
  public get nodeId(): number {
    return this._nodeId;
  }
  public set nodeId(value: number) {
    this._nodeId = value;
    this.reset(value);
  }

  /**
   * True if user can pick a node from the graph.
   */
  @Input()
  public canPick?: boolean;

  /**
   * Emitted when a graph node is picked by user.
   */
  @Output()
  public nodePick: EventEmitter<GraphNode>;

  // graph
  public nodes$: Observable<GraphNode[]>;
  public edges$: Observable<Edge[]>;
  public loading$: Observable<boolean>;
  public error$: Observable<string | null>;
  // selected node
  public selectedNode$: Observable<GraphNode | null>;
  public pOutFilter$: Observable<LinkedNodeFilter | null>;
  public pInFilter$: Observable<LinkedNodeFilter | null>;
  public pLitFilter$: Observable<LinkedLiteralFilter | null>;
  public nOutFilter$: Observable<TripleFilter | null>;
  public nInFilter$: Observable<TripleFilter | null>;
  public childTotals$: Observable<NodeChildTotals>;

  // ngx-graph actions
  public update$: Subject<boolean> = new Subject();
  public center$: Subject<boolean> = new Subject();
  public zoomToFit$: Subject<boolean> = new Subject();

  constructor(graphService: GraphService, private _dialog: DialogService) {
    this._walker = new GraphWalker(graphService);
    this._nodeId = 0;
    this.nodePick = new EventEmitter<GraphNode>();

    this.nodes$ = this._walker.nodes$;
    this.edges$ = this._walker.edges$;
    this.loading$ = this._walker.loading$;
    this.error$ = this._walker.error$;

    this.selectedNode$ = this._walker.selectedNode$;
    this.pOutFilter$ = this._walker.pOutFilter$;
    this.pInFilter$ = this._walker.pInFilter$;
    this.pLitFilter$ = this._walker.pLitFilter$;
    this.nOutFilter$ = this._walker.nOutFilter$;
    this.nInFilter$ = this._walker.nInFilter$;
    this.childTotals$ = this._walker.childTotals$;
  }

  ngOnInit(): void {
    this.update$.subscribe((_) => {
      this.onReset();
    });
  }

  public onNodeSelect(node: GraphNode): void {
    this._walker.selectNode(node.id);
  }

  private reset(id: number): void {
    this._walker.reset(id);
  }

  public onReset(): void {
    if (!this._nodeId) {
      return;
    }
    this._dialog
      .confirm('Reset', 'Reset the whole graph?')
      .pipe(take(1))
      .subscribe((yes) => {
        if (yes) {
          this.reset(this._nodeId);
        }
      });
  }

  public onNodeDblClick(node: GraphNode): void {
    this._walker.toggleNode(node);
  }

  public onPOutFilterChange(filter: LinkedNodeFilter): void {
    this._walker.expandSelectedProperty(filter);
  }

  public onPInFilterChange(filter: LinkedNodeFilter): void {
    this._walker.expandSelectedProperty(null, filter);
  }

  public onPLitFilterChange(filter: LinkedLiteralFilter): void {
    this._walker.expandSelectedProperty(null, null, filter);
  }

  public onNOutFilterChange(filter: TripleFilter): void {
    this._walker.expandSelectedNode(filter);
  }

  public onNInFilterChange(filter: TripleFilter): void {
    this._walker.expandSelectedNode(null, filter);
  }

  public pickSelectedNode(): void {
    const node = this._walker.getSelectedNode();
    if (!node) {
      return;
    }
    this.nodePick.emit(node);
  }
}
