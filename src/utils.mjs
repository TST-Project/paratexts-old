import fs from 'fs';
import xpath from 'xpath';
import jsdom from 'jsdom';

const make = {
    xml: (str) => {
        const dom = new jsdom.JSDOM('');
        const parser = new dom.window.DOMParser();
        return parser.parseFromString(str,'text/xml');
    },
    html: (str) => {
        return (new jsdom.JSDOM(str)).window.document;
    },
    header: (arr) => {
        const cells = arr.map(str => `<th>${str}</th>`).join('');
        return `<tr id="head">${cells}</tr>`;
    },
};

//const persDoc = new DOMParser().parseFromString( fs.readFileSync('../authority-files/authority/authority/persons_base.xml',{encoding:'utf-8'}) ).documentElement;
const persDoc = make.xml( fs.readFileSync('../authority-files/authority/authority/persons_base.xml',{encoding:'utf-8'}) );

const util = {
    innertext: el => {
        var synch, inner, milestone, placement;
        if(el.nodeName === 'seg') {
            milestone = util.milestone(el);
            placement = util.placement(el) || '';
            synch = el.closest('text').getAttribute('synch');
            inner = el.innerHTML;
        }
        else {
            const loc = el.querySelector('locus');
            const subtype = el.getAttribute('subtype') || '';
            milestone = loc ? loc.textContent : '';
            placement = subtype.replace(/\s/g,', ').replace(/-/g,' ');
            synch = el.getAttribute('synch');
            const q = el.querySelector('q,quote');
            inner = q ? q.innerHTML : '';
        }
        return {inner: inner, synch: synch, milestone: milestone, placement: placement};
    },
    milestone: (el) => {
        const getUnit = (el) => {
            const m = el.ownerDocument.querySelector('extent > measure');
            if(m) return m.getAttribute('unit');
            return '';
        };

        var p = util.prev(el);
        while(p) {
            if(!p) return false;
            if(p.nodeName === 'text') return false;
            if(p.nodeName === 'pb' || 
                (p.nodeName === 'milestone' && check.isFolio(p.getAttribute('unit')) )
            ) 
                return (p.getAttribute('unit') || getUnit(p) || '') + ' ' + 
                       (p.getAttribute('n') || '');
            p = util.prev(p);
        }
    },

    placement: (el) => {
        var p = util.prev(el);
        while(p) {
            if(!p) return '';
            if(p.nodeName === 'text') return '';
            if(p.nodeName === 'milestone') {
                if(check.isFolio(p.getAttribute('unit')) ) return ''; 
                const u = (p.getAttribute('unit') || '').replace(/-/g,' ');
                return u + ' ' + (p.getAttribute('n') || '');
            }
            p = util.prev(p);
        }
    },

    prev: (e)  => {
        if(e.previousElementSibling) return e.previousElementSibling;
        if(e.parentNode.previousElementSibling) {
            if(e.parentNode.previousElementSibling.lastChild)
                return e.parentNode.previousElementSibling.lastElementChild;
            else return e.parentNode.previousElementSibling;
        }
        return false;
    },

    personlookup: (str) => {
        const result = xpath.select(`//*[local-name(.)="persName" and text()="${str}"]`,persDoc,true);
        if(result) return result.closest('person').querySelector('persName[type="standard"]').textContent;
        else return false;
    },
};

const check = {
    isFolio: (str) => str === 'folio' || str === 'page' || str === 'plate',
};

export { util, make, check };
