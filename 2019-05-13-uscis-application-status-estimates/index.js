require('dotenv').config();

const axios = require('axios');
const qs = require('querystring');
const cheerio = require('cheerio');
const moment = require('moment');

const RECEIPT_DATE = moment.unix( process.env.RECEIPT_DATE );
const DATE_FORMAT = `MMMM D, YYYY`;

const getStatus = async () => {
    try {
        const { data: caseStatusData } = await axios.post('https://egov.uscis.gov/casestatus/mycasestatus.do', qs.stringify({
            appReceiptNum: process.env.RECEIPT_NUMBER,
            initCaseSearch: 'CHECK+STATUS'
        }));
    
        const $ = cheerio.load( caseStatusData );
        const response = $('.appointment-sec p').text().replace('  ', ' ');

        return response;
    } catch( error ) {
        console.error( error );
        throw new Error( error );
    }
}

const getEstimates = async () => {
    try {
        const { 
            data: { 
                data: { 
                    processing_time: { 
                        subtypes: processingTimeData 
                    } 
                } 
            }  
        } = await axios(`https://egov.uscis.gov/processing-times/api/processingtime/I-130/${ process.env.SERVICE_CENTER }`);
    
        let spouse = {};
        const receiptDate = process.env.RECEIPT_NUMBER
    
        for ( const type of processingTimeData ) {
            if ( type.form_type === '134A-IR' ) {
                spouse = type;
    
                break;
            }
        }
    
        const earliestDuration = spouse.range[1].value;
        const latestDuration = spouse.range[0].value;
    
        const earliest = moment( RECEIPT_DATE )
            .add(Math.floor(earliestDuration), 'months')
            .add( ( (earliestDuration % 1) * 30 ), 'days' );
        const latest = moment( RECEIPT_DATE )
            .add(Math.floor(latestDuration), 'months')
            .add( ( (latestDuration % 1) * 30 ), 'days' );
    
        console.log( 'Received', RECEIPT_DATE.format(DATE_FORMAT) );
        console.log( 'Earliest Approval', earliest.format(DATE_FORMAT) );
        console.log( 'Latest Approval', latest.format(DATE_FORMAT) );
        console.log( 'Estimate data as of', spouse.publication_date );

        return true;
    } catch( error ) {
        console.error( error );
        throw new Error( error );
    }  
}

const main = (async () => {
    try {
        const status = await getStatus();
        
        console.log( status );

        const estimates = await getEstimates();
    } catch( error ) {
        console.error('Error encountered, closing');
    }
})();