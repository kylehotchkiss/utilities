require('dotenv').config();

const axios = require('axios');
const qs = require('querystring');
const cheerio = require('cheerio');
const moment = require('moment');

const POST_I130_ESTIMATES = {
    'Rapid Visa': {        
        min: 51,
        max: 132,
        captured_at: 1557858600,
    },
    'Boundless': {        
        min: 120,
        max: 210,
        captured_at: 1557858600,
    }
};

/**
 * Convert receipt prefix to service center naming conventions
 * References: 
 *     https://www.am22tech.com/uscis-receipt-number/
 *     Network inspector on https://egov.uscis.gov/processing-times/
 */
const getServiceCenterIDs = ( receiptPrefix ) => {
    if ( receiptPrefix.length > 3 ) {
        throw new Error('getServiceCenterIDs() requires a valid 3-character receipt prefix');
    }

    const receiptPrefixLowercased = receiptPrefix.toLowerCase();

    switch ( receiptPrefixLowercased ) {
        case 'csc':
        case 'wac':
            return {
                code: 'CSC',
                state: 'California'                
            }
        
        case 'vsc':
        case 'eac':
            return {
                code: 'ESC',
                state: 'Vermont'
            }

        case 'lin':
        case 'nsc':
            return {
                code: 'NSC',
                state: 'Nebraska'
            }


        case 'tsc':
        case 'src':
            return {
                code: 'SSC',
                state: 'Texas'                
            };

        case 'ysc':
            return {
                code: 'YSC',
                state: 'Potomac'
            }

        default: 
            throw new Error(`${ receiptPrefix } is not a valid receipt prefix. This tool can only estimate I-130s with California, Vermont, Nebraska, Texas, or Potomac service centers.`);
    }
}

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

const getUSCISI130Estimates = async ( serviceCenter ) => {
    try {
        let spouse = {};

        const { data: { data: { processing_time } } } = 
            await axios(`https://egov.uscis.gov/processing-times/api/processingtime/I-130/${ serviceCenter }`);
    
        const { subtypes: processingTimeData } = processing_time; 

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
            max: maxDays,
            captured_at: moment(spouse.publication_date, 'MMMM DD, YYYY').unix()
        }
    } catch( error ) {
        console.error( error );

        return {};
    }  
}

const getAM22I130Estimates = async () => {
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
            max: maxDays,
            captured_at: moment().unix()
        }
    } catch ( error ) {
        console.error( error );

        return {};
    }
}

const getVisaJourneyI130Estimates = async ( serviceCenter ) => {
    try {
        const { data: processingTimeHTML } = await axios('https://www.visajourney.com/timeline/irstats.php?history=90');

        let days;
        const $ = cheerio.load( processingTimeHTML );
        const $estimateRows = $('#ipsLayout_mainArea table').eq(1).find('tr');
        
        $estimateRows.each(( i, element ) => {
            const $el = $(element);
            const name = $el.find('td').eq(0).text().toLowerCase();
            const estimate = $el.find('td').eq(4).text();

            if ( ~name.indexOf(serviceCenter.toLowerCase()) ) {
                days = estimate;

                return false;
            }
        });

        if ( days ) {
            return {
                min: Number(days),
                max: Number(days),
                captured_at: moment().unix()
            }
        } else {
            console.error('No results found, did you choose a valid service center?');

            return {};
        }        
    } catch ( error ) {
        console.error( error );

        return {};
    }
}

const getI130Status = async ( receiptNumber ) => {
    try {
        const status = await getUSCISStatus( receiptNumber );        

        return status;
    } catch ( error ) {
        console.error( error );
    }
}

const getVisaJourneyNVCConsulateEstimates = async () => {
    try {
        const { data: processingTimeHTML } = await axios('https://www.visajourney.com/timeline/irstats.php?history=90');

        const $ = cheerio.load( processingTimeHTML );
        const avgDays = $('#ipsLayout_mainArea table').eq(0).find('tr').eq(1).find('td').eq(4).text().trim();
        const consulateDays = $('#ipsLayout_mainArea table').eq(3).find('tr').eq(44).find('td').eq(4).text().trim();

        return {
            min: Number( consulateDays < avgDays ? consulateDays : avgDays ),
            max: Number( consulateDays > avgDays ? consulateDays : avgDays ),
            captured_at: moment().unix()
        }
    } catch ( error ) {
        console.error( error );

        return {};
    }
}

const getI130Estimates = async ({ state, code }) => {
    try {
        const USCISEstimates = getUSCISI130Estimates( code );
        const am22Estimates = getAM22I130Estimates( state );
        const visaJourneyEstimates = getVisaJourneyI130Estimates( state );

        const results = {
            'USCIS': await USCISEstimates,
            'AM 22 Tech': await am22Estimates,
            'Visa Journey':await visaJourneyEstimates
        };

        return results;
    } catch( error ) {
        console.error('Error encountered');

        return {};
    }
};


const getPostI130Estimates = async ( consulate ) => {
    try {
        const visajourney = await getVisaJourneyNVCConsulateEstimates();

        return {
            ...POST_I130_ESTIMATES,
            'Visa Journey': visajourney
        }
    } catch ( error ) {
        console.error( error );

        return {};
    }
}

if ( process.env.LIBRARY_MODE === 'false' ) {
    const main = (async () => {
        const receiptNumber = process.env.RECEIPT_NUMBER;
        const interviewConsulate = process.env.INTERVIEW_CONSULATE;

        const serviceCenterIDs = getServiceCenterIDs( receiptNumber.substring(0, 3) );
        const statusTask = getI130Status( receiptNumber );
        const preEstimatesJob = getI130Estimates( serviceCenterIDs );
        const postEstimatesJob = getPostI130Estimates( interviewConsulate );

        const status = await statusTask;
        const preEstimates = await preEstimatesJob;
        const postEstimates = await postEstimatesJob;

        console.log( 'Status', status );
        console.log( 'I-130 Processing Time', preEstimates );
        console.log( 'Post I-130 (NVC/Consulate) Processing Time', postEstimates );
    })();    
} else {
    module.exports = {
        getI130Status,
        getI130Estimates,
        getServiceCenterIDs,
        getPostI130Estimates
    };
}