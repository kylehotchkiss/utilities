const qs = require('qs');
const axios = require('axios');
const polyline = require('polyline');

const googleMapsDirections = async ( start, end, waypoints ) => {
    const params = qs.stringify({
        origin: start,
        key: process.env.GOOGLE_KEY,
        mode: 'driving',
        destination: end,    
        waypoints: waypoints ? waypoints.join('|') : undefined
    });

    const { data } = await axios(`https://maps.googleapis.com/maps/api/directions/json?${params}`);
    
    if ( data.routes.length === 0 ) {
        console.error(`Could not get directions for ${ start } - ${ end } leg of trip`);

        return {};
    } else {
        console.log(`Successfully got directions for ${ start } - ${ end } leg of trip`);
        const geojson = polyline.toGeoJSON( data.routes[0].overview_polyline.points );

        let totalDistance = 0;
        let totalDuration = 0;

        for ( const leg of data.routes[0].legs ) {
            totalDistance += leg.distance.value;
            totalDuration += leg.duration.value;
        }

        return {
            geojson,
            distance: totalDistance,
            duration: totalDuration
        };
    }
};

module.exports = {
    googleMapsDirections
};