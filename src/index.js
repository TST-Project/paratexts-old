import fs from 'fs';
import { find } from './find.mjs';
import { make } from './utils.mjs';
import { output } from './output.mjs';

const dir = '../mss/';

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
    var perscache = new Map();
    const data = arr.map((f) => 
    {
        const xmlDoc = make.xml( fs.readFileSync(f,{encoding:'utf-8'}) );
        const allpersons = find.allpersons(xmlDoc,perscache);
        const persons = allpersons.peeps;
        perscache = allpersons.cache;
        const fname = `https://tst-project.github.io/${f}`;
        return {
            blessings: find.paratexts(xmlDoc,'blessing'),
            benedictions: find.paratexts(xmlDoc,'benediction'),
            invocations: find.paratexts(xmlDoc,'invocation'),
            satellites: find.paratexts(xmlDoc,'satellite-stanza'),
            tocs: find.paratexts(xmlDoc,'table-of-contents'),
            colophons: find.colophons(xmlDoc),
            cote: find.cote(xmlDoc),
            fname: `https://tst-project.github.io/${f}`,
            persons: persons,
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
    output.paratexts(data,{name: 'blessings', prop: 'blessings'});
    console.log('Blessings compiled: blessings.html.');
    output.paratexts(data,{name: 'benedictions', prop: 'benedictions'});
    console.log('Benedictions compiled: benedictions.html.');
    output.paratexts(data,{name: 'invocations', prop: 'invocations'}); // add satellite-stanzas
    console.log('Invocations compiled: invocations.html.');
    output.paratexts(data,{name: 'tables of contents', prop: 'tocs'});
    console.log('TOCs compiled: tocs.html.');
    output.xslxblessings(data);
    console.log('Blessings Excel sheet compiled: blessings.xlsx.');
    output.paratexts(data, {name: 'TBC', prop: 'tbcs'});
    console.log('TBC paratexts compiled: tbcs.html.');
    output.colophons(data);
    console.log('Colophons compiled: colophons.html.');
    output.persons(data);
    console.log('Persons compiled: persons.html.');
    output.personsnetwork(data);
    console.log('Persons newtork compiled: persons-network.html.');
};

