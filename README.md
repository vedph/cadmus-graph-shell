# Cadmus Graph Shell

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.3.7.

This is a demo shell for playing with the Cadmus frontend graph components, not intended for production. The backend used in this demo is at the [Cadmus Graph repository](https://github.com/vedph/cadmus-graph).

- 📖 [graph documentation](https://myrmex.github.io/overview/cadmus/dev/concepts/graph/)
- 🛠️ [backend repository](https://github.com/vedph/cadmus-graph)
- 👀 [graph walker video](https://www.youtube.com/watch?v=P0TlqbOi590)

To use this library in your Cadmus app:

(1) `npm i @swimlane/ngx-graph @myrmidon/cadmus-graph-ui-ex`.

(2) in your `package.json`, ensure to override the d3 selection dependency to fix `ngx-graph` issues:

```json
  "overrides": {
    "d3-selection": "3.0.0"
  },
```

(3) in your app routes module, import the library like:

```ts
  // cadmus - graph
  {
    path: 'graph',
    loadChildren: () =>
      import('@myrmidon/cadmus-graph-pg-ex').then(
        (module) => module.CadmusGraphPgExModule
      ),
    canActivate: [AuthJwtGuardService],
  },
```

## Docker

🐋 The Docker image is used for demo/diagnostic purposes.

1. `npm run build-lib` (you can use `publish.bat` to publish the library to NPM);
2. `ng build --configuration=production`;
3. `docker build . -t vedph2020/cadmus-graph-shell:0.1.1 -t vedph2020/cadmus-graph-shell:latest` (replace with the current version).

## History

- 2023-08-07: updated Angular.
- 2023-06-30: updated Angular.
- 2023-05-31: updated Angular.

### 1.0.3

- 2023-05-19: fixed missing sid in node and added check to emit move to source only when sid is present.

### 1.0.2

- 2023-05-19: added move to source event.
- 2023-05-18:
  - updated Angular and packages.
  - added a toggle button in the toolbar to toggle the selected node expansion. This is alternative to double click, which might be difficult in some devices.
  - removed `aliasId` check in graph walker expand node (see below).

The `aliasId` check seems to be redundant and harmful. Think of a sample like this:

- N80 alpha-sent:
  - P7N80 a
  - P47N80 took place at
    - N81 Arezzo
      - P7N81 a
        - N28 E53 place

Now, when expanding N81, we get P7N81 as outbound, and P47N81 as inbound. This would cause N81 not to be expanded for P7N81.

- 2023-05-11: updated to Angular 16.
- 2023-03-28: updated Angular and packages.
- 2023-02-17:
  - moved graph service to `@myrmidon/cadmus-api`.
  - renamed filter components tags to avoid clashes.

### 0.1.1

- 2023-02-16:
  - style improvements.
  - replaced lookup with brick.

### 0.1.0

- 2023-02-15: updated Angular to 15:
  - removed Angular flex layout, replaced with CSS and media queries.
  - fix to [issues with d3 version used by ngx graph](https://github.com/swimlane/ngx-graph/issues/487#issuecomment-1419718384) by adding an `overrides` section in `package.json`.
- 2022-09-17: updated packages.
- 2022-08-04: updated packages.

### 0.0.1

- 2022-07-29: initial release.
