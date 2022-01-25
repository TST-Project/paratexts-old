import fs from 'fs';
import xlsx from 'xlsx';
import SaxonJS from 'saxon-js';
import { Sanscript } from './sanscript.mjs';
import { util, make, check } from './utils.mjs';

const xsltSheet = fs.readFileSync('./xslt/tei-to-html-reduced.json',{encoding:'utf-8'});

const output = {
    blessings: (data,templatestr) => {

        const blessingsredux = function(acc,cur,cur1) {
            
            const ret = util.innertext(cur);
            const inner = ret.inner;
            const placement = ret.placement;
            const milestone = ret.milestone;
            const synch = ret.synch;

            const unit = synch ? synch.replace(/^#/,'') : '';
            const processed = SaxonJS.transform({
                stylesheetText: xsltSheet,
                sourceText: '<TEI xmlns="http://www.tei-c.org/ns/1.0">'+inner+'</TEI>',
                destination: 'serialized'},'sync');
            const res = processed.principalResult || '';
            const txt = Sanscript.t(
                res.replace(/[\n\s]+/g,' ').replace(/\s%nobreak%/g,'').trim(),
                'tamil','iast');
            return acc + 
                `<tr>
                <td>
                ${txt}
                </td>
                <td><a href="${cur1.fname}">${cur1.cote.text}</a></td>
                <td>
                ${cur1.repo}
                </td>
                <td>
                ${cur1.title}
                </td>
                <td>
                ${unit}
                </td>
                <td>
                ${milestone}
                </td>
                <td>
                ${placement}
                </td>
                </tr>\n`;
        };
        
        const template = make.html(templatestr);

        const title = template.querySelector('title');
        title.textContent = `${title.textContent}: Blessings`;
        template.body.style.backgroundImage ='url("blessings-tile.png")';
        template.body.style.backgroundAttachment = 'fixed';
        template.body.backgroundRepeat = 'repeat';

        const table = template.querySelector('#index').firstElementChild;
        const tstr = data.reduce((acc, cur) => {
            if(cur.blessings.length > 0) {
                const lines = [...cur.blessings].reduce((acc2,cur2) => blessingsredux(acc2,cur2,cur),'');
                return acc + lines;
            }
            else return acc;
        },'');
        const thead = make.header(['Blessing','Shelfmark','Repository','Title','Unit','Page/folio','Placement']);
        table.innerHTML = thead + tstr;
        table.querySelectorAll('th')[1].classList.add('sorttable_alphanum');
        fs.writeFile('../blessings.html',template.documentElement.outerHTML,{encoding: 'utf8'},function(){return;});
    },
   
    xslxblessings: (data) => {

        const xslx_Sheet = fs.readFileSync('xslt/blessings-xlsx.json',{encoding:'utf-8'});
        const xslx_Sheet_clean = fs.readFileSync('xslt/blessings-xlsx-clean.json',{encoding:'utf-8'});
        const xlsxredux = function(acc,cur,cur1) {
            
            const ret = util.innertext(cur);
            const inner = ret.inner;
            const placement = ret.placement;
            const milestone = ret.milestone;
            const synch = ret.synch;

            const unit = synch ? synch.replace(/^#/,'') : '';

            const processed = SaxonJS.transform({
                stylesheetText: xslx_Sheet,
                sourceText: '<TEI xmlns="http://www.tei-c.org/ns/1.0">'+inner+'</TEI>',
                destination: 'serialized'},'sync');
            const processed2 = SaxonJS.transform({
                stylesheetText: xslx_Sheet_clean,
                sourceText: '<TEI xmlns="http://www.tei-c.org/ns/1.0">'+inner+'</TEI>',
                destination: 'serialized'},'sync');
            const txt = processed.principalResult.replace(/[\n\s]+/g,' ').replace(/\s%nobreak%/g,'').trim();
            const cleantxt = Sanscript.t(
                processed2.principalResult.replace(/[\n\s]+/g,' ').replace(/\s%nobreak%/g,'').replace(/[|•-]|=(?=\w)/g,'').trim(),
                'tamil','iast');
            const tunai = Array.from(cleantxt.matchAll(/tuṇai/g)).length;
            
            return `<tr><td>${txt}</td><td>${cleantxt}</td><td>${cur1.cote.text}</td><td>${cur1.repo}</td><td>${cur1.title}</td><td>${unit}</td><td>${milestone}</td><td>${placement}</td><td>${tunai}</td></tr>`;
        };

        const xslxdoc = make.html('');
        const htmltab = xslxdoc.createElement('table');
        const tabbod = xslxdoc.createElement('tbody');
        const xslxstr = data.reduce((acc, cur) => {
            if(cur.blessings.length > 0) {
                const lines = [...cur.blessings].reduce((acc2,cur2) => xlsxredux(acc2,cur2,cur),'');
                return acc + lines;
            }
            else return acc;
        },'');
        tabbod.innerHTML = xslxstr;
        htmltab.appendChild(tabbod);
        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.table_to_sheet(htmltab);
        xlsx.utils.book_append_sheet(wb,ws,'blessings');
        xlsx.writeFile(wb,'../blessings.xlsx');
    },

    colophons: (data,templatestr) => {
        const colophonredux = function(acc,cur,cur1) {
            
            const inner = cur.innerHTML;
            const loc = cur.querySelector('locus');
            const processed = SaxonJS.transform({
                stylesheetText: xsltSheet,
                sourceText: '<TEI xmlns="http://www.tei-c.org/ns/1.0">'+inner+'</TEI>',
                destination: 'serialized'},'sync');
            const res = processed.principalResult || '';
            const txt = Sanscript.t(
                res.replace(/[\n\s]+/g,' ').replace(/\s%nobreak%/g,'').trim(),
                'tamil','iast');
            return acc + 
        `<tr>
        <td>
        ${txt}
        </td>
        <td><a href="${cur1.fname}">${cur1.cote.text}</a></td>
        <td>
        ${cur1.repo}
        </td>
        <td>
        ${cur1.title}
        </td>
        </tr>\n`;
        };

        const template = make.html(templatestr);

        const title = template.querySelector('title');
        title.textContent = `${title.textContent}: Colophons`;
        
        const thead = make.header(['Colophon','Shelfmark','Repository','Title']);
        const tstr = data.reduce((acc, cur) => {
            if(cur.colophons.length > 0) {
                const lines = [...cur.colophons].reduce((acc2,cur2) => colophonredux(acc2,cur2,cur),'');
                return acc + lines;
            }
            else return acc;
        },'');

        const table = template.querySelector('#index').firstElementChild;
        table.innerHTML = thead + tstr;
        table.querySelectorAll('th')[1].classList.add('sorttable_alphanum');

        fs.writeFile('../colophons.html',template.documentElement.outerHTML,{encoding: 'utf8'},function(){return;});
    },
    tbcs: (data,templatestr) => {

        const tbcsredux = function(acc,cur,cur1) {
            
            const ret = util.innertext(cur);
            const inner = ret.inner;
            const placement = ret.placement;
            const milestone = ret.milestone;
            const synch = ret.synch;

            const unit = synch ? synch.replace(/^#/,'') : '';
            const processed = SaxonJS.transform({
                stylesheetText: xsltSheet,
                sourceText: '<TEI xmlns="http://www.tei-c.org/ns/1.0">'+inner+'</TEI>',
                destination: 'serialized'},'sync');
            const res = processed.principalResult || '';
            const txt = Sanscript.t(
                res.replace(/[\n\s]+/g,' ').replace(/\s%nobreak%/g,'').trim(),
                'tamil','iast');
            return acc + 
                `<tr>
                <td>
                ${txt}
                </td>
                <td><a href="${cur1.fname}">${cur1.cote.text}</a></td>
                <td>
                ${cur1.repo}
                </td>
                <td>
                ${cur1.title}
                </td>
                <td>
                ${unit}
                </td>
                <td>
                ${milestone}
                </td>
                <td>
                ${placement}
                </td>
                </tr>\n`;
        };
        
        const template = make.html(templatestr);

        const title = template.querySelector('title');
        title.textContent = `${title.textContent}: TBC`;

        const table = template.querySelector('#index').firstElementChild;
        const tstr = data.reduce((acc, cur) => {
            if(cur.tbcs.length > 0) {
                const lines = [...cur.tbcs].reduce((acc2,cur2) => tbcsredux(acc2,cur2,cur),'');
                return acc + lines;
            }
            else return acc;
        },'');
        const thead = make.header(['Paratext','Shelfmark','Repository','Title','Unit','Page/folio','Placement']);
        table.innerHTML = thead + tstr;
        table.querySelectorAll('th')[1].classList.add('sorttable_alphanum');
        fs.writeFile('../tbcs.html',template.documentElement.outerHTML,{encoding: 'utf8'},function(){return;});
    },
    persons: (data, templatestr) => {

        const peepredux = function(acc,cur,cur1) {
            const txt = Sanscript.t(
                cur.name.replace(/[\n\s]+/g,' ').trim(),
                'tamil','iast');
            return acc + 
        `<tr>
        <td>
        ${txt}
        </td>
        <td>
        ${cur.role}
        </td>
        <td><a href="${cur1.fname}">${cur1.cote.text}</a></td>
        <td>
        ${cur1.repo}
        </td>
        <td>
        ${cur1.title}
        </td>
        </tr>\n`;
        };
        const template = make.html(templatestr);
        const table = template.querySelector('#index').firstElementChild;

        const title = template.querySelector('title');
        title.textContent = `${title.textContent}: Persons`;

        const tstr = data.reduce((acc, cur) => {
            if(cur.persons.length > 0) {
                const lines = [...cur.persons].reduce((acc2,cur2) => peepredux(acc2,cur2,cur),'');
                return acc + lines;
            }
            else return acc;
        },'');
        const thead = make.header(['Person','Role','Shelfmark','Repository','Title']);
        table.innerHTML = thead + tstr;
        table.querySelectorAll('th')[2].classList.add('sorttable_alphanum');
        fs.writeFile('../persons.html',template.documentElement.outerHTML,{encoding: 'utf8'},function(){return;});
    },
    personsnetwork: (data, templatestr) => {

        const peepmap = function(cur,cur1) {
            const txt = Sanscript.t(
                cur.name.replace(/[\n\s]+/g,' ').trim(),
                'tamil','iast');
            return {
                name: txt,
                role: cur.role,
                fname: cur1.fname,
                cote: cur1.repo + ' ' + cur1.cote.text,
            }
        };

        const peepredux = (acc, cur) => {
            
            if(!cur.role) return acc;

            const cleanname = cur.name;

            if(!acc.has(cleanname))
                acc.set(cleanname, {roles: new Set([cur.role]), texts: new Set([cur.cote])});
            else {
                const oldrec = acc.get(cleanname);
                oldrec.texts.add(cur.cote);
                oldrec.roles.add(cur.role);
            }

            return acc;
        };

        const template = make.html(templatestr);
        template.body.style.margin = '0 auto';
        template.body.style.paddingLeft = '0';
        const section = template.querySelector('section');
        section.innerHTML = '';

        const title = template.querySelector('title');
        title.textContent = `${title.textContent}: Persons`;
        
        const persarr = data.reduce((acc, cur) => {
            if(cur.persons.length > 0) {
                return acc.concat( [...cur.persons].map((cur2) => peepmap(cur2,cur)) );
            }
            else return acc;
        },[]);

        const allpeeps = persarr.reduce(peepredux,new Map());
        
        const links = [];
        const nodes = [];
        const texts = new Set();

        allpeeps.forEach((peep,key) => {
            for(const text of peep.texts) {
                links.push({source: key, target: text, value: 1});
                texts.add(text);
            }
            nodes.push({id: key, group: [...peep.roles].join(', ')});
            });

        for(const text of texts) nodes.push({id: text, group: 'manuscript'});
       
        const json = JSON.stringify({nodes: nodes, links: links});
        
        const script = template.createElement('script');
        script.setAttribute('type','module');
        script.innerHTML =
`import { makeChart } from './persons.mjs';
const graph = ${json}
document.querySelector('section').appendChild(makeChart(graph));`;
        template.body.appendChild(script);
        fs.writeFile('../persons-network.html',template.documentElement.outerHTML,{encoding: 'utf8'},function(){return;});
    },
};

export { output };
