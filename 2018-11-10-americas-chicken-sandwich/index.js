require('dotenv').config();

const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio')

const stateURLs = [];

let counter = 0;

const STORE_URL = process.env.STORE_URL;

axios
.get(`${ STORE_URL }/Locations/Browse`)
.then(async ( { data } ) => {
    const $ = cheerio.load( data );

    $('.wrapper li a').each(function( i, $el ) {
        const url = $(this).attr('href');

        if ( url.indexOf('Locations/') !== -1 ) {
            stateURLs.push( `${ STORE_URL }/${url}` );
        }        
    });

    for ( const state of stateURLs ) {
        const { data } = await axios.get( state );

        const $ = cheerio.load( data );
        
        $('.location').each(function( i, $el ) {
            counter++;

            const addrHTML = $( this ).find('p').html();
            let addrComps = addrHTML.split('<br>');
            addrComps.pop();
            const addrFull = addrComps.join(' ');
            const addrTrimmed = addrFull.replace(/\s+/g,' ').trim()

            fs.appendFileSync('./output/locations.csv', `${ addrTrimmed }\n`);

            console.log('Finished ', counter);
        })
    }

    console.log( stateURLs );
})
.catch(( error ) => {
    console.log( error );
})