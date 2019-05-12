ogr2ogr \
-f GeoJSON \
-where "country = 'United States' AND class = 'Interstate'" \
input/interstates.json \
shapefiles/ne_10m_roads_north_america.shp