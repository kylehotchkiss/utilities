require('dotenv').config();

const axios = require('axios');
const qs = require('querystring');
const cheerio = require('cheerio');
const moment = require('moment');

const RECEIPT_DATE = moment.unix( process.env.RECEIPT_DATE );
const DATE_FORMAT = `MMMM D, YYYY`;

const getUSCISStatus = async ( receiptNumber ) => {
    try {
        const { data: caseStatusData } = await axios.post('https://egov.uscis.gov/casestatus/mycasestatus.do', qs.stringify({
            appReceiptNum: receiptNumber,
            initCaseSearch: 'CHECK+STATUS'
        }));
    
        const $ = cheerio.load( caseStatusData );
        const response = $('.appointment-sec p').text().replace('  ', ' ');

        return response;
    } catch( error ) {
        console.error( error );

        return null;
    }
}

const getUSCISEstimates = async ( serviceCenter ) => {
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
        } = await axios(`https://egov.uscis.gov/processing-times/api/processingtime/I-130/${ serviceCenter }`);
    
    
        for ( const type of processingTimeData ) {
            if ( type.form_type === '134A-IR' ) {
                spouse = type;
    
                break;
            }
        }
    
        const minMonths = spouse.range[1].value;
        const maxMonths = spouse.range[0].value;
        const minDays = moment.duration(minMonths, 'months').asDays();
        const maxDays = moment.duration(maxMonths, 'months').asDays();

        return {
            min: minDays,
            max: maxDays   
        }
    } catch( error ) {
        console.error( error );

        return {};
    }  
}

const getAM22Estimates = async () => {
    try {
        const { data: processingTimeHTML } = await axios('https://www.am22tech.com/uscis/current-i130-processing-time-green-card-for-parents/');

        const $ = cheerio.load( processingTimeHTML );

        const minResponse = $('#texas tbody tr').eq(1).find('td').eq(1).html().split('<br>')[0];
        const maxResponse = $('#texas tbody tr').eq(1).find('td').eq(2).html().split('<br>')[0];
        const minDate = moment(minResponse, 'DD MMM, YY');
        const maxDate = moment(maxResponse, 'DD MMM, YY');
        const minDays = moment().diff(minDate, 'days');
        const maxDays = moment().diff(maxDate, 'days');

        return {
            min: minDays,
            max: maxDays
        }
    } catch ( error ) {
        console.error( error );

        return {};
    }
}

const getVisaJourneyEstimates = async () => {
    try {
        const { data: processingTimeHTML } = await axios('https://www.visajourney.com/timeline/irstats.php?history=90');

        const $ = cheerio.load( processingTimeHTML );
        const days = $('#ipsLayout_mainArea table').eq(1).find('tr').eq(4).find('td').eq(2).text().trim();

        return {
            min: Number(days),
            max: Number(days)
        }
    } catch ( error ) {
        console.error( error );

        return {};
    }
}

const getI130Status = async() => {
    try {
        const status = await getUSCISStatus();        

        return status;
    } catch ( error ) {
        console.error( error );
    }
}

const getI130Estimates = async ( serviceCenter ) => {
    try {
        const USCISEstimates = await getUSCISEstimates( serviceCenter );
        const am22Estimates = await getAM22Estimates();
        const visaJourneyEstimates = await getVisaJourneyEstimates();

        /*const table = [{
            'Data Source': 'USCIS',
            'Earliest Approval Date': moment(RECEIPT_DATE).add(USCISEstimates.min, 'days').format( DATE_FORMAT ),
            'Latest Approval Date': moment(RECEIPT_DATE).add(USCISEstimates.max, 'days').format( DATE_FORMAT ),
        }, {
            'Data Source': 'AM 22 Tech',
            'Earliest Approval Date': moment(RECEIPT_DATE).add(am22Estimates.min, 'days').format( DATE_FORMAT ),
            'Latest Approval Date': moment(RECEIPT_DATE).add(am22Estimates.max, 'days').format( DATE_FORMAT ),
        }, {
            'Data Source': 'Visa Journey',
            'Earliest Approval Date': moment(RECEIPT_DATE).add(visaJourneyEstimates.min, 'days').format( DATE_FORMAT ),
            'Latest Approval Date': moment(RECEIPT_DATE).add(visaJourneyEstimates.max, 'days').format( DATE_FORMAT ),
        }];  

        console.table( table );*/

        return {
            am22Estimates,
            USCISEstimates,
            visaJourneyEstimates
        };
    } catch( error ) {
        console.error('Error encountered');

        return {}
    }
};

if ( process.env.LIBRARY_MODE === 'false' ) {
    const main = (async () => {
        const status = await getI130Status( process.env.RECEIPT_NUMBER );
        const estimates = await getI130Estimates( process.env.SERVICE_CENTER );

        console.log( status );
        console.log( estimates );
    })();    
} else {
    module.exports = {
        getI130Status,
        getI130Estimates
    };
}