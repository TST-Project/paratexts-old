const fs = require('fs');
const jsdom = require('jsdom');
const SaxonJS = require('saxon-js');
const Sanscript = require('./sanscript');
const xlsx = require('xlsx');

const xsltSheet = fs.readFileSync('./xslt/tei-to-html-reduced.json',{encoding:'utf-8'});

const dir = './mss/';

fs.readdir(dir,function(err,files) {
    if(err)
        return console.log(err);
    const flist = [];
    files.forEach(function(f) {
        if(/^[^_].+\.xml$/.test(f))
            flist.push(dir+f);
    });
    readfiles(flist);
});

const readfiles = function(arr) {
    const data = arr.map((f) => 
    {
        const xmlDoc = make.xml( fs.readFileSync(f,{encoding:'utf-8'}) );
        const fname = `https://tst-project.github.io/${f}`;
        return {
            blessings: find.blessings(xmlDoc),
            colophons: find.colophons(xmlDoc),
            cote: find.cote(xmlDoc),
            fname: `https://tst-project.github.io/${f}`,
            persons: find.allpersons(xmlDoc),
            repo: find.repo(xmlDoc),
            tbcs: find.tbcs(xmlDoc),
            title: find.title(xmlDoc)
        };
    });
    /*
    data.sort((a,b) => {
        if(a.sort  b.sort) return -1;
        else return 1;
    });
    */
    const templatestr = fs.readFileSync('template.html',{encoding:'utf8'});
    output.blessings(data,templatestr);
    console.log('Blessings compiled: blessings.html.');
    output.xslxblessings(data);
    console.log('Blessings Excel sheet compiled: blessings.xlsx.');
    output.tbcs(data,templatestr);
    console.log('TBC paratexts compiled: tbcs.html.');
    output.colophons(data,templatestr);
    console.log('Colophons compiled: colophons.html.');
    output.persons(data,templatestr);
    console.log('Persons compiled: persons.html.');
};
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
const find = {
    blessings: (xmlDoc) => xmlDoc.querySelectorAll('seg[function="blessing"], desc[type~="blessing"]'),

    colophons: (xmlDoc) => xmlDoc.querySelectorAll('colophon, seg[function="colophon"]'),

    cote: (xmlDoc) => {
        const txt = xmlDoc.querySelector('idno[type="shelfmark"]').textContent || '';
        const sort = txt.replace(/\d+/g,((match) => {
            return match.padStart(4,'0');
        }));
        return {text: txt, sort: sort};
    },

    repo: (xmlDoc) => {
        const names = new Map([
            ['Bibliothèque nationale de France. Département des Manuscrits','BnF'],
            ['Bibliothèque nationale de France. Département des Manuscrits.','BnF'],
            ['Staats- und UniversitätsBibliothek Hamburg Carl von Ossietzky','Hamburg Stabi'],
            ['Bodleian Library, University of Oxford','Oxford'],
            ['Cambridge University Library','Cambridge'],
            ['Bibliothèque universitaire des langues et civilisations','BULAC'],
            ['Private collection','private']
        ]);
        const repo = xmlDoc.querySelector('repository > orgName').textContent.replace(/\s+/g,' ');
        return names.get(repo); 
    },

    tbcs: (xmlDoc) => xmlDoc.querySelectorAll('seg[function="TBC"]'),

    title: (xmlDoc) => xmlDoc.querySelector('titleStmt > title').textContent.replace(/&/g,'&#38;'),

    persnames: (xmlDoc) => {
        return [...xmlDoc.querySelectorAll('persName')]
            .filter(el => !el.closest('editionStmt') && !el.closest('editor') && !el.closest('bibl') && !el.closest('change'))
            .map(el => {return {name: el.innerHTML, role: el.getAttribute('role') || ''};});
    },

    authors: (xmlDoc) => {
        return [...xmlDoc.querySelectorAll('author')]
            .filter(el => !el.closest('bibl'))
            .map(el => {return {name: el.innerHTML, role: 'author'};});
    },

    scribes: (xmlDoc) => {
        const els = [...xmlDoc.querySelectorAll('handNote[scribeRef]')];
        const scribes = new Map([
            ['#ArielTitleScribe','Ariel\'s title scribe'],
            ['#EdouardAriel','Edouard Ariel'],
            ['#PhEDucler','Philippe Étienne Ducler'],
            ['#DuclerScribe','Ducler\'s scribe'],
            ['#UmraosinghSherGil','Umraosingh Sher-Gil']
        ]);
        return els.map(el => scribes.get(el.getAttribute('scribeRef')))
            .filter(el => el !== undefined)
            .map(el => {return {name: el, role: 'scribe'}});
    },
    allpersons: (xmlDoc) => {
        const peeps = [...find.scribes(xmlDoc),...find.persnames(xmlDoc),...find.authors(xmlDoc)];

        const peepReducer = function(prevs, cur) {
            for(const prev of prevs) {
                if(cur.name === prev.name && cur.role === prev.role)
                    return prevs;
            }
            return [...prevs,cur];
        };

        return peeps.reduce(peepReducer,[]);
    },
};

const util = {
    innertext: el => {
        var synch, inner;
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
};

const check = {
    isFolio: (str) => str === 'folio' || str === 'page' || str === 'plate',
};

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
        fs.writeFile('blessings.html',template.documentElement.outerHTML,{encoding: 'utf8'},function(){return;});
    },
   
    xslxblessings: (data) => {

        const xslx_Sheet = fs.readFileSync('xslt/blessings-xlsx.json',{encoding:'utf-8'});
        const xslx_Sheet_clean = fs.readFileSync('xslt/blessings-xlsx-clean.json',{encoding:'utf-8'});
        const xlsxredux = function(acc,cur,cur1) {
            
            var milestone, inner, placement, synch;
            if(cur.nodeName === 'seg') {
                milestone = util.milestone(cur);
                placement = util.placement(cur) || '';
                synch = cur.closest('text').getAttribute('synch');
                inner = cur.innerHTML;
            }
            else {
                const loc = cur.querySelector('locus');
                const subtype = cur.getAttribute('subtype') || '';
                milestone = loc ? loc.textContent : '';
                placement = subtype.replace(/\s/g,', ').replace(/-/g,' ');
                synch = cur.getAttribute('synch');
                const q = cur.querySelector('q,quote');
                inner = q ? q.innerHTML : '';
            }
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
        xlsx.writeFile(wb,'blessings.xlsx');
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

        fs.writeFile('colophons.html',template.documentElement.outerHTML,{encoding: 'utf8'},function(){return;});
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
        fs.writeFile('tbcs.html',template.documentElement.outerHTML,{encoding: 'utf8'},function(){return;});
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
        fs.writeFile('persons.html',template.documentElement.outerHTML,{encoding: 'utf8'},function(){return;});
    },
};
