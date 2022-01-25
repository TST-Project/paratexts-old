import * as d3 from 'https://cdn.skypack.dev/d3@7';

import {ForceGraph} from './disjunctgraph.mjs';

const makeChart = (data) => ForceGraph(data, {
  nodeId: d => d.id,
  nodeGroup: d => d.group,
  nodeTitle: d => `${d.id} (${d.group})`,
  linkStrokeWidth: l => Math.sqrt(l.value),
  width: window.innerWidth,
  height: window.innerHeight,
  invalidation: null // a promise to stop the simulation when the cell is re-run
});

export { makeChart };
