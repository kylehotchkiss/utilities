var STEP = 0;
var START_TIME = 0;
var SPEED_FACTOR = 30; // number of frames per longitude degree
var RESET_TIME = false; // indicator of whether time reset is needed for the animation
var PAUSE_BUTTON = document.getElementById('pause');

mapboxgl.accessToken = 'pk.eyJ1Ijoia3lsZWhvdGNoa2lzcyIsImEiOiJjanV0amNpcW0wN3luM3lscGVueWVvNTUwIn0.sFu5rVHNsz53_vmrqgSxMw';

var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v10',
    center: [-98.583333, 39.833333],  
    zoom: 4
});

// Create a GeoJSON source with an empty lineString.
var geojson = {
    "type": "FeatureCollection",
    "features": [{
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": []
        }
    }]
};

var getGeoJSON = function() {
    return fetch('/_all.geojson');
}

var animation;
var progress = 0;

map.on('load', function() {
    getGeoJSON()
    .then(function( response ) { return response.json() })
    .then(function( geoJSON ) {
        var coordsArray = [];
        
        for ( var i in geoJSON.features ) {
            var feature = geoJSON.features[i];

            for ( var j in feature.geometry.coordinates ) {
                var coords = feature.geometry.coordinates[j];
                coordsArray.push( coords );
            }
        }

        // add the line which will be modified in the animation
        map.addLayer({
            'id': 'line-animation',
            'type': 'line',
            'source': {
                'type': 'geojson',
                'data': geojson
            },
            'layout': {
                'line-cap': 'round',
                'line-join': 'round'
            },
            'paint': {
                'line-color': '#FF9933',
                'line-width': 2,
                'line-opacity': 1
            }
        });

        START_TIME = performance.now();

        animateLine();

        // click the button to pause or play
        PAUSE_BUTTON.addEventListener('click', function() {
            PAUSE_BUTTON.classList.toggle('pause');
            if (PAUSE_BUTTON.classList.contains('pause')) {
                cancelAnimationFrame(animation);
            } else {
                RESET_TIME = true;
                animateLine();
            }
        });

        // reset START_TIME and progress once the tab loses or gains focus
        // requestAnimationFrame also pauses on hidden tabs by default
        document.addEventListener('visibilitychange', function() {
            RESET_TIME = true;
        });

        function animateLine( timestamp ) {
            if (RESET_TIME) {
                // resume previous progress
                START_TIME = performance.now() - progress;
                RESET_TIME = false;
            } else {
                progress = timestamp - START_TIME;
            }

            // restart if it finishes a loop
            if (STEP > coordsArray.length) {
                START_TIME = timestamp;
                geojson.features[0].geometry.coordinates = [];

                STEP = 0;
            } else {
                geojson.features[0].geometry.coordinates.push(coordsArray[STEP]);

                map.getSource('line-animation').setData(geojson);

                STEP++;
            }

            // Request the next frame of the animation.
            animation = requestAnimationFrame(animateLine);
        }
    })
    .catch(function( error ) {
        console.error( error );
    });
});