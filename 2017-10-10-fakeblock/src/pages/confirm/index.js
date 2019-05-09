import axios from 'axios';
import async from 'async';
import React, { Component } from 'react';
import { clone as _clone, each as _each, findIndex as _findIndex } from 'lodash';

export default class ConfirmPage extends Component {
    constructor() {
        super();

        this.handleConfirm = this.handleConfirm.bind(this);
               
        this.state = {
            status: 'pending',
            deletionQueue: []
        };
    }

    /*componentDidMount() {
        const localDeletionQueue = localStorage.getItem('deletionQueue');

        if ( localDeletionQueue ) {
            this.setState({
                status: 'processing',
                deletionQueue: JSON.parse(localDeletionQueue)
            }, () => {
                this.processDeletion();
            });                               
        }
    }*/
    
    handleConfirm( event ) {
        event.preventDefault();

        let deletionQueue = [];

        _each(this.props.rejectedTweets, ( id ) => {
            deletionQueue.push({
                id, 
                status: 'pending'
            });
        });

        this.setState({
            deletionQueue,
            status: 'processing'
        }, () => {
            localStorage.setItem('deletionQueue', JSON.stringify(deletionQueue));

            //this.processDeletion();
        });
    }

    processDeletion() {
        let index = 0;

        async.eachSeries(this.state.deletionQueue, ( task, callback ) => {
            const deletionQueue = _clone(this.state.deletionQueue);
            index = _findIndex( this.state.deletionQueue, { id: task.id });

            axios.post(`https://api.twitter.com/1.1/statuses/destroy/${ task.id }.json`, {
                id: task.id,
                _method: 'DELETE',
                authenticity_token: '90d432df47ab30966b2f8122bb54eb86bbfc8053'                
            }).then(( response ) =>  {
                deletionQueue[index].status = 'processed';
                
                this.setState({
                    deletionQueue
                }, () => {
                    if ( index % 100 === 0 ) {
                        localStorage.setItem('deletionQueue', JSON.stringify(deletionQueue));                    
                    }

                    setTimeout(() => {
                        callback();
                    }, 0);    
                });         
            }).catch(( error ) => {
                callback();
            });                                                           
        }, ( error ) => {
            console.log('done');
        });
    }
        
    render() {
        if ( this.state.status === 'processing' ) {
            return (
                <div>
                    <h1>Time to clean up your feed!</h1>

                    <p>Get an Authencity Token</p>

                    <p></p>

                    <textarea className="form-control" disabled rows="50">
                        {`
                        var tweets = { ${ JSON.stringify( this.props.rejectedTweets ) } }
                         
                        (function() {
                            var i = 0;

                            var iterator = function iterator() {
                                if ( i < tweets.length ) {
                                    var tweet = tweets[i]

                                    fetch('https://twitter.com/i/tweet/destroy', {
                                        method: 'POST', 
                                        credentials: 'same-origin',
                                        headers: { 
                                            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                                            'x-twitter-active-user': 'yes',
                                            'x-requested-with': 'XMLHttpRequest',
                                            'accept': 'application/json, text/javascript, */*; q=0.01'
                                        },
                                        body: $.param({ 
                                            _method: 'DELETE',
                                            authenticity_token: '%Make tweet, check request in network insepctor, copy this token%',
                                            id: tweet
                                        })
                                    }).then(() => {
                                        i++; iterator();
                                        
                                    }).catch(( error ) => {
                                        console.log( error );
                                        i++; iterator();
                                    });
                                } else {
                                    console.log('Done!');
                                }
                            }

                            iterator();
                        })();
                        `}
                    </textarea>
                </div>
            );
        }

        return (
            <div>
                <p>Approved: { this.props.approvedTweets.length }</p>
                <p>Rejected: { this.props.rejectedTweets.length }</p>            

                <button 
                    className="btn btn-primary"
                    onClick={ this.handleConfirm }
                >
                    Delete my tweets
                </button>
            </div>
        );
    }
}