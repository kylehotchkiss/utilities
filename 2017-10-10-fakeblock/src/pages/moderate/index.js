import React, { Component } from 'react';
import { 
    map as _map, 
    filter as _filter, 
    forEach as _forEach,    
    sampleSize as _sampleSize
    
} from 'lodash';

export default class ModeratePage extends Component {
    constructor() {
        super();

        const localExclusions = localStorage.getItem('exclusions');
        const localSavedTweets = localStorage.getItem('savedTweets');

        this.state = {
            savedTweets: localSavedTweets ? JSON.parse(localSavedTweets) : {},
            exclusions: localExclusions ? localExclusions.split(',') : []            
        }

        this.handleExclude = this.handleExclude.bind( this );
        this.updateExclusions = this.updateExclusions.bind( this );
        this.handleSaveTweets = this.handleSaveTweets.bind( this );
        this.updateSavedTweets = this.updateSavedTweets.bind( this );
        this.functionalSaveTweets = this.functionalSaveTweets.bind( this );
    }

    checkCompleted( props, state ) {
        let pending = false;
        const { organizedTweets } = props;
        const months = Object.keys(organizedTweets);

        _forEach(months, ( key ) => {
            if ( !state.savedTweets[key] ) {
                pending = true;
            };
        });

        if ( !pending ) {
            props.handleModerationComplete( state.savedTweets );
        }
    }

    componentWillMount() {
        this.checkCompleted( this.props, this.state );
    }

    componentDidUpdate( props ) {
        this.checkCompleted( this.props, this.state )
    }

    handleExclude( event ) {
        event.preventDefault();

        const tweetID = event.target.dataset.id;
        this.updateExclusions( tweetID );
    }

    updateExclusions( tweetID ) {
        let exclusions = this.state.exclusions;

        exclusions.push( tweetID );

        this.setState({
            exclusions
        }, () => {
            localStorage.setItem('exclusions', exclusions);
        })
    }

    handleSaveTweets( event ) {
        event.preventDefault();

        const setID = event.target.dataset.set;
        const tweetIDs = event.target.dataset.tweets.split(',');
        this.updateSavedTweets( setID, tweetIDs );
    }

    functionalSaveTweets( setID, tweetIDs ) {
        this.updateSavedTweets( setID, tweetIDs );
    }

    updateSavedTweets( setID, tweetIDs ) {
        let savedTweets = this.state.savedTweets;
        
        savedTweets[ setID ] = tweetIDs;

        this.setState({
            savedTweets
        }, () => {
            localStorage.setItem('savedTweets', JSON.stringify(savedTweets));
        })
    }

    renderMonths() {
        const { organizedTweets } = this.props;
        const months = Object.keys(organizedTweets);

        return _map(months, ( key ) => {
            if ( !this.state.savedTweets[key] ) {
                const allTweets = organizedTweets[ key ];
                
                const filteredTweets = _filter( allTweets, ( tweet ) => {
                    if ( this.state.exclusions.indexOf( tweet.id ) === -1 ) {
                        return true;
                    }
    
                    return false;
                });

                if ( filteredTweets.length > 5 ) {                                    
                    const tweetSet = _sampleSize( filteredTweets, 5 );
                    const tweetIDs = _map( tweetSet, 'tweet_id' );
            
                    return (
                        <div key={ key } className="tweet-set row">
                            <div className="col-12">
                                <h1>{ key }</h1>
                            </div>
        
                            { _map( tweetSet, ( tweet, j ) => {                                        
                                return (
                                    <div className="col-4" key={ j }>
                                        <a onClick={ this.handleExclude } data-id={ tweet.id }>Remove &#10006;</a>
                                        <p><small>{ tweet.full_text }</small></p>
                                    </div>
                                )
                            })}
        
                            <div className="col-12">
                                <button 
                                    className="btn btn-primary"
                                    data-set={ key }
                                    data-tweets={ tweetIDs }
                                    onClick={ this.handleSaveTweets }
                                >
                                    Keep these tweets
                                </button>
                            </div>
                        </div>
                    )
                } 

                // Since the length < 5, we are keeping.
                this.functionalSaveTweets( key, _map( filteredTweets, 'tweet_id' ) );

                return null;
            }

            return null;            
        })
    }

    render() {
        return (
            <div className="tweet-set-container">
                { this.renderMonths() }
            </div>
        );
    }
}