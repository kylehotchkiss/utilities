require('dotenv').config();

const fs = require('fs');
const turf = require('turf');
const axios = require('axios');
const qs = require('querystring');
const eachLimit = require('async/eachLimit');

// BYO Google Maps Geocoder Key
const GOOGLE_API_KEY = process.env.GOOGLE_API;

// Can be found with some digging in the requests console
const API_ROOT = process.env.API_ROOT;
const STORE_API = process.env.STORE_API;

// USA Bounds for generating grid
const north = [-95.153389, 49.384472];
const south = [-81.804905, 24.54409];
const east = [-66.949778, 44.815389];
const west = [-124.733056, 48.164167];

// Contidental USA bounds
const USAExtreme = turf.featureCollection([
    turf.point(north, { name: 'north' }),
    turf.point(south, { name: 'south' }),
    turf.point(east, { name: 'east' }),
    turf.point(west, { name: 'west' })
]);

const storeIDs = [];
const searchZips = [];
const searchCoords = [];
const matchedCoords = [];
const storeLocations = [];
const USABounds = turf.bbox( USAExtreme );

// API only returns X results per Y miles from a zip code
// Generate an evenly spaced array of points around the USA
const pointGrid = turf.pointGrid( USABounds, 321 );

for ( const i in pointGrid.features ) {
    const point = pointGrid.features[i]
    const { coordinates } = point.geometry;
    searchCoords.push( coordinates );
}

const getSearchZips = ( coords ) => { 
    return new Promise(( resolve, reject ) => {
        eachLimit( searchCoords, 5, async ( coords ) => {
            const params = {
                key: GOOGLE_API_KEY,
                latlng: `${coords[1]},${coords[0]}`
            };
        
            try {
                const url = `https://maps.googleapis.com/maps/api/geocode/json?${ qs.stringify(params) }`;
                const { data: { results }} = await axios.get(url);

                console.log(url);
                
                if ( results.length > 0 && results[0].address_components.length > 0 ) {
                    const address = {};
        
                    for ( const component of results[0].address_components ) {
                        address[ component.types[0] ] = component.long_name;
                    }
        
                    if ( address.postal_code && !isNaN(Number(address.postal_code))) {
                        searchZips.push( address.postal_code );
                        matchedCoords.push( turf.point( coords ) );
                    }            
                }
        
                return;
            } catch ( error ) {
                console.error( error );

                return;
            }
        }, error => {
            if ( error ) {
                reject( error );
            } else {
                console.log(`Total search points: ${ searchCoords.length }`);
                console.log(`Total zips matched: ${ searchZips.length } (${((searchZips.length/searchCoords.length) * 100).toFixed(0)}%)`);
    
                resolve(searchZips);
            }        
        });
    });
}

const main = (async() => {
    const zips = await getSearchZips();

    console.log('Zips done, starting location grabbing run');

    let count = 0;

    eachLimit(zips, 3, async zip => {
        count++;

        const params = {                                
            range: 600,
            limit: 1000,
            locale: 'EN-US',
            key: STORE_API
        }

        try {            
            const url = `${ API_ROOT }/v2/stores/nearby/${zip}?${qs.stringify( params )}`;
            const { data } = await axios.get(url);

            console.log( count, url );

            if ( data.Locations && data.Locations.Location.length > 0 ) {
                for ( const location of data.Locations.Location ) {                    
                    const point = turf.point([ location.Address.Longitude, location.Address.Latitude ], { address: location.Address.FormattedAddress });
                    
                    if ( storeIDs.indexOf( location.ID ) === -1 ) {
                        storeIDs.push( location.ID );
                        storeLocations.push( point );
                    }                    
                }
            }

            return;
        } catch( error ) {
            console.error( 'Headers:', error.headers );
            console.error( 'Data: ', error.data );

            return;
        }
    }, error => {
        if ( error ) {
            console.error( error );
        } else {
            fs.writeFileSync('./output/locations.geojson', JSON.stringify( turf.featureCollection(storeLocations), null, 4 ));
        }
    })
})();


// pointGrid
