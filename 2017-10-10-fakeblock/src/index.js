import ReactDOM from 'react-dom';
import React, { Component } from 'react';
import { 
    each as _each,
    forEach as _forEach,
    union as _union
} from 'lodash';

import UploadPage from './pages/upload';
import ConfirmPage from './pages/confirm';
import ModeratePage from './pages/moderate';

import Tweets from './library/tweets.js';

import './index.css';

class App extends Component {

    constructor() {
        super();

        this.state = {
            step: 1,
            count: 0,
            counter: {},            // Totals of filtered categories        
            allTweets: {},          // Keyed objects of all tweets   
            filteredTweets: {},     // Tweets filtered out due to matching blacklist 
            organizedTweets: {},    // Tweets passing blacklist filters
            rejectedTweets: [],     // Tweets pending deletion
            approvedTweets: []      // Tweets older than a year which will persist                                     
        };

        this.handleFileLoaded = this.handleFileLoaded.bind(this);
        this.handleModerationComplete = this.handleModerationComplete.bind(this);
    }

    handleFileLoaded( tweetsArray ) {
        let tweets = {};
        const filtered = Tweets.prefilter( tweetsArray );
        const organized = Tweets.splitByMonth( filtered.approved );

        console.log( organized );

        _each(tweetsArray, ( tweet ) => {
            tweets[tweet.id] = tweet;
        })

        this.setState({            
            step: 2,                                         
            count: tweets.length,
            allTweets: tweetsArray,
            counter: filtered.counter,
            organizedTweets: organized,            
            filteredTweets: filtered.rejected
        });
    }

    handleModerationComplete( months ) {
        let acceptedArray = [];
        let rejectedArray = Object.keys(this.state.filteredTweets);

        // Flatten months to single tweets array    
        _forEach(months, ( month ) => {
            acceptedArray = _union( acceptedArray, month );
        });        

        const finalRejectedArray = Tweets.getFinalRejections( this.state.allTweets, rejectedArray, acceptedArray );

        this.setState({
            step: 3,
            approvedTweets: acceptedArray,
            rejectedTweets: finalRejectedArray
        });
    }

    renderStep() {
        switch( this.state.step ) {
            case 1: 
                return <UploadPage 
                    handleFileLoaded={ this.handleFileLoaded } 
                />;
            
            case 2:
                return <ModeratePage 
                    organizedTweets={ this.state.organizedTweets } 
                    handleModerationComplete={ this.handleModerationComplete }
                />

            case 3: 
                return <ConfirmPage
                    approvedTweets={ this.state.approvedTweets }
                    rejectedTweets={ this.state.rejectedTweets }
                />

            default:
                return <div>NooP!</div>;
        }
    }

    render() {
        return (
            <div className="App">
                <link 
                    rel="stylesheet" 
                    crossOrigin="anonymous"
                    integrity="sha384-rwoIResjU2yc3z8GV/NPeZWAv56rSmLldC3R/AZzGRnGxQQKnKkoFVhFQhNUwEyJ" 
                    href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/css/bootstrap.min.css"
                />

                <div className="container">
                    <div className="row">
                        <div className="col-12">
                            { this.renderStep() }
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

ReactDOM.render(<App />, document.getElementById('root'));
