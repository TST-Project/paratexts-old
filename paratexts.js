// from https://stackoverflow.com/questions/28711653/sorting-string-function-by-custom-alphabet-javascript
function makeComparer(order) {
  var ap = Array.prototype;

  // mapping from character -> precedence
  var orderMap = {},
      max = order.length + 2;
  ap.forEach.call(order, function(char, idx) {
    orderMap[char] = idx + 1;
  });

  function compareChars(l, r) {
    var lOrder = orderMap[l] || max,
        rOrder = orderMap[r] || max;

    return lOrder - rOrder;
  }

  function compareStrings(l, r) {
    var minLength = Math.min(l.length, r.length);
    var result = ap.reduce.call(l.substring(0, minLength), function (prev, _, i) {
        return prev || compareChars(l[i], r[i]);
    }, 0);

    return result || (l.length - r.length);
  }

  return compareStrings;
}
sorttable.sort_alpha = function(a,b) {
    const comparer = makeComparer('aāiīuūeēoōkgṅcñṭṇtnpbfmyrlvḻḷṟṉjṣśh');
    return comparer(a[0].toLowerCase(),b[0].toLowerCase());
}
const docMouseover = function(e) {
    var targ = e.target.closest('[data-anno]');
    while(targ && targ.hasAttribute('data-anno')) {
        toolTip.make(e,targ);
        targ = targ.parentNode;
    }
};
const toolTip = {
    make: function(e,targ) {
        const toolText = targ.dataset.anno;
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
