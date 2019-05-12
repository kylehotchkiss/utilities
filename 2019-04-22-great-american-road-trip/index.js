require('dotenv').config();

const fs = require('fs');
const turf= require('turf');
const util = require('util');
const GoogleSpreadsheet = require('google-spreadsheet');
const { googleMapsDirections } = require('./library/maps.js')

const AVERAGE_MPG = 18;
const PETROL_COST = 2.842;

const GOOGLE_SHEET = process.env.GOOGLE_SHEET;

const getData = async () => {
    try {
        const doc = new GoogleSpreadsheet( GOOGLE_SHEET );
        const getInfoAsync = util.promisify(doc.getInfo);
        const { title, author, worksheets, rowCount, colCount } = await getInfoAsync();
        const sheet = worksheets[0];
        const getRowsAsync = util.promisify(sheet.getRows);
        const rows = await getRowsAsync({});

        return rows;
    } catch( error ) {
        throw new Error( error );
    }
};

const processRouteGroups = async () => {
    const routes = {};
    const rows = await getData();
    
    for ( const row of rows ) {
        if ( !routes[row.step] ) {
            routes[row.step] = {
                groups: []
            };            
        }

        const lastGroupIndex = routes[row.step].groups.length - 1;

        if ( row.type === 'WAYPOINT' && lastGroupIndex === -1 ) {
            routes[row.step].groups.push([ row.place ]);
        } else if ( row.type === 'WAYPOINT' ) {
            routes[row.step].groups[ lastGroupIndex ].push( row.place );
            routes[row.step].groups.push([ row.place ]);
        } else if ( row.type === 'ROUTING' ) {
            routes[row.step].groups[ lastGroupIndex ].push( row.place );
        }
    }

    return routes;
}

const main = (async () => {
    const route = await processRouteGroups();
    const features = [];

    let totalDistance = 0;
    let totalDuration = 0;

    for ( const step in route ) {        
        for ( const i in route[step].groups ) {
            const group = route[step].groups[i];

            if ( group.length > 1 ) {
                const start = group[0];
                const end = group[ group.length - 1 ];
                let waypoints = null;

                if ( group.length > 2 ) {                    
                    waypoints = group.slice(1, group.length - 1);
                }
            
                const { geojson, distance, duration } = await googleMapsDirections(start, end, waypoints);
                totalDistance += distance;
                totalDuration += duration;
                features.push( turf.feature( geojson ) );

                fs.writeFileSync(`./output/${ step }-${ i }.geojson`, JSON.stringify( geojson, null, 4 ));
            }
        }
    }
    
    fs.writeFileSync(`./output/_all.geojson`, JSON.stringify( turf.featureCollection( features ), null, 4 ) );

    const durationToHours = totalDuration / 3600;
    const durationToDrivingDays = durationToHours / 8;
    const distanceToMiles = totalDistance / 1609;
    const distanceToGallons = distanceToMiles / AVERAGE_MPG;
    const distanceToPetrolCost = distanceToGallons * PETROL_COST;

    console.log(`Total Time: ${ durationToHours.toFixed(2) } hours. Driving Days: ${ durationToDrivingDays.toFixed(2) }`);
    console.log(`Total Distance: ${ distanceToMiles.toFixed(2) }mi. Petrol: ${ distanceToGallons.toFixed(0) } gallons. Cost: ${distanceToPetrolCost.toFixed(2)}`)
})();


