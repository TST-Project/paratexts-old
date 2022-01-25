//const fs = require('fs');
//const jsdom = require('jsdom');
//const SaxonJS = require('saxon-js');
//const Sanscript = require('./sanscript');
//const xlsx = require('xlsx');
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
    output.personsnetwork(data,templatestr);
    console.log('Persons newtork compiled: persons-network.html.');
};

