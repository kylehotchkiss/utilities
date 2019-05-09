## Around-the-World

Generate some (geojson) maps of your travels around the world, if you've been some cool places!

Currently supports separately parsing:

1. Road Trips (via normal Google Directions API)
2. Rail Trips (via rail-only Google Directions API)
3. Flights (via geocoding both origin and destination and drawing a great-circle line between locations, which is accurate for most but not all flights)

Cool part:
It even works in little countries like Nepal somehow. So I used this to map my India and Nepal travels too!

### Usage

I tried to simplify but the tool still remains pretty technical to use.

1. Grab a Google API key. You won't make so many requests that it'll cost you anything
2. Activate Google Directions and Geocoding APIs
3. Create a `.env` file with the line `GOOGLE_KEY=%MY-NEW-API-KEY%`
4. Adjust the files in `input/` to match your travels. You can use coordinate pairs if the city/state city/country nomenclature is giving confusing results
5. Pay close attention to my use of the `waypoints` array - it allows you to plot your route more accurately without dealing with coordinates. Google allows only 23 of these so... don't go too crazy.
6. Adjust the main loop in the bottom of the `index.js` to only run on the input files you created
7. `node index.js`
8. Your geojson files will be in the `output/` folder
