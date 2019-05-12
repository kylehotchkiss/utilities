const fs = require('fs');
const _ = require('lodash');
const turf = require('turf');
const axios = require('axios');
const qs = require('querystring');
const eachLimit = require('async/eachLimit');

const addressFile = fs.readFileSync('./output/locations.csv', 'utf8');
const addressArray = addressFile.split('\n');

const API_KEY = process.env.GOOGLE_KEY;

let i = 0;

async function main() {
    const points = [];
    const dictionary = [];

    eachLimit(addressArray, 20, async ( address ) => {
        i++; console.log(`Getting Location: ${ i } - ${ address }`);

        const params = {
            address: `${ address }, USA`,
            key: API_KEY
        };

        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?${ qs.stringify(params) }`;

            const { data: { results }} = await axios.get(url);
            const { lat, lng } = _.get(results, '[0].geometry.location')
    
            points.push( turf.point([ lng, lat ], { address }) );

            dictionary.push({
                address, 
                lat,
                lng
            });
        } catch ( error ) {
            console.log(`Oops! ${ error.message ? error.message : error }`);
        }   
        
        return;
    }, ( error ) => {
        if ( error ) {
            console.error( error );
        } else {
            fs.writeFileSync('./output/locations.json', JSON.stringify( dictionary, null, 4 ));
            fs.writeFileSync('./output/locations.geojson', JSON.stringify( turf.featureCollection( points ), null, 4 ));
        }
    });
}

main();