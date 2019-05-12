const fs = require('fs');
const { distance, point } = require('turf');
const data = fs.readFileSync('./input/locations.csv', { encoding: 'utf8' });
const rows = data.split('\n');

let totalKM = 0;

for ( const i in rows ) {
    const row = rows[Number(i)];
    const nextRow = rows[Number(i) + 1];

    if ( nextRow ) {
        const [ placeOne, latOne, lngOne ] = row.split(',');
        const [ placeTwo, latTwo, lngTwo ] = nextRow.split(',');
        const km = distance(point([ lngOne, latOne ]), point([ lngTwo, latTwo ]));
        
        totalKM += km;

        console.log(`${ placeOne } - ${ placeTwo } - ${ km.toFixed(0) }`)
    }
}


console.log();
console.log('Total KM', totalKM);