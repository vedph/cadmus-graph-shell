import { Edge, Node as GraphNode } from '@swimlane/ngx-graph';
import { BehaviorSubject, forkJoin, Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import {
  GraphService,
  LinkedLiteralFilter,
  LinkedNodeFilter,
  NodeSourceType,
  TripleFilter,
  TripleGroup,
  UriNode,
  UriTriple,
} from './graph.service';

// #region Shapes
// All these shapes will be the data property of a Node/Edge in ngx-graph.

/**
 * Essential graph walker data.
 */
export interface WalkerData {
  originId: string;
  // https://github.com/swimlane/ngx-graph/issues/312
  customColor?: string;
  hidden?: boolean;
}

/**
 * Graph walker widget data, i.e. a node or a property group.
 */
export interface WalkerWidgetData extends WalkerData {
  selected?: boolean;
  expanded?: boolean;
  error?: string;
}

/**
 * Graph walker node data.
 * ID: "N" + nodeid (e.g. "N3").
 */
export interface WalkerNodeData extends WalkerWidgetData {
  uri: string;
  sourceType: NodeSourceType;
  isClass?: boolean;
  sid?: string;
  tag?: string;
  outFilter: TripleFilter;
  inFilter: TripleFilter;
  outTotal?: number;
  inTotal?: number;
}

/**
 * Graph walker property group data.
 * ID: "P" + propertyid + "N" + source nodeid ("P2N3").
 */
export interface WalkerPropData extends WalkerWidgetData {
  uri: string;
  outFilter: LinkedNodeFilter;
  inFilter: LinkedNodeFilter;
  litFilter: LinkedLiteralFilter;
  outTotal?: number;
  inTotal?: number;
  litTotal?: number;
}

/**
 * Graph walker literal node data.
 * ID: "L" + tripleid (e.g. "L5").
 */
export interface WalkerLitData extends WalkerWidgetData {
  value: string;
  type?: string;
  language?: string;
  number?: number;
}

/**
 * The total counts of items fetched by each children graph nodes filter.
 */
export interface NodeChildTotals {
  pOut: number;
  pIn: number;
  pLit: number;
  nOut: number;
  nIn: number;
}
//#endregion

/**
 * Graph walker.
 * This class encapsulates data used for interactively exploring a graph
 * starting from a designated origin node.
 */
export class GraphWalker {
  private readonly _nodes$: BehaviorSubject<GraphNode[]>;
  private readonly _edges$: BehaviorSubject<Edge[]>;
  // TODO: add clusters
  private readonly _loading$: BehaviorSubject<boolean>;
  private readonly _error$: BehaviorSubject<string | null>;
  private _rootNode?: GraphNode;

  private readonly _selectedNode$: BehaviorSubject<GraphNode | null>;
  private readonly _pOutFilter$: BehaviorSubject<LinkedNodeFilter | null>;
  private readonly _pInFilter$: BehaviorSubject<LinkedNodeFilter | null>;
  private readonly _pLitFilter$: BehaviorSubject<LinkedLiteralFilter | null>;
  private readonly _nOutFilter$: BehaviorSubject<TripleFilter | null>;
  private readonly _nInFilter$: BehaviorSubject<TripleFilter | null>;
  private readonly _childTotals$: BehaviorSubject<NodeChildTotals>;

  /**
   * The page size. Default is 10.
   */
  public pageSize: number;

  /**
   * Max length of literal value to show. Default is 30.
   */
  public maxLiteralLen: number;

  /**
   * The nodes of the walker graph, which can represent nodes, literals,
   * or property groups. You can easily determine the type of each node
   * by looking at the first character of its id (N=node, L=literal,
   * P=property).
   */
  public get nodes$(): Observable<GraphNode[]> {
    return this._nodes$.asObservable();
  }

  /**
   * The edges connecting nodes.
   */
  public get edges$(): Observable<Edge[]> {
    return this._edges$.asObservable();
  }

  /**
   * True if the walker is loading data.
   */
  public get loading$(): Observable<boolean> {
    return this._loading$.asObservable();
  }

  /**
   * The last error occurred in communicating with the server, if any.
   */
  public get error$(): Observable<string | null> {
    return this._error$.asObservable();
  }

  /**
   * The selected node. Only one node at a time can be selected.
   */
  public get selectedNode$(): Observable<GraphNode | null> {
    return this._selectedNode$.asObservable();
  }
  /**
   * The outbound linked nodes filter for the selected P node.
   */
  public get pOutFilter$(): Observable<LinkedNodeFilter | null> {
    return this._pOutFilter$.asObservable();
  }
  /**
   * The inbound linked nodes filter for the selected P node.
   */
  public get pInFilter$(): Observable<LinkedNodeFilter | null> {
    return this._pInFilter$.asObservable();
  }
  /**
   * The literal linked nodes filter for the selected P node.
   */
  public get pLitFilter$(): Observable<LinkedLiteralFilter | null> {
    return this._pLitFilter$.asObservable();
  }
  /**
   * The outbound triples filter for the selected N node.
   */
  public get nOutFilter$(): Observable<TripleFilter | null> {
    return this._nOutFilter$.asObservable();
  }
  /**
   * The inbound triples filter for the selected N node.
   */
  public get nInFilter$(): Observable<TripleFilter | null> {
    return this._nInFilter$.asObservable();
  }
  /**
   * The total items fetched for each filter of the selected node.
   */
  public get childTotals$(): Observable<NodeChildTotals> {
    return this._childTotals$.asObservable();
  }

  constructor(private _graphService: GraphService) {
    this._nodes$ = new BehaviorSubject<GraphNode[]>([]);
    this._edges$ = new BehaviorSubject<Edge[]>([]);
    this._loading$ = new BehaviorSubject<boolean>(false);
    this._error$ = new BehaviorSubject<string | null>(null);
    this._selectedNode$ = new BehaviorSubject<GraphNode | null>(null);
    this._pOutFilter$ = new BehaviorSubject<LinkedNodeFilter | null>(null);
    this._pInFilter$ = new BehaviorSubject<LinkedNodeFilter | null>(null);
    this._pLitFilter$ = new BehaviorSubject<LinkedLiteralFilter | null>(null);
    this._nOutFilter$ = new BehaviorSubject<TripleFilter | null>(null);
    this._nInFilter$ = new BehaviorSubject<TripleFilter | null>(null);
    this._childTotals$ = new BehaviorSubject<NodeChildTotals>({
      nOut: 0,
      nIn: 0,
      pOut: 0,
      pIn: 0,
      pLit: 0,
    });
    // defaults
    this.pageSize = 10;
    this.maxLiteralLen = 30;
  }

  public getSelectedNode(): GraphNode | null {
    return this._selectedNode$.value;
  }

  private toggleLoading(on: boolean): void {
    if (on) {
      this._error$.next(null);
      this._loading$.next(true);
    } else {
      this._loading$.next(false);
    }
  }

  private setError(error: any): void {
    if (error) {
      if (typeof error === 'string') {
        this._error$.next(error);
        console.error(error);
      } else {
        this._error$.next('Walker error');
        console.error(JSON.stringify(error));
      }
    } else {
      this._error$.next('Walker error');
    }
  }

  private buildNodeId(id: number): string {
    return `N${id}`;
  }

  /**
   * Get the numeric ID of the data node being the source of the graph node
   * with the specified ID.
   *
   * @param id The graph node ID (...N + its data node numeric ID)
   * @returns The data node numeric ID.
   */
  private getNodeNumericId(id: string): number {
    const i = id.indexOf('N');
    return i === -1 ? 0 : +id.substring(i + 1);
  }

  private getPredicateNumericId(id: string): number {
    const i = id.indexOf('P');
    const j = id.indexOf('N');
    return i === -1 ? 0 : +id.substring(i + 1, j);
  }

  private buildEdgeId(source: string, target: string): string {
    return `E${source}_${target}`;
  }

  private buildPropertyId(predicateId: number, nodeId: number): string {
    return `P${predicateId}N${nodeId}`;
  }

  private buildLiteralId(tripleId: number): string {
    return `L${tripleId}`;
  }

  private scale(
    n: number,
    domainMin: number,
    domainMax: number,
    rangeMin: number,
    rangeMax: number
  ): number {
    // https://stackoverflow.com/questions/5294955/how-to-scale-down-a-range-of-numbers-with-a-known-min-and-max-value
    return (
      ((domainMax - domainMin) * (n - rangeMin)) / (rangeMax - rangeMin) +
      domainMin
    );
  }

  private addEdgeIfAbsent(edge: Edge, edges: Edge[]): void {
    const id = edge.id!;
    if (edges.some((e) => e.id === id)) {
      return;
    }
    const i = id.indexOf('_');
    if (i > -1) {
      const invId = 'E' + id.substring(i + 1) + '_' + id.substring(1, i);
      if (edges.some((e) => e.id === invId)) {
        return;
      }
    }
    edges.push(edge);
  }

  private resetFilters(): void {
    this._nOutFilter$.next(null);
    this._nInFilter$.next(null);
    this._pOutFilter$.next(null);
    this._pInFilter$.next(null);
    this._pLitFilter$.next(null);
    this._childTotals$.next({
      nOut: 0,
      nIn: 0,
      pOut: 0,
      pIn: 0,
      pLit: 0,
    });
  }

  /**
   * Select the specified node. This also implies updating all the current
   * filters, which depend on the selected node.
   *
   * @param id The node ID or null to deselect the selected node.
   */
  public selectNode(id: string | null): void {
    const node = id ? this._nodes$.value.find((n) => n.id === id) : null;
    if (!node) {
      this._selectedNode$.next(null);
      this.resetFilters();
      return;
    }
    // deselect
    const old = this._nodes$.value.find((n) => n.data?.selected);
    if (old) {
      old.data.selected = undefined;
    }
    // select
    node.data.selected = true;
    this._selectedNode$.next(node);

    switch (node.id.charAt(0)) {
      case 'N': // non-literal node
        const nd = node.data as WalkerNodeData;
        this._nOutFilter$.next(nd.outFilter);
        this._nInFilter$.next(nd.inFilter);
        this._pOutFilter$.next(null);
        this._pInFilter$.next(null);
        this._pLitFilter$.next(null);
        this._childTotals$.next({
          nOut: nd.outTotal || 0,
          nIn: nd.inTotal || 0,
          pOut: 0,
          pIn: 0,
          pLit: 0,
        });
        break;
      case 'P': // props group
        const pd = node.data as WalkerPropData;
        this._nOutFilter$.next(null);
        this._nInFilter$.next(null);
        this._pOutFilter$.next(pd.outFilter);
        this._pInFilter$.next(pd.inFilter);
        this._pLitFilter$.next(pd.litFilter);
        this._childTotals$.next({
          nOut: 0,
          nIn: 0,
          pOut: pd.outTotal || 0,
          pIn: pd.inTotal || 0,
          pLit: pd.litTotal || 0,
        });
        break;
      case 'L': // literal node
        this.resetFilters();
        break;
    }
  }

  /**
   * Reset the graph setting its origin to the specified node.
   *
   * @param id The ID of the origin node to start from ("root origin").
   */
  public reset(id: number): void {
    this.toggleLoading(true);
    this._graphService
      .getNode(id)
      .pipe(take(1))
      .subscribe({
        next: (node) => {
          const nodes: GraphNode[] = [];
          const data: WalkerNodeData = {
            uri: node.uri,
            sourceType: node.sourceType,
            originId: '', // root origin
            customColor: '#F89427',
            outFilter: {
              pageNumber: 1,
              pageSize: this.pageSize,
            },
            inFilter: {
              pageNumber: 1,
              pageSize: this.pageSize,
            },
          };
          const n: GraphNode = {
            id: this.buildNodeId(node.id),
            label: node.label || node.uri,
            data: data,
          };
          nodes.push(n);
          this._rootNode = n;

          this._edges$.next([]);
          this._nodes$.next(nodes);
          this.expandNode(n);
        },
        error: (error) => {
          this.setError(error);
        },
        complete: () => {
          this.toggleLoading(false);
        },
      });
  }

  /**
   * Get the source and target graph nodes IDs from the specified edge ID.
   *
   * @param edgeId The ID of the edge graph node.
   * @returns IDs of the source and target graph nodes.
   */
  private getEdgeEndIds(edgeId: string): string[] | null {
    const m = new RegExp('^E([^_]+)_(.+)$').exec(edgeId);
    return m ? [m[1], m[2]] : null;
  }

  /**
   * Remove all the nodes with the specified origin node ID.
   *
   * @param originId The ID of the origin graph node.
   * @param nodes The nodes array to remove nodes from.
   * @param removedIds The IDs of all the removed nodes.
   */
  private removeDescendantNodes(
    originId: string,
    nodes: GraphNode[],
    removedIds: Set<string>
  ) {
    const ids = new Set<string>();
    for (let i = nodes.length - 1; i > -1; i--) {
      if (nodes[i].data.originId === originId) {
        ids.add(nodes[i].id);
        nodes.splice(i, 1);
      }
    }

    // recurse for each removed node
    // (edges never derive from other edges directly)
    ids.forEach((id) => {
      this.removeDescendantNodes(id, nodes, removedIds);
    });

    // update the received IDs set
    ids.forEach((id) => {
      removedIds.add(id);
    });
  }

  /**
   * Remove all the children graph nodes of the specified origin graph node.
   *
   * @param originId The ID of the origin graph node.
   * @param nodes The nodes array to remove nodes from.
   * @param edges The edges array to remove edges from.
   */
  private removeChildren(
    originId: string,
    nodes: GraphNode[],
    edges: Edge[]
  ): void {
    const selectedId = this._selectedNode$.value?.id;

    // remove all the nodes whose origin ID matches,
    // collecting their IDs
    const removedIds: Set<string> = new Set<string>();
    this.removeDescendantNodes(originId, nodes, removedIds);

    // remove all the affected edges
    for (let i = edges.length - 1; i > -1; i--) {
      const endIds = this.getEdgeEndIds(edges[i].id!);
      if (
        endIds?.length &&
        (removedIds.has(endIds[0]) || removedIds.has(endIds[1]))
      ) {
        edges.splice(i, 1);
      }
    }

    // if the removed node was the selected one, select the root origin
    if (selectedId && removedIds.has(selectedId)) {
      this.selectNode(this._rootNode!.id);
    }
  }

  /**
   * Build a new graph node representing a property.
   *
   * @param sourceId The source node ID.
   * @param group The triple group emitting this node.
   * @returns A new graph node.
   */
  private buildPropertyNode(sourceId: string, group: TripleGroup): GraphNode {
    const nid = this.getNodeNumericId(sourceId);
    const data: WalkerPropData = {
      originId: sourceId,
      uri: group.predicateUri,
      customColor: '#FF5619',
      outFilter: {
        pageNumber: 1,
        pageSize: this.pageSize,
        otherNodeId: nid,
        predicateId: group.predicateId,
      },
      inFilter: {
        pageNumber: 1,
        pageSize: this.pageSize,
        otherNodeId: nid,
        predicateId: group.predicateId,
      },
      litFilter: {
        pageNumber: 1,
        pageSize: this.pageSize,
        predicateId: group.predicateId,
      },
    };

    return {
      id: this.buildPropertyId(group.predicateId, nid),
      label: group.count.toString(),
      data: data,
    };
  }

  /**
   * Expand the specified node, by loading its property groups.
   *
   * @param node The node to expand.
   * @param outFilter The properties to update for the output filter.
   * @param inFilter The properties to update for the input filter.
   */
  public expandNode(
    node: GraphNode,
    outFilter?: Partial<TripleFilter> | null,
    inFilter?: Partial<TripleFilter> | null
  ): void {
    // prepare filters
    const nid = this.getNodeNumericId(node.id);
    // outbound: node=S
    const outf: TripleFilter = outFilter
      ? Object.assign(node.data.outFilter, outFilter, {
          subjectId: nid,
        })
      : {
          pageNumber: 1,
          pageSize: this.pageSize,
          subjectId: nid,
        };
    // inbound: node=O
    const inf: TripleFilter = inFilter
      ? Object.assign(node.data.inFilter, inFilter, {
          objectId: nid,
        })
      : {
          pageNumber: 1,
          pageSize: this.pageSize,
          objectId: nid,
        };

    // load
    this.toggleLoading(true);
    const nodes = [...this._nodes$.value];
    const edges = [...this._edges$.value];

    forkJoin({
      outs: this._graphService.getTripleGroups(outf),
      ins: this._graphService.getTripleGroups(inf),
    }).subscribe({
      next: (result) => {
        node.data.expanded = true;

        // update origin's filters
        node.data.outFilter = outf;
        node.data.inFilter = inf;

        // remove previous children
        this.removeChildren(node.id, nodes, edges);

        // add outbound children
        node.data.outTotal = result.outs.total;
        for (let i = 0; i < result.outs.items.length; i++) {
          const group = result.outs.items[i];
          const prop = this.buildPropertyNode(node.id, group);
          // when expanding a node (e.g. N17) into props, the prop's ID is
          // P + predicate ID + N + origin node ID (e.g. P30N17).
          // This prop node can then be expanded, too, thus producing
          // a node with ID = N + node ID. When this in turn gets expanded,
          // it will produce also the prop node it comes from, which
          // must not be re-inserted in the graph. This node in the new
          // expansion context will get ID from the source node, which
          // is different from the node at the other end of the prop node:
          // this was e.g. N17, while the new node is e.g. N18. So, the
          // prop previously identified as P30N17 would now be identified
          // as P30N18, thus producing a duplicate. To avoid this, we
          // calculate an alias ID from the origin's origin: for N18,
          // its origin being P30N17, this will be N17. This produces an
          // alias P30N17, which being already present will avoid duplicates.
          const aliasId = `P${group.predicateId}N${this.getNodeNumericId(
            node.data.originId
          )}`;
          if (!nodes.some((n) => n.id === prop.id || n.id === aliasId)) {
            nodes.push(prop);

            // edge from origin node to object property
            const edge = {
              id: this.buildEdgeId(node.id, prop.id),
              label: group.predicateUri,
              source: node.id,
              target: prop.id,
              data: {
                originId: node.id,
              },
            };
            this.addEdgeIfAbsent(edge, edges);
          }
        }

        // add inbound children
        node.data.inTotal = result.ins.total;
        for (let i = 0; i < result.ins.items.length; i++) {
          const g = result.ins.items[i];
          // subject property
          const p = this.buildPropertyNode(node.id, g);
          // edge from object property to origin node
          const edge = {
            id: this.buildEdgeId(p.id, node.id),
            label: g.predicateUri,
            source: p.id,
            target: node.id,
            data: {
              originId: node.id,
            },
          };

          // do not add an edge having the same source P and target N,
          // whatever the P's source node
          const r = new RegExp(
            '^EP' + g.predicateId + 'N[0-9]+_' + node.id + '$'
          );
          if (!edges.some((e) => r.test(e.id!))) {
            if (!nodes.some((n) => n.id === p.id)) {
              nodes.push(p);
            }
            this.addEdgeIfAbsent(edge, edges);
          }
        }

        // update
        this._nodes$.next(nodes);
        this._edges$.next(edges);
      },
      error: (error) => {
        node.data.error = 'Error loading properties';
        this._nodes$.next(nodes);
        this.setError(error);
      },
      complete: () => {
        this.toggleLoading(false);
      },
    });
  }

  /**
   * Expand the selected node, by loading its property groups.
   *
   * @param outFilter The properties to update for the output filter.
   * @param inFilter The properties to update for the input filter.
   */
  public expandSelectedNode(
    outFilter?: Partial<TripleFilter> | null,
    inFilter?: Partial<TripleFilter> | null
  ): void {
    if (
      !this._selectedNode$.value ||
      !this._selectedNode$.value.id.startsWith('N')
    ) {
      return;
    }
    const node = this._selectedNode$.value;
    this.expandNode(node, outFilter, inFilter);
  }

  private buildLiteralLabel(triple: UriTriple): string {
    let value = triple.objectLiteral || '';
    if (this.maxLiteralLen && value.length > this.maxLiteralLen) {
      value = value.substring(0, this.maxLiteralLen) + '\u2026';
    }
    return value;
  }

  private buildNonLiteralNode(sourceId: string, node: UriNode): GraphNode {
    const nid = this.getNodeNumericId(sourceId);
    const data: WalkerNodeData = {
      originId: sourceId,
      customColor: '#80ff95',
      uri: node.uri,
      sourceType: node.sourceType,
      isClass: node.isClass,
      sid: node.sid,
      tag: node.tag,
      outFilter: {
        pageNumber: 0,
        pageSize: this.pageSize,
        subjectId: nid,
      },
      inFilter: {
        pageNumber: 0,
        pageSize: this.pageSize,
        objectId: nid,
      },
    };
    return {
      id: this.buildNodeId(node.id),
      label: node.label,
      data: data,
    };
  }

  private buildLiteralNode(sourceId: string, triple: UriTriple): GraphNode {
    const data: WalkerLitData = {
      originId: sourceId,
      customColor: '#ebe2e0',
      value: triple.objectLiteral || '',
      type: triple.literalType,
      language: triple.literalLanguage,
      number: triple.literalNumber,
    };
    return {
      id: this.buildLiteralId(triple.id),
      label: this.buildLiteralLabel(triple),
      data: data,
    };
  }

  /**
   * Expand the currently selected properties group node, by loading its
   * outbound nodes, inbound nodes, and literal nodes.
   *
   * @param node The property group node to expand.
   * @param outFilter The properties to update for the outbound nodes filter.
   * @param inFilter The properties to update for the inbound nodes filter.
   * @param litFilter The properties to update for the literal nodes filter.
   */
  public expandProperty(
    node: GraphNode,
    outFilter?: Partial<LinkedNodeFilter> | null,
    inFilter?: Partial<LinkedNodeFilter> | null,
    litFilter?: Partial<LinkedLiteralFilter> | null
  ): void {
    // prepare filters
    const nid = this.getNodeNumericId(node.id);
    const data: WalkerPropData = node.data;
    const outf: LinkedNodeFilter = Object.assign(
      data.outFilter,
      outFilter || {},
      { isObject: true }
    );
    const inf: LinkedNodeFilter = Object.assign(data.inFilter, inFilter || {}, {
      isObject: false,
    });
    const litf: LinkedLiteralFilter = Object.assign(
      data.litFilter,
      litFilter || {},
      { subjectId: nid, predicateId: this.getPredicateNumericId(node.id) }
    );

    // load
    this.toggleLoading(true);
    const nodes = [...this._nodes$.value];
    const edges = [...this._edges$.value];

    forkJoin({
      outs: this._graphService.getLinkedNodes(outf),
      ins: this._graphService.getLinkedNodes(inf),
      lits: this._graphService.getLinkedLiterals(litf),
    }).subscribe({
      next: (result) => {
        node.data.expanded = true;

        // update origin's filters
        node.data.outFilter = outf;
        node.data.inFilter = inf;
        node.data.litFilter = litf;

        // remove previous children
        this.removeChildren(node.id, nodes, edges);

        // add outbound children
        node.data.outTotal = result.outs.total;
        for (let i = 0; i < result.outs.items.length; i++) {
          const child = result.outs.items[i];
          const obj = this.buildNonLiteralNode(node.id, child);
          if (!nodes.some((n) => n.id === obj.id)) {
            nodes.push(obj);
          }
          // edge from property to non literal object node
          const edge = {
            id: this.buildEdgeId(node.id, obj.id),
            label: '',
            source: node.id,
            target: obj.id,
            data: {
              originId: node.id,
            },
          };
          this.addEdgeIfAbsent(edge, edges);
        }

        // add inbound children
        node.data.inTotal = result.ins.total;
        for (let i = 0; i < result.ins.items.length; i++) {
          const child = result.ins.items[i];
          const subj = this.buildNonLiteralNode(node.id, child);
          if (!nodes.some((n) => n.id === subj.id)) {
            nodes.push(subj);
          }
          // edge from subject node to property
          const edge = {
            id: this.buildEdgeId(subj.id, node.id),
            label: '',
            source: subj.id,
            target: node.id,
            data: {
              originId: node.id,
            },
          };
          this.addEdgeIfAbsent(edge, edges);
        }

        // add literal children
        node.data.litTotal = result.lits.total;
        for (let i = 0; i < result.lits.items.length; i++) {
          const triple = result.lits.items[i];
          const lit = this.buildLiteralNode(node.id, triple);
          if (!nodes.some((n) => n.id === lit.id)) {
            nodes.push(lit);
          }

          // edge from property to literal
          const edge = {
            id: this.buildEdgeId(node.id, lit.id),
            label: lit.data.literalType || '',
            source: node.id,
            target: lit.id,
            data: {
              originId: node.id,
            },
          };
          this.addEdgeIfAbsent(edge, edges);
        }

        // update
        this._nodes$.next(nodes);
        this._edges$.next(edges);
      },
      error: (error) => {
        node.data.error = 'Error loading nodes';
        this._nodes$.next(nodes);
        this.setError(error);
      },
      complete: () => {
        this.toggleLoading(false);
      },
    });
  }

  /**
   * Expand the currently selected properties group node, by loading its
   * outbound nodes, inbound nodes, and literal nodes. If there is no
   * selection, or the selected node is not a properties group node, nothing
   * is done.
   *
   * @param outFilter The properties to update for the outbound nodes filter.
   * @param inFilter The properties to update for the inbound nodes filter.
   * @param litFilter The properties to update for the literal nodes filter.
   */
  public expandSelectedProperty(
    outFilter?: Partial<LinkedNodeFilter> | null,
    inFilter?: Partial<LinkedNodeFilter> | null,
    litFilter?: Partial<LinkedLiteralFilter> | null
  ): void {
    if (
      !this._selectedNode$.value ||
      !this._selectedNode$.value.id.startsWith('P')
    ) {
      return;
    }
    const node = this._selectedNode$.value;
    this.expandProperty(node, outFilter, inFilter, litFilter);
  }

  /**
   * Toggle the specified node by expanding or collapsing it.
   *
   * @param node The node to toggle.
   */
  public toggleNode(node: GraphNode): void {
    if (node.data.expanded) {
      const nodes = [...this._nodes$.value];
      const edges = [...this._edges$.value];
      this.removeChildren(node.id, nodes, edges);
      node.data.expanded = undefined;
      this._nodes$.next(nodes);
      this._edges$.next(edges);
    } else {
      if (node.id.startsWith('N')) {
        this.expandNode(node);
      } else if (node.id.startsWith('P')) {
        this.expandProperty(node);
      }
    }
  }
}
