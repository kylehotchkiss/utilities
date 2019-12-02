const _ = require('lodash');
const fs = require('fs-extra');
const axios = require('axios');
const moment = require('moment');
const pdfparse = require('pdf-parse');
const cheerio = require('cheerio');

const STATS_DOMAIN = 'https://travel.state.gov';
const STATS_INDEX_URL = 'https://travel.state.gov/content/travel/en/legal/visa-law0/visa-statistics/immigrant-visa-statistics/monthly-immigrant-visa-issuances.html';
const STATS_TITLE_NEEDLE = 'IV Issuances by Post and Visa Class';
const STATS_IGNORED_LINES = ['Page', 'PostVisa', 'Immigrant', 'Grand', '\n', 'January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

async function getStatisticPDFs() {
  const pdfs = [];
  const { data: indexHTML } = await axios.get(  STATS_INDEX_URL );
  const $ = cheerio.load( indexHTML );
  const $links = $('.tsg-rwd-text a');

  $links.each(( index, el ) => {
    const $el = $( el );
    const title = $el.text();
    const href = $el.attr('href');

    if ( title.indexOf( STATS_TITLE_NEEDLE ) !== -1 ) {
      const titleSplit = title.split(' - ');
      const monthYear = titleSplit[0];
      const timestamp = moment.utc(monthYear, 'MMMM YYYY');

      pdfs.push({
        url: href,
        timestamp,        
        slug: timestamp.format('YYYY-MM')        
      });
    }
  });

  return pdfs;
};

async function downloadPDFs( pdfs ) {
  await fs.ensureDir('./_pdfs');

  /*for ( const pdf of pdfs ) {
    const timestamp = pdf.timestamp.format();

    console.log(`Downloading visa issuance report for ${ timestamp }`)

    const response = await axios({
      url: `${STATS_DOMAIN}/${ pdf.url }`,
      method: 'get',
      responseType: 'stream'      
    })

    response.data.pipe( fs.createWriteStream(`./_pdfs/${ pdf.slug }.pdf`) )
  }*/

  return;
}

async function parsePDFs( pdfs ) {
  const statistics = {};

  for ( const pdf of pdfs ) {
    console.log(`Processing ${ pdf.slug }`);

    try { 
      // Read PDF File
      const dataBuffer = fs.readFileSync( `./_pdfs/${ pdf.slug }.pdf` );
      // Parse PDF file to a giant text block
      const parsed = await pdfparse(dataBuffer);
      // Split giant text block to an array of lines
      const lines = parsed.text.split('\n');

      // Funny syntax to allow easily breaking out of loops
      outerLoop:
        for ( const line of lines ) {
      innerLoop:
          // Check the line for stop words, which skip processing
          for ( const start of STATS_IGNORED_LINES ) {
            if ( line.indexOf( start ) === 0 ) {            
              continue outerLoop;
            }
          }

          // Process line, ignoring empty gaps in array for newlines
          if ( line ) {   
            /**
             * If the cityname contains a space, skip the line
             * We can't reasonably split these out for now
             * TODO: Build in support for spaced citynames
             */
            if ( line.indexOf(' ') !== -1 ) {            
              continue outerLoop;
            }
            
            /** 
             * PDF Processors always collapse whitespace to... nothing
             * This finds the 3-character visa code in the single-word row
             * As noted above, this doesn't support citynames with spaces 
             * (hard to find the capital letter for visa code)
             */
            let visaCodeIndex;

        letterLoop:
            for ( const i in line ) {
              const char = line[i];
              if ( char === char.toUpperCase() && i !== '0' ) {
                visaCodeIndex = Number(i); 
                break letterLoop;
              }
            }

            const city = line.substring(0, visaCodeIndex);
            const visa = line.substring(visaCodeIndex, (visaCodeIndex + 3));
            const count = line.substring((visaCodeIndex + 3), line.length);

            _.set(statistics, `${city}.${pdf.slug}.${visa}`, Number(count));
          }
        }
    } catch ( error ) {
      console.log(`Error processing ${pdf.slug}`, error.message);
    }
  }

  return statistics;
}

function generateAggregates( statistics ) {
  const aggregates = {};

  for ( const city in statistics ) {
    for ( const date in statistics[city] ) {
      let total = 0;
      const categories = {};

      for ( const visa in statistics[city][date] ) {
        const visa_code = visa.substring(0, 2);
        const visa_code_parsed = visa_code === 'CR' ? 'IR' : visa_code;

        if ( !categories[visa_code_parsed] ) {
          categories[visa_code_parsed] = 0;
        }
        
        total += statistics[city][date][visa];
        categories[visa_code_parsed] += statistics[city][date][visa];
      }

      _.set(aggregates, `${city}.${date}`, { categories , total } );
    }
  }

  return aggregates
}

async function writeResults( statistics, aggregates ) {
  await fs.ensureDir('./_output');
  fs.writeFileSync('./_output/statistics.json', JSON.stringify( statistics ) );
  fs.writeFileSync('./_output/aggregates.json', JSON.stringify( aggregates ) );
}

(async function main() {
  const pdfs = await getStatisticPDFs();
  await downloadPDFs(pdfs);
  const statistics = await parsePDFs(pdfs);
  const aggregates = generateAggregates( statistics );

  await writeResults( statistics, aggregates );
})();