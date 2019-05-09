import moment from 'moment';
import { 
    clone as _clone,
    each as _each, 
    forEach as _forEach
} from 'lodash';

import blacklists from '../data/blacklists.json';


// Prefilter
// * Check every tweet for blocked terms.
// * return object of { passed: [ids], blocked: { id: { reason }} }
export const prefilter = ( tweets ) => {
    let counter = { approved: 0, rejected: 0, reasons: {} };
    let approved = [];
    let rejected = {};

    _each( tweets, ( rawTweet ) => {
        // If the CSV has trailing rows, it'll return wonky objects, so check validity
        if ( typeof rawTweet === 'object' && rawTweet.id && rawTweet.full_text ) {
            let reason;
            let pass = true;        
            const tweet = rawTweet.full_text;       

            /*if ( tweet.indexOf('t.co') !== -1 ) {
                var matches = rawTweet.text.match(/\bhttps?:\/\/t\.co\/\S+/gi);

                if ( matches ) {
                    if ( matches[0] ) {
                        console.log( matches[0] );
                    }                
                    
                    if ( matches[1] ) {
                        console.log( matches[1] )
                    }  
                }                         
            }*/
            
            const words = tweet.split(' ');
    
            _forEach(words, ( word ) => {
                _forEach(blacklists, ( blacklist, key ) => {
                    _forEach( blacklist.list, ( term ) => {
                        if ( word.toLowerCase() === term.toLowerCase() ) {
                            pass = false;
                            reason = key;      
                        }
                    })
                })
            });
    
            if ( pass ) {
                approved.push(rawTweet);
                counter.approved++;
            } else {
                rejected[ rawTweet.id ] = { text: rawTweet.full_text, reason: reason };
                counter.rejected++;
    
                if ( counter.reasons[reason] ) {
                    counter.reasons[reason]++;
                } else {
                    counter.reasons[reason] = 1;
                }
            }
        }
    });

    return {
        approved, rejected, counter
    };
};


export const splitByMonth = ( tweets ) => {
    let months = {};

    _each( tweets, ( tweet ) => {
        const key = moment( tweet.created_at ).format('YYYY-MM');

        if ( moment( tweet.created_at ).isBefore( moment().subtract(1, 'year') ) ) {
            if ( typeof months[ key ] === 'undefined' ) {
                months[ key ] = [];
            } 
    
            months[key].push( tweet );
        }    
    });

    return months;
};


// all tweets = array of raw tweets
// accepted tweets = array of tweetIDs
// rejected tweets = array of tweetIDs
export const getFinalRejections = ( allTweets, rejectedTweets, acceptedTweets ) => {    
    const rejectedArray = _clone( rejectedTweets );

    // For all tweets over a year old, delete everything not accepted
    _forEach( allTweets, ( tweet ) => {
        if ( moment( tweet.created_at ).isBefore( moment().subtract(1, 'year') ) ) {
            if ( acceptedTweets.indexOf( tweet.id ) === -1 ) {
                rejectedArray.push( tweet.id );
            }
        }
    });

    return rejectedArray;
};

export const deleteTweet = ( tweetID, token ) => {

};

export default {
    prefilter,
    splitByMonth,
    getFinalRejections
};