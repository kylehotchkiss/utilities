const fs = require('fs');
const turf = require('@turf/turf');

const roads = require('./input/interstates.json');
const bestStops = require('./input/best-stops.json');

const matchedStops = [];

turf.featureEach(bestStops, ( feature, index ) => {
    console.log( 'Index', index );

    turf.featureEach( roads, ( road, index ) => {
        const nearest = turf.nearestPointOnLine(road, feature, { units: 'miles' });

        if ( nearest.properties.dist < .5 ) {
            console.log( road.properties.prefix, road.properties.number, road.properties.state );
            console.log( nearest.properties.dist );
            matchedStops.push( feature );
        }         
    });
});

fs.writeFileSync('./output/best-road-stops.json', JSON.stringify(turf.featureCollection( matchedStops ), null, 4));