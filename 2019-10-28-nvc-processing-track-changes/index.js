const axios = require('axios');
const cheerio = require('cheerio');

const main = (async () => {
  const textSelector = ' .featurebox b';
  const dateRegex = /\d*-\w{3}-\d{4}/g;

  const nvcInitialProcessingHTML = await axios.get('https://travel.state.gov/content/travel/en/us-visas/immigrate/the-immigrant-visa-process/after-petition-approved/begin-nat-visa-center.html');
  const nvcUploadProcessingHTML = await axios.get('https://travel.state.gov/content/travel/en/us-visas/immigrate/the-immigrant-visa-process/collect-and-submit-forms-and-documents-to-the-nvc/step-6-submit-documents-to-the-nvc.html');

  const $initial = cheerio.load(nvcInitialProcessingHTML.data);
  const $upload = cheerio.load(nvcUploadProcessingHTML.data);

  const initialProcessingText = $initial('.bottom-content .tsg-rwd-featurebox-caption b').eq(0).text();
  const uploadProcessingText = $upload('.bottom-content .tsg-rwd-featurebox-caption b').eq(0).text();

  console.log(initialProcessingText);
  console.log(uploadProcessingText);

})();