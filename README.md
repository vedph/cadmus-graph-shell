# Cadmus Graph Shell

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.3.7.

This is a demo shell for playing with the Cadmus frontend graph components, not intended for production. The backend used in this demo is at the [Cadmus Graph repository](https://github.com/vedph/cadmus-graph).

- 📖 [graph documentation](https://myrmex.github.io/overview/cadmus/dev/concepts/graph/)
- 🛠️ [backend repository](https://github.com/vedph/cadmus-graph)
- 👀 [graph walker video](https://www.youtube.com/watch?v=P0TlqbOi590)

## Docker

🐋 The Docker image is used for demo/diagnostic purposes.

1. `npm run build-ui`;
2. `ng build --configuration=production`;
3. `docker build . -t vedph2020/cadmus-graph-shell:0.1.1 -t vedph2020/cadmus-graph-shell:latest` (replace with the current version).

## History

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
