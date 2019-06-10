var sunlightAPI = process.env.SUNLIGHT_API;

var generateEmail = function( templates, rep ) {
    var template, mailto;

    template = templates[ Math.floor( Math.random() * templates.length ) ];
    template.body = "Dear " + rep.title + " " + rep.last_name + ",\n\n " + template.body;
    mailto = "mailto:" + rep.oc_email + "?subject=" + encodeURI( template.subject ) + "&body=" + encodeURI( template.body );

    return mailto;
};

var generateTweet = function( templates, rep ) {
    var template, tweet, hashtag;

    hashtag = "#WeAreJustKids";
    base = "https://twitter.com/intent/tweet?text=";
    template = templates[ Math.floor( Math.random() * templates.length ) ];

    if ( rep.twitter_id ) {
        tweet = base + encodeURIComponent( ".@" + rep.twitter_id + " " + template + " " + hashtag );
    } else {
        tweet = base + encodeURIComponent( "Congress: " + template + " " + hashtag );
    }

    return tweet;
};

var repsFromZip = function( zip, callback ) {
    var base = "https://congress.api.sunlightfoundation.com/legislators/locate?apikey=" + sunlightAPI + "&zip=" + zip + "&callback=?";
    var house = 0;
    var congress = [];

    if ( zip.length === 5 ) { // Length Check
        if ( /^\d{5}(-\d{4})?$/.test( zip ) ) { // Validity Check
            jQuery.getJSON(base, function( data ) {
                if ( data.count ) {
                    var legislators = data.results;

                    for ( var i in legislators ) {
                        var legislator = legislators[i];

                        if ( legislator.chamber === "house" ) {
                            house++;
                        }
                    }

                    if ( house > 1 ) {
                        callback( true, false );
                    } else {
                        for ( var j in legislators ) {
                            var legislator = legislators[j];
                            var sunlightID = legislator.bioguide_id;

                            congress.push( legislator );
                        }

                        callback( false, congress );
                    }
                } else {
                    callback( true, false );
                }
            });
        }
    }
};


var repsFromStreet = function( street, zip, callback ) {
    var congress = [];
    var geocoder = new google.maps.Geocoder();

    geocoder.geocode( { "address": street + " " + zip }, function( results, status ) {
        if ( status == google.maps.GeocoderStatus.OK ) {
             var coordinates = results[0].geometry.location;

             var congressmen = "https://congress.api.sunlightfoundation.com/legislators/locate?apikey=" + sunlightAPI + "&latitude=" + coordinates.lat() + "&longitude=" + coordinates.lng() + "&callback=?";

             jQuery.getJSON(congressmen, function( data ) {
                 if ( data.count ) {
                     var legislators = data.results;

                     for ( var i in legislators ) {
                         var legislator = legislators[i];

                         congress.push( legislator );
                     }

                     callback( false, congress );
                 } else {
                     callback( true, false );
                 }
             });
        } else {
            callback( true, false );
        }
    });
};


var ContactCongress = React.createClass({
    getInitialState: function() {
        return {
            view: "zip",
            reps: false
        };
    },

    submitZip: function( event ) {
        event.preventDefault();

        var self = this;
        var zip = this.refs.zip.getDOMNode().value;

        ga("send", "event", "Entered Zip Code", "Actions");

        repsFromZip( zip, function( error, congress ) {
            if ( error ) {
                self.setState({
                    view: "street"
                });

                self.refs.street.getDOMNode().focus();
            } else {
                self.setState({
                    view: "results",
                    reps: congress
                });
            }
        });
    },

    submitStreet: function( event ) {
        event.preventDefault();

        var self = this;
        var zip = this.refs.zip.getDOMNode().value;
        var street = this.refs.street.getDOMNode().value;

        ga("send", "event", "Entered Street Address", "Actions");

        repsFromStreet( street, zip, function( error, congress ) {
            if ( error ) {
                self.setState({
                    view: "error",
                });
            } else {
                self.setState({
                    view: "results",
                    reps: congress
                });
            }
        });
    },

    trackAction: function( event ) {
        var rep = event.currentTarget.dataset.rep;
        var action = event.currentTarget.dataset.action;

        if ( action ) {
            ga("send", "event", "Clicked " + action, "Actions", rep);
        }
    },

    render: function() {
        var self = this;

        return (
            <div className={ "view-" + this.state.view }>
                <div className="step-zip">
                    <form onSubmit={ this.submitZip }>
                        <div className="form-group">
                            <div className="row">
                                <div className="col-sm-12">
                                    <label>Your Zip Code</label>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4 col-xs-7">
                                    <input type="text" ref="zip" className="form-control field-zip" />
                                </div>
                                <div className="col-sm-4 col-xs-5">
                                    <button type="submit" className="btn btn-danger">Submit &rsaquo;</button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="step-street">
                    <form onSubmit={ this.submitStreet }>
                        <div className="form-group">
                            <div className="row">
                                <div className="col-sm-4">
                                    <label>Your Street Address</label>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-sm-4 col-xs-7">
                                    <input type="text" ref="street" className="form-control field-street" />
                                </div>
                                <div className="col-sm-4 col-xs-5">
                                    <button type="submit" className="btn btn-danger">Submit &rsaquo;</button>
                                </div>
                            </div>
                        </div>

                        <p className="small">Your zip code has two representatives - please enter your street address so we can provide your correct reps.</p>
                    </form>
                </div>

                {this.state.reps &&
                    <div className="step-results">
                        <div className="row">
                            {this.state.reps.map(function( rep ) {
                                if ( rep.chamber === "house" ) {
                                    var email = generateEmail( self.props.emails, rep );
                                    var tweet = generateTweet( self.props.tweets, rep );

                                    return (
                                        <div className="col-sm-6 rep">
                                            <div className="name">
                                                { rep.first_name } { rep.last_name }
                                            </div>

                                            <div className="contact">
                                                <p>Tell Rep. { rep.last_name } to take protective action for the suffering children in Iraq by choosing one of the options below. We have prefilled some messages, but we would love if you make your own appeal too. Your voice matters!</p>
                                                <a className="btn btn-twitter" data-rep={ rep.first_name + " " + rep.last_name } data-action="tweet" href={ tweet } onClick={ self.trackAction }><i className="ss-twitter"></i> Tweet { rep.twitter_id ? "@" + rep.twitter_id : "" }</a>
                                                <a className="btn" data-rep={ rep.first_name + " " + rep.last_name } data-action="email" href={ email } onClick={ self.trackAction }><i className="ss-mail"></i> Email Rep. { rep.last_name }</a>
                                            </div>
                                        </div>
                                    );
                                }
                            })}

                            <div className="col-sm-6">
                                <div className="row">
                                    {this.state.reps.map(function( rep ) {
                                        if ( rep.chamber === "senate" ) {
                                            var email = generateEmail( self.props.emails, rep );
                                            var tweet = generateTweet( self.props.tweets, rep );

                                            return (
                                                <div className="col-xs-12 rep">
                                                    <div className="name">
                                                        { rep.first_name } { rep.last_name }
                                                    </div>

                                                    <div className="contact">
                                                        <a className="btn btn-twitter" data-rep={ rep.first_name + " " + rep.last_name } data-action="tweet" href={ tweet } onClick={ self.trackAction }><i className="ss-twitter"></i> Tweet { rep.twitter_id ? "@" + rep.twitter_id : "" }</a>
                                                        <a className="btn" data-rep={ rep.first_name + " " + rep.last_name } data-action="email" href={ email } onClick={ self.trackAction } ><i className="ss-mail"></i> Email Sen. { rep.last_name }</a>
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                }

                <div className="step-error">
                    Sorry, we could not find any representatives for your location.
                </div>

                <div className="contact-congress-footer">
                    <p className="disclaimer">Your personal information will not be shared. If you have never used the OpenCongress email utility before, you may have to provide them with some additional information to make sure your email is properly routed to your representatives and to verify that you are their constituent.</p>
                </div>
            </div>
        );
    }
});

var email = [{
    subject: "What if these were your children?",
    body: "Recently, I saw the UN's report on the horrible events occurring in the Middle East to children. Please investigate the accusations of children being tortured and children being murdered in Iraq, and take protective action so that Iraq can have the best chance at a beautiful feature - their children."
}];

var tweets = [
    "Iraq's children are Iraq's future, please find a way to protect them from extremists.",
    "Please find a way to give the children of Iraq a second chance from the madness of their world.",
    "Children around the world deserve protection. Please find a way to protect the children of Iraq.",
    "Please stand for the suffering children of Iraq. Find a way to save their lives!",
    "I've seen the UN report on the children of Iraq - please find a way to save them!",
    "Please do something about the children's safety crisis in Iraq. They need a hero!",
    "Children should not have to worry about their communities going extinct - please save the Iraqi kids!",
    "Children should not be victims of genocide in 2015. Please save the children of Iraq."
];

React.render(
    <ContactCongress emails={ email } tweets={ tweets } />,
    document.getElementById("react-contact-congress")
);
