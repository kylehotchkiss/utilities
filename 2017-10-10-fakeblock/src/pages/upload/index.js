import Papa from 'papaparse';
import React, { Component } from 'react';

const blacklists = require('../../data/blacklists.json');

export default class UploadPage extends Component {
    constructor() {
        super();

        this.state = {
            count: 0,
            sorted: false,
            uploaded: false,
            processed: false                         
        }

        this.handleUpload = this.handleUpload.bind( this );
    }

    handleUpload( event ) {
        event.preventDefault();
        const reader = new FileReader();
        reader.readAsText( this.files.files[0] );

        reader.onload = event => {
            /*
            const data = Papa.parse( reader.result, { header: true } );
            const parsed = data.data;

            console.log( data.data );
            this.props.handleFileLoaded( parsed );
            */

            const { tweets } = JSON.parse( reader.result );

            this.props.handleFileLoaded( tweets );
        };
    }
    
    render() {
        return (
            <div className="page-upload">
                <h3>Welcome to Fakeblock!</h3>

                <p>Fakeblock is a tool that makes it easy to prune your Twitter history. While it can't erase the things you've said permanently (they're in the National Archives after all), you can make it more difficult for the average person to see years into your past and use the dumb things you've said against you. In our current political climate, this could save your career. Please note that this tool won't help you much with advertising privacy, you are going to be placed in interest lists shortly after tweteing. Twitter's own advertising privacy settings are more beneficial for that.</p>
                <p>Fakeblock parses your Twitter archive files, then you interactively prune your history. It doesn't erase everything you said in the past, rather, it keeps all your tweets for the past year, minus some that meet blacklists on hot topic (or personal) matters. It attempts to remove some data that could be used against you in social engineering attacks as well (birthdays, anniverseries, etc). Once the tweets that pass the blacklist are saved, you go through each month before the past year and approve the 5 tweets that stay, which are randomly selected to not clump towards certain days too much. The process isn't too bad - I was able to prune around 25,000 tweets in an hour. And it's faster the next time you come back.</p>
                <p>Please request a Twitter archive and load it below. The data is entirely parsed in your browser and does not touch my servers (feel free to audit the code). When you're done, you get a giant command to drop into the developer console while logged into Twitter.com so that our deletion requests aren't rate limited (woohoo private API)</p>

                <p><strong>Load a tweets.json from your most recent twitter data archive</strong></p>

                <form onSubmit={ this.handleUpload }>
                    <div className="row">
                        <div className="col-8">
                            <div className="form-group">
                                <input 
                                    type="file" 
                                    accept="application/json"
                                    className="form-control" 
                                    ref={ input => this.files = input } 
                                />
                            </div>
                        </div>
                        <div className="col-4">
                            <button type="submit" className="btn btn-primary">Upload Tweets</button>
                        </div>
                    </div>                
                </form>

                <h4>Current Blacklist</h4>

                <div className="row">
                    {Object.keys(blacklists).map( ( key, i ) => {
                        const list = blacklists[key];

                        console.log(list);
                        return (
                            <div className=" col-sm-4 " key={i}>
                                <strong>{key}</strong>

                                <p>{list.reason}</p>

                                <p><small>                                
                                    {list.list.map(( word, j ) => {
                                        return (
                                            <span key={j}>{word}, </span>
                                        );                                       
                                    })}
                                </small></p>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    }
}