import * as d3 from 'https://cdn.skypack.dev/d3@7';

import {ForceGraph} from './disjunctgraph.mjs';

const makeChart = (data) => ForceGraph(data, {
  nodeId: d => d.id,
  nodeGroup: d => d.group,
  nodeTitle: d => d.group ? `${d.id} (${d.group})` : `${d.id} (${d.groups.join(', ')})`,
  linkStrokeWidth: l => Math.sqrt(l.value),
  width: window.innerWidth,
  height: window.innerHeight,
  invalidation: null // a promise to stop the simulation when the cell is re-run
});

const toolTip = {
    make: function(e,targ) {
        const toolText = targ.querySelector('desc').innerHTML;
        if(!toolText) return;

        var tBox = document.getElementById('tooltip');
        const tBoxDiv = document.createElement('div');

        if(tBox) {
            for(const kid of tBox.childNodes) {
                if(kid.myTarget === targ)
                    return;
            }
            tBoxDiv.appendChild(document.createElement('hr'));
        }
        else {
            tBox = document.createElement('div');
            tBox.id = 'tooltip';
            tBox.style.top = (e.clientY + 10) + 'px';
            tBox.style.left = e.clientX + 'px';
            tBox.style.opacity = 0;
            tBox.style.transition = 'opacity 0.2s ease-in';
            document.body.appendChild(tBox);
            tBoxDiv.myTarget = targ;
        }

        tBoxDiv.appendChild(document.createTextNode(toolText));
        tBoxDiv.myTarget = targ;
        tBox.appendChild(tBoxDiv);
        targ.addEventListener('mouseleave',toolTip.remove,{once: true});
        window.getComputedStyle(tBox).opacity;
        tBox.style.opacity = 1;
    },
    remove: function(e) {
        const tBox = document.getElementById('tooltip');
        if(tBox.children.length === 1) {
            tBox.remove();
            return;
        }

        const targ = e.target;
        for(const kid of tBox.childNodes) {
            if(kid.myTarget === targ) {
                kid.remove();
                break;
            }
        }
        if(tBox.children.length === 1) {
            const kid = tBox.firstChild.firstChild;
            if(kid.tagName === 'HR')
                kid.remove();
        }
    },
};

const chartMouseover = (e) => {
    const targ = e.target.closest('circle');
    if(targ)
        toolTip.make(e,targ);
};

export { makeChart, chartMouseover };
