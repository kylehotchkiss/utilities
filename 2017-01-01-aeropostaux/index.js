// pdftotext aeropostaux.pdf aeropostaux.txt -layout

var fs = require('fs');
var parse = require('csv-parse');

var locations = 0;

var geocoding = [];
var uniqueLocations = [];
var uniquePostOffices = [];

var dictionary = {};
var postOffices = {};
var translations = {};

var normalize = ( str ) => {
    str = str.toLowerCase().trim();
    return str;
}

var get_translations = () => {
    return new Promise( ( resolve, reject ) => {
        parse( fs.readFileSync('input/1-locations-normalize.csv'), ( error, rows ) => {
            for ( var i in rows ) {
                var row = rows[i];

                translations[row[0]] = row[1];
            }

            resolve();
        });
    });
};

var get_dictionary = () => {
    return new Promise( ( resolve, reject ) => {
        parse( fs.readFileSync('input/2-geo-dictionary.csv'), { columns: true }, ( error, rows ) => {
            for ( var i in rows ) {
                var row = rows[i];

                dictionary[ row.place ] = row;
            }

            resolve();
        });
    });
};

var get_postoffices = () => {
    return new Promise( ( resolve, reject ) => {
        parse( fs.readFileSync('input/3-post-offices.csv'), { columns: true }, ( error, rows ) => {
            for ( var i in rows ) {
                var row = rows[i];

                postOffices[ row.index ] = row;
            }

            resolve();
        });
    });
};

var process = function() {
    return new Promise( ( resolve, reject ) => {
        fs.readFile('input/4-aeropostaux-data.txt', ( error, data ) => {
            var lines = data.toString().split('\n');
            var lookingStart = true;
            var lookingEnd = false;
            var countries = [];

            for ( var i in lines ) {
                var line = lines[i];

                if ( lookingStart && line.startsWith('A.1.') ) {
                    var name = lines[ i - 4 ].replace('\f', '').trim();

                    if ( translations[ normalize( name ) ] ) {
                        name = translations[ normalize( name ) ];
                    }

                    countries.push({
                        name: name,
                        startIndex: i
                    });

                    if ( uniqueLocations.indexOf( normalize( name ) ) === -1 ) {
                        uniqueLocations.push( normalize( name ) );
                    }

                    lookingEnd = true;
                    lookingStart = false;
                } else if ( lookingEnd && line.startsWith('A.2.') ) {
                    countries[ countries.length - 1 ].endIndex = i;

                    lookingEnd = false;
                    lookingStart = true;
                }
            }

            for ( var j in countries ) {
                var data = {};
                var offsets = {};
                var destinations = [];
                var country = countries[j];
                var stepParseRows = false;
                var stepFindRows = false; // Find the first row
                var stepColumnWidth = true; // Calculate Step Widths

                for ( var k = Number( country.startIndex ); k < Number( country.endIndex ); k++ ) {
                    var line = lines[k];

                    if ( stepColumnWidth && line.startsWith('Pays ou territoires') ) {
                        offsets.category = line.indexOf('Catégorie');
                        offsets.bureau1 = line.indexOf('Bureaux', offsets.category);
                        offsets.bureau2 = line.indexOf('Bureaux', offsets.bureau1 + 1);
                        offsets.frequency = line.indexOf('Fréquences', offsets.bureau2);

                        stepColumnWidth = false;
                        stepFindRows = true;

                        k += 2
                    } else if ( stepFindRows ) {
                        if ( line !== '' ) { // Can you see why I hate this
                            stepFindRows = false;
                            stepParseRows = true;
                        }
                    } else if ( stepParseRows ) {
                        if ( line === '' ) {
                            stepColumnWidth = true;
                            stepFindRows = false;
                            stepFindRows = false;
                            stepParseRows = false;
                        } else {
                            // So uh... we're now working in the past so the loop doesn't iterate too much
                            line = lines[ k - 1 ];

                            // Build out our geocoding targets
                            var destCity = line.substring( offsets.bureau2, offsets.frequency ).trim();
                            var destCountry = line.substring( 0, offsets.category ).trim();
                            var postOffice = normalize( line.substring( offsets.bureau1, offsets.bureau2 ).trim() ) + ', ' + normalize( country.name );

                            if ( translations[ normalize( destCity ) ] ) {
                                destCity = translations[ normalize( destCity ) ];
                            }

                            if ( translations[ normalize( destCountry ) ] ) {
                                destCountry = translations[ normalize( destCountry ) ];
                            }

                            if ( destCity === destCountry ) {
                                destPair = destCity
                            } else if ( destCity && destCountry ) {
                                destPair = destCity + ', ' + destCountry;
                            } else if ( destCity ) {
                                destPair = destCity;
                            } else {
                                destPair = destCountry;
                            }


                            if ( geocoding.indexOf( destPair ) === -1 ) {
                                geocoding.push( destPair );
                            }

                            // Save data to master
                            var data = {
                                linenumber: k,
                                city: destCity,
                                country: destCountry,
                                office: line.substring( offsets.bureau1, offsets.bureau2 ).trim(),
                                category: line.substring( offsets.category, offsets.bureau1 ).trim(),
                                frequency: line.substring( offsets.frequency ).trim(),
                                geoIndex: destPair,
                                poIndex: postOffice
                            }

                            // Translation Builder
                            if ( uniqueLocations.indexOf( normalize( data.city ) ) === -1 ) {
                                uniqueLocations.push( normalize( data.city ) );
                            }

                            if ( uniqueLocations.indexOf( normalize( data.country ) ) === -1 ) {
                                uniqueLocations.push( normalize( data.country ) );
                            }

                            if ( uniquePostOffices.indexOf( postOffice) === -1 ) {
                                uniquePostOffices.push( postOffice );
                            }

                            destinations.push( data );
                        }
                    }
                }

                countries[j].destinations = destinations;
            }

            // Folder Stuff
            if ( !fs.existsSync('output') ) {
                fs.mkdirSync('output');
            }

            // Output translation index
            uniqueLocations = uniqueLocations.sort();
            fs.writeFileSync('output/1-unique-locations.csv', uniqueLocations.join('\n') );

            // Output postal providers index
            fs.writeFileSync('output/2-unique-post-offices.csv', uniquePostOffices.join('\n') );

            // Output Geocoder index
            fs.writeFileSync('output/3-geo-locations.csv', geocoding.join('\n') );

            // Write Dictionary JSON
            fs.writeFileSync('output/4-geo-dictionary.json', JSON.stringify( { countries, dictionary, postOffices }, null, 4 ) );

            resolve();
        });
    });
};

// Execute
get_translations().then(() => {
    return get_dictionary();
}).then(() => {
    return get_postoffices();
}).then(() => {
    return process();
}).then(() => {
    //console.log('done');
});
