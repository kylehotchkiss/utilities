const axios = require('axios');

const feed = require('./input/kyle.json');

const getComments = ( token, postID ) => {
    return new Promise( ( resolve, reject ) => {
        let url = `${ root }/v1/media/${ postID }/comments/?access_token=${ token }`;

        console.log( 'url', url );

        axios( url )
            .then(( response ) => {                
                console.log( response.data );

                //resolve( { photos, last, count: photos.length } );
            }).catch(( error ) => {        
                console.log( error );
                
                /*if ( error.response &&  error.response.data ) {
                    reject( error.response.data );
                } else {
                    reject( error.message );
                }*/    
            });
    });
}

for ( const i in feed.data.user.edge_owner_to_timeline_media.edges ) {
    const photo = feed.data.user.edge_owner_to_timeline_media.edges[i];

    console.log( photo.node );   
}