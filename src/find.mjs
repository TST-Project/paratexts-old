import { util } from './utils.mjs';

const find = {
    blessings: (xmlDoc) => xmlDoc.querySelectorAll('seg[function="blessing"], desc[type~="blessing"]'),
    benedictions: (xmlDoc) => xmlDoc.querySelectorAll('seg[function="benediction"], desc[type~="benediction"]'),
    invocations: (xmlDoc) => xmlDoc.querySelectorAll('seg[function="invocation"], desc[type~="invocation"]'),
    tocs: (xmlDoc) => xmlDoc.querySelectorAll('seg[function="table-of-contents"], desc[type~="table-of-contents"]'),
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
            .map(el => {
                return {
                    name: el.hasAttribute('key') ? el.getAttribute('key') : el.textContent,//el.innerHTML, 
                    role: el.getAttribute('role') || ''
                };
            });
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
            ['#EdouardAriel','Édouard Ariel'],
            ['#PhEDucler','Philippe Étienne Ducler'],
            ['#DuclerScribe','Ducler\'s scribe'],
            ['#UmraosinghSherGil','Umraosingh Sher-Gil']
        ]);
        return els.map(el => scribes.get(el.getAttribute('scribeRef')))
            .filter(el => el !== undefined)
            .map(el => {return {name: el, role: 'scribe'}});
    },
    allpersons: (xmlDoc,cache) => {
        //const peeps = [...find.scribes(xmlDoc),...find.persnames(xmlDoc),...find.authors(xmlDoc)];
        const peeps = [...find.scribes(xmlDoc),...find.persnames(xmlDoc)];

        const peepReducer = function(prevs, cur) {
            if(cache.has(cur.name))
                cur.name = cache.get(cur.name);
            else {
                const canonicalname = util.personlookup(cur.name);
                if(canonicalname) {
                    cache.set(cur.name,canonicalname);
                    cur.name = canonicalname;
                }
            }
            for(const prev of prevs) {
                if(cur.name === prev.name && cur.role === prev.role)
                    return prevs;
            }
            return [...prevs,cur];
        };

        return {peeps: peeps.reduce(peepReducer,[]), cache: cache};
    },
};

export { find };
