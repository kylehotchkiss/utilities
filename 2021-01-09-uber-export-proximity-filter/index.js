const fs = require('fs');
const parse = require('csv-parse/lib/sync');
const stringify = require('csv-stringify/lib/sync');
const distance = require('@turf/distance').default;
const config = require('./config.json');
const TARGET = config.target;

function processRows( csv ) {
  let total = 0;
  const targetTrips = [];

  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true
  });

  for ( const row of rows ) {
    if ( row['Trip or Order Status'] === 'COMPLETED' ) {
      const pickup = [row['Begin Trip Lat'], row['Begin Trip Lng']];
      const dropoff = [row['Dropoff Lat'], row['Dropoff Lng']];

      const pickupFromTarget = distance([pickup[1], pickup[0]], [TARGET[1], TARGET[0]]);
      const dropoffFromTarget = distance([dropoff[1], dropoff[0]], [TARGET[1], TARGET[0]]);

      if ( pickupFromTarget < 1 || dropoffFromTarget < 1) {
        console.log( row['Begin Trip Time'], row['Fare Amount'] );
        total += Number(row['Fare Amount']);
        targetTrips.push( row );
      }
    }    
  }

  return targetTrips;
}

(async function main() {
  const heerCSV = fs.readFileSync('./heer.csv', { encoding: 'utf8' });
  const kyleCSV = fs.readFileSync('./kyle.csv', { encoding: 'utf8' });

  const heerTrips = processRows(heerCSV);
  const kyleTrips = processRows(kyleCSV);
  
  const targetTrips = [...heerTrips, ...kyleTrips];

  fs.writeFileSync('./final-trips.csv', stringify(targetTrips, { header:true }))

})();