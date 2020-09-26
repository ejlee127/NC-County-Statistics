// Creating map object
var myMap = L.map("map", {
  center: [34.72, -79.17],
  zoom: 5
});

// Adding tile layer
L.tileLayer("https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}", {
  attribution: "© <a href='https://www.mapbox.com/about/maps/'>Mapbox</a> © <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a> <strong><a href='https://www.mapbox.com/map-feedback/' target='_blank'>Improve this map</a></strong>",
  tileSize: 512,
  maxZoom: 18,
  zoomOffset: -1,
  id: "mapbox/streets-v11",
  accessToken: API_KEY
}).addTo(myMap);


// Function that will determine the color of a neighborhood based on the borough it belongs to
 function chooseColor(county, county_info) {
   var result;
   var size = 0;
   if (county_info[0][0] === "NAICS2007_TTL" || county_info[0][0] === "NAICS2012_TTL" ) {
     county = county + " County, North Carolina";
     for (var i= 1;i < county_info.length-1; i++) {
      if (county === county_info[i][1]) {
        size = parseInt(county_info[i][2]);
      }
     }
    }
     else {
      county = county + " County, NC";
      for (var i= 1;i < county_info.length-1; i++) {
       if (county === county_info[i][0]) {
         size = parseInt(county_info[i][2]);
       }
     }
    }
  if (size < 10000) {
    result = "blue";} 
    else {
      if (size < 100000) {
        result = "green" ;}
      else {
        if (size < 200000) {
          result = "pink" ; }
        else {
          if (size < 300000) {
            result = "red" ; }
          else {
            result = 'purple';}
        }
      }
    }
    console.log(county,result)
    return result;
  }

url = "https://api.census.gov/data/2018/cbp?get=NAICS2017_LABEL,NAICS2017,GEO_ID,LFO,LFO_LABEL,EMPSZES_LABEL,EMPSZES,EMP&for=county:*&in=state:37"
// url = "https://api.census.gov/data/2012/cbp?get=NAICS2012_TTL,GEO_TTL,EMP,LFO_TTL,GEO_ID,ESTAB&for=county:*&in=state:37"
//url = "https://api.census.gov/data/2010/cbp?get=NAICS2007_TTL,GEO_TTL,EMP,ESTAB&for=county:*&in=state:37";
// url = "https://api.census.gov/data/1986/cbp?get=GEO_TTL,SIC_TTL,EMP,ESTAB&for=county:*&in=state:37";
// url = "https://api.census.gov/data/1990/cbp?get=GEO_TTL,SIC_TTL,EMP,ESTAB&for=county:*&in=state:37";
      // Perform an API call to the Citi Bike Station Information endpoint  1986 1990
d3.json(url, function(county_info) {

  console.log(county_info);
// Use this link to get the geojson data.
var link = "https://opendata.arcgis.com/datasets/d192da4d0ac249fa9584109b1d626286_0.geojson";

  // Grabbing our GeoJSON data..
  d3.json(link, function(data) {

    // Create a new station object with properties of both station objects
    // var station = Object.assign({}, county_info[i], data[i]);
    console.log(data);
    console.log(data.features)
    // Creating a geoJSON layer with the retrieved data
    L.geoJson(data, {
      // Style each feature (in this case a neighborhood)
      style: function(feature) {
        return {
          color: "white",
          // Call the chooseColor function to decide which color to color our neighborhood (color based on borough)
          fillColor: chooseColor(feature.properties.NAME, county_info),
          fillOpacity: 0.5,
          weight: 1.5
        };
      },
      // Called on each feature
      onEachFeature: function(feature, layer) {
        // Set mouse events to change map styling
        layer.on({
          // When a user's mouse touches a map feature, the mouseover event calls this function, that feature's opacity changes to 90% so that it stands out
          mouseover: function(event) {
            layer = event.target;
            layer.setStyle({
              fillOpacity: 0.9
            });
          },
          // When the cursor no longer hovers over a map feature - when the mouseout event occurs - the feature's opacity reverts back to 50%
          mouseout: function(event) {
            layer = event.target;
            layer.setStyle({
              fillOpacity: 0.5
            });
          },
          // When a feature (neighborhood) is clicked, it is enlarged to fit the screen
          click: function(event) {
            myMap.fitBounds(event.target.getBounds());
          }
        });
        // Giving each feature a pop-up with information pertinent to it
        layer.bindPopup("<h1>" + feature.properties.CountyName + "</h1> <hr> <h2>County Number: " + feature.properties.CNTY_NBR + "</h2>");

      }
    }).addTo(myMap);
  });
});

