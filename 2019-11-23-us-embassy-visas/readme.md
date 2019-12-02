## US Embassy Immigrant Visa Issuance Reporting

Takes the data from the PDFs in [US DOS' _Monthly Immigrant Visa Issuance Statistics_](https://travel.state.gov/content/travel/en/legal/visa-law0/visa-statistics/immigrant-visa-statistics/monthly-immigrant-visa-issuances.html). Data is convered into JSON and aggregate data is generated for future graphing purposes.

## Running
* `yarn`
* Uncomment code in `downloadPDFs()`
* `node index.js` 
* Recomment code in `downloadPDFs()`
* Inside `_output/` there will be a `full.json` with line-by-line reading of the data from the PDFs, and `aggregates.json` which clumps visa categories together and generates counts for each embassy

## Copies of PDFs
They're freely available on the Department of State's website but I'm not comfortable hosting copies as I'm not sure under which licence or laws the PDFs are released.