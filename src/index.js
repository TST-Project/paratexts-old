import fs from 'fs';
import path from 'path';
import { find } from './lib/util/find.mjs';
import { make } from './lib/util/utils.mjs';
import { output } from './lib/util/output.mjs';

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
    //const step = (process.argv.length > 2 && process.argv[2] === '2') ?
    //    2 : 1;
    const allpersons = find.allpersons();
    const data = arr.map((f) => 
    {
        const xmlDoc = make.xml( fs.readFileSync(f,{encoding:'utf-8'}) );
        const basename = path.parse(f).base;
        return {
            cote: find.cote(xmlDoc),
            fname: `../mss/${basename}`,
            title: find.title(xmlDoc),
            repo: find.repo(xmlDoc),

            blessings: find.paratexts(xmlDoc,'blessing'),
            invocations: find.paratexts(xmlDoc,'invocation'),
            satellites: find.paratexts(xmlDoc,'satellite-stanza'),
            headers: find.paratexts(xmlDoc,'header'),
            ownerships: find.paratexts(xmlDoc, 'ownership-statement'),
            titles: find.paratexts(xmlDoc,'title'),
            tocs: find.paratexts(xmlDoc,'table-of-contents'),
            colophons: find.colophons(xmlDoc),
            tbcs: find.tbcs(xmlDoc),
            persons: allpersons(xmlDoc)
        };
    });
    /*
    data.sort((a,b) => {
        if(a.sort  b.sort) return -1;
        else return 1;
    });
    */
    output.paratexts(data,{name: 'blessings', prop: 'blessings'});
    console.log('Blessings compiled: blessings.html.');
    output.invocations(data);
    output.xslx(data,{name: 'blessings', prop: 'blessings'});
    console.log('Blessings Excel sheet compiled: blessings.xlsx.');
    output.paratexts(data,{name: 'invocations', prop: 'invocations'});
    console.log('Invocations compiled: invocations.html.');
    output.paratexts(data,{name: 'satellite stanzas', prop: 'satellites'});
    console.log('Satellite stanzas compiled: satellite_stanzas.html.');
    output.paratexts(data,{name: 'tables of contents', prop: 'tocs'});
    console.log('TOCs compiled: tocs.html.');
    output.paratexts(data, {name: 'TBC', prop: 'tbcs'});
    console.log('TBC paratexts compiled: tbcs.html.');
    output.colophons(data);
    console.log('Colophons compiled: colophons.html.');
    output.paratexts(data, {name: 'headers', prop: 'headers'});
    console.log('Headers compiled: headers.html.');
    output.paratexts(data, {name: 'ownership statements', prop: 'ownerships'});
    console.log('Ownership statements compiled: ownership_statements.html.');
    output.titles(data);
    console.log('Titles compiled: titles.html.');
    output.persons(data);
    console.log('Persons compiled: persons.html.');
    output.personsnetwork(data);
    console.log('Persons newtork compiled: persons-network.html.');
};
