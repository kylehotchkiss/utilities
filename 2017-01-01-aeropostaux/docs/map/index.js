var map;

var getMapData = function() {
    return new Promise(function( resolve, reject ) {

        jQuery.getJSON('https://kylehotchkiss.github.io/aeropostaux/map/map.json')
            .done(function( data ) {
                resolve( data );
            })
            .fail(function() {
                reject();
            });

    });
};


var setupMap = function() {
    return new Promise(function( resolve, reject ) {
        mapboxgl.accessToken = process.env.MAPBOX_TOKEN;

        map = new mapboxgl.Map({
            zoom: 1,
            container: 'js-map',
            center: [-122.486052, 37.830348],
            style: 'mapbox://styles/mapbox/dark-v9'
        });

        map.on('load', function() {
            resolve();
        });
    });
};


jQuery(function() {

    setupMap()
    .then(getMapData)
    .then(function( data ) {

        //
        // Build Select Menus
        //
        var select = '<select id="js-select-country">';

        data.countries = data.countries.sort(function( a, b ) {
            if ( a.name > b.name ) {
                return 1;
            } else if ( a.name < b.name ) {
                return -1;
            } else {
                return 0;
            }
        });

        for ( var i in data.countries ) {
            country = data.countries[i];

            select += '<option value="' + i + '">' + country.name + ' (' + country.destinations.length + ')</option>';
        }

        select += '</select>';

        jQuery('#js-places').html( select );


        //
        // Handle selection
        //

        jQuery('body').on('change', '#js-select-country', function() {

            var index = jQuery( this ).val() ;
            var selected = data.countries[index];
            var features = [];

            var debug = '<div>';

            selected.destinations = selected.destinations.sort(function( a, b ) {
                if ( a.geoIndex > b.geoIndex ) {
                    return 1;
                } else if ( a.geoIndex < b.geoIndex ) {
                    return -1;
                } else {
                    return 0;
                }
            });

            for ( var i in selected.destinations ) {
                var destination = selected.destinations[i];

                var sender = data.postOffices[destination.poIndex];
                var recepient = data.dictionary[destination.geoIndex];

                if ( sender && recepient && sender.lat && sender.lon && recepient.lat && recepient.lon ) {
                    var route = new arc.GreatCircle({ y: sender.lat, x: sender.lon }, { y: recepient.lat, x: recepient.lon }, { name: destination.geoIndex });
                    var line = route.Arc(100 ,{ offset: 10 });
                    features.push( line.json() );
                } else {
                    console.log('Failed on:');
                    console.log( destination );
                }

                //debug += '<div><h3>' + destination.geoIndex + ' ' + destination.frequency + ' (via ' + destination.office + ')</h2><code>' + JSON.stringify(destination) + '</code><h4>From</h4><code>' + JSON.stringify(sender) + '</code><h4>To</h4><code>' + JSON.stringify(recepient) + '</code></div>';
            }

            debug += '</div>';

            var collection = turf.featureCollection( features );

            //jQuery('#js-debug').html( debug );

            //
            // Do Map, Son
            //

            try {
                map.removeSource('route');
                map.removeLayer('route');
            } catch ( error ) {};


            map.addSource('route', {
                type: 'geojson',
                data: collection
            });

            map.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: {
                    'line-cap': 'round',
                    'line-join': 'round'
                },
                paint: {
                    'line-width': 1,
                    'line-color': '#AAFF00'
                }
            });
        });
    });
});
