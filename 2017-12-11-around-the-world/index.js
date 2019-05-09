require('dotenv').config()

var fs = require('fs');
var arc = require('arc');
var turf = require('turf');
var slugify = require('slug');
var request = require('request');
var polyline = require('polyline');
var googleKey = process.env.GOOGLE_KEY;

var flights = require('./input/flights.json');
var asiaRoadTrips = require('./input/asia-road-trips.json');
var asiaRailTrips = require('./input/asia-rail-trips.json');
var americaRoadTrips = require('./input/america-road-trips.json');
var americaRailTrips = require('./input/america-rail-trips.json');
var europeRoadTrips = require('./input/europe-road-trips.json');
var delhiRoadtrips = require('./input/delhi-road-trips.json');
var uaeRoadtrips = require('./input/uae-road-trips.json');

var geocode = function( place, callback ) {
    request({
        json: true,
        url: 'https://maps.googleapis.com/maps/api/geocode/json',
        qs: {
            key: googleKey,
            address: place
        }
    }, function( error, request, body ) {
        if ( body.results.length > 0 ) {
            callback( false, body.results[0].geometry.location );
        } else {
            if ( error ) { console.error( error ) };
            callback( true );
        }

    });
};

var googleDirectionPaths = function( data, filename, transit ) {
    return new Promise(function( resolve, reject ) {
        var i = 0;
        var features = [];
        var loop = (function loop() {

            if ( i < data.trips.length ) {

                var trip = data.trips[i];
                var name = ( transit ? '(transit) ' : '') + trip.start + ' - ' + trip.end + (trip.waypoints ? ' VIA ' + trip.waypoints.join(', ') : '')
                var slug = slugify( name );
                var cacheName = 'cache/' + slug + '.json';

                console.log( 'grabbing trip ' + name );

                if ( fs.existsSync(cacheName) ) {
                    var geojson = JSON.parse(fs.readFileSync( cacheName ));

                    features.push( turf.feature( geojson ) );

                    i++; loop();
                } else {
                    request({
                        json: true,
                        url: 'https://maps.googleapis.com/maps/api/directions/json',
                        qs: {
                            key: googleKey,
                            origin: trip.start,
                            destination: trip.end,
                            transit_mode: 'train',
                            mode: transit ? 'transit' : 'driving',
                            waypoints: trip.waypoints ? trip.waypoints.join('|') : undefined
    
                        }
                    }, function( error, request, body ) {
    
                        if ( body.routes.length === 0 ) {
                            console.log( body )
                            console.log('    ...' + trip.start + ' - ' + trip.end + ' broken');
                        } else {
                            var geojson = polyline.toGeoJSON( body.routes[0].overview_polyline.points );
    
                            if ( !fs.existsSync('cache') ) {
                                fs.mkdirSync('cache');
                            }
            
                            fs.writeFileSync( cacheName, JSON.stringify(geojson));
                            
                            features.push( turf.feature( geojson ) );
                        }
    
                        i++; loop();
                    });
                }
            } else {
                if ( !fs.existsSync('output') ) {
                    fs.mkdirSync('output');
                }

                fs.writeFileSync('output/' + filename, JSON.stringify( turf.featureCollection( features ), null, 4 ));

                resolve();
            }

        })();

    });
};

var generateFlightPaths = function( data, filename ) {
    return new Promise(function( resolve, reject ) {
        var i = 0;
        var features = [];

        var loop = (function loop() {

            if ( i < data.flights.length ) {
                var flight = data.flights[i];

                console.log( 'grabbing trip ' + flight.start + ' - ' + flight.end );

                geocode(flight.start, function( error, startCoords ) {
                    geocode(flight.end, function( error, endCoords ) {

                        var generator = new arc.GreatCircle(
                            { x: startCoords.lng, y: startCoords.lat },
                            { x: endCoords.lng, y: endCoords.lat },
                            { name: flight.start + ' to ' + flight.end }
                        );

                        var line = generator.Arc( 100, { offset: 10 } );

                        features.push( line.json() );

                        i++; loop();

                    });
                });

            } else {
                if ( !fs.existsSync('output') ) {
                    fs.mkdirSync('output');
                }

                fs.writeFileSync('output/' + filename, JSON.stringify( turf.featureCollection( features ), null, 4 ));

                resolve();
            }
        })();
    });
};

googleDirectionPaths(europeRoadTrips, 'europe-road-trips.geojson')
    //.then( googleDirectionPaths(americaRoadTrips, 'roadtrips.geojson') )
    //.then( googleDirectionPaths(americaRailTrips, 'railtrips.geojson') )
    //.then( googleDirectionPaths(asiaRoadTrips, 'asia-road-trips.geojson') )
    //.then( googleDirectionPaths(asiaRailTrips, 'asia-rail-trips.geojson') )
    .then( googleDirectionPaths(delhiRoadtrips, 'delhi-road-trips.geojson') )
    //.then( googleDirectionPaths(uaeRoadtrips, 'uae-road-trips.geojson') )
    //.then( generateFlightPaths(flights, 'flights.geojson') )
    .then(function() {
        console.log('Done');
    });


//var indiaPast = require('./input/india-past.json');
//var indiaFlights = require('./input/india-flights.json');
//var indiaFuture = require('./input/india-future.json');

//generateFlightPaths(flights, 'flights.geojson')
//    .then(function() {
//        console.log('Done');
//    });

/*var caRoadTrip = require('./input/california-road-trip.json');

googleDirectionPaths(caRoadTrip, 'california-road-trip.geojson')
    .then(function() {
        console.log('Done');
    });
*/
