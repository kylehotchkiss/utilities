const cheerio = require('cheerio');
const axios = require('axios');
const qs = require('querystring');
const { DateTime } = require('luxon');

const DAYS = 30;
const COUNTRY = 'vn';
const URL_PREFIX = 'https://www.dhl.com/shipmentTracking';

Number.prototype.pad = function (size) {
  var s = String(this);

  while (s.length < (size || 2)) {
    s = '0' + s;
  }

  return s;
};

(async function main() {
  const today = DateTime.local();
  const thirtyDaysAgo = today.minus({ days: DAYS });

  for (let i = 1; i <= DAYS; i++) {
    const day = thirtyDaysAgo.plus({ days: i });

    console.log(day.toLocaleString());

    const params = {
      countryCode: 'g0',
      languageCode: 'en',
      destCountryCode: COUNTRY,
      fromDayValue: Number(day.day).pad(2),
      fromMonthValue: Number(day.month).pad(2),
      fromYearValue: day.year,
      shipperReference: `EXP ${day.day.pad(2)} ${day
        .toFormat('MMM')
        .toUpperCase()} ${day.year}A`,
      toDayValue: today.day.pad(2),
      toMonthValue: today.month.pad(2),
      toYearValue: today.year,
    };

    const { data } = await axios.get(`${URL_PREFIX}?${qs.stringify(params)}`);

    if (data.errors) {
      console.log(`    ${data.errors[0].message}`);
    } else if (data.results) {
      console.log(`    Waybill: ${data.results[0].id}`);
    }
  }
})();
