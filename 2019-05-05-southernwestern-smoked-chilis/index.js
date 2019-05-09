const fs = require('fs');
const turf = require('turf');
const { data } = require('./input/data.json');

const points = [];

for ( const row of data ) {
    const address = row.addresses[0];
    points.push(turf.point([ address.longitude, address.latitude ], { address: `${address.addressLine1} ${address.locality} ${address.administrativeArea}, ${address.postalCode} ` }))
}

fs.writeFileSync('./output/locations.geojson', JSON.stringify( turf.featureCollection( points ), null, 4 ));