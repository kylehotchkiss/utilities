require('dotenv').config();

const fs = require('fs');
const axios = require('axios');
const async = require('async');
const express = require('express');
const qs = require('querystring');

const app = express();
const root = `https://api.instagram.com`;

app.get('/start', (req, res) => {
    res.redirect(`${ root }/oauth/authorize/?client_id=${ process.env.INSTAGRAM_CLIENT }&redirect_uri=${ process.env.INSTAGRAM_REDIRECT }&response_type=code`);
});

app.get('/auth', (req, res) => {
    const code = req.query.code;
    
    if ( code ) {
        axios.post(`${ root }/oauth/access_token`, qs.stringify({
            code: code,
            grant_type: 'authorization_code',            
            client_id: process.env.INSTAGRAM_CLIENT,
            redirect_uri: process.env.INSTAGRAM_REDIRECT,           
            client_secret:  process.env.INSTAGRAM_SECRET,
        })).then(( response ) => {
            const token = response.data.access_token;
            res.send(response.data);

            console.log('ACCESS TOKEN:', token)                       
        }).catch(( error ) => {
            if ( error.response && error.response.data ) {
                res.send(error.response.data);
            } else {
                res.send( error.message )
            }            
        });
    } else {
        res.send('No Code')
    }    
});
    

app.listen(3000, () => {
    console.log('Example app listening on port 3000!')
});