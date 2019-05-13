require('dotenv').config();

const axios = require('axios');
const qs = require('querystring');
const cheerio = require('cheerio');
const moment = require('moment');

const RECEIPT_DATE = moment.unix( process.env.RECEIPT_DATE );
const DATE_FORMAT = `MMMM D, YYYY`;

const getUSCISStatus = async () => {
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

const getUSCISEstimates = async () => {
    try {
        let spouse = {};

        const { 
            data: { 
                data: { 
                    processing_time: { 
                        subtypes: processingTimeData 
                    } 
                } 
            }  
        } = await axios(`https://egov.uscis.gov/processing-times/api/processingtime/I-130/${ process.env.SERVICE_CENTER }`);
    
    
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
    
        console.log( 'USCIS Estimate data as of', spouse.publication_date );
        console.log( 'USCIS Received', RECEIPT_DATE.format(DATE_FORMAT) );
        console.log( 'USCIS Earliest Approval', earliest.format(DATE_FORMAT) );
        console.log( 'USCIS Latest Approval', latest.format(DATE_FORMAT) );

        return true;
    } catch( error ) {
        console.error( error );
        throw new Error( error );
    }  
}

const getAM22Status = async () => {
    try {
        const { data: processingTimeHTML } = await axios('https://www.am22tech.com/uscis/current-i130-processing-time-green-card-for-parents/');

        const $ = cheerio.load( processingTimeHTML );
        // LOL
        const response = $('#texas tbody tr').eq(1).find('td').eq(1).html().split('<br>')[0];
        const processedDate = moment(response, 'DD MMM, YY');
        const remainingTime = RECEIPT_DATE.diff(processedDate, 'days');
        const bestEstimatedDate = moment( RECEIPT_DATE ).add(remainingTime, 'days');

        console.log( 'AM22Tech Speculative Approval', bestEstimatedDate.format(DATE_FORMAT) );
    } catch ( error ) {
        console.error( error );
        throw new Error( error );
    }
}

const main = (async () => {
    try {
        //const status = await getUSCISStatus();        
        //console.log( status );
        const estimates = await getUSCISEstimates();
        const am22estimate = await getAM22Status()
    } catch( error ) {
        console.error('Error encountered, closing');
    }
})();