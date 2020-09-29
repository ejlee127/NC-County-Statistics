

init_data(); 

function init_data() {
  url = "http://127.0.0.1:5000/reload_census"
      // Perform an API call to the get the data into MongoDB
  d3.json(url, function(call_status) {
      console.log(call_status);
  });
  return;
}

function fill_in_popup(name, numb,county_d){

  pop_html = "<h1>" + name + "</h1> <hr> <h2>County Number: " ;
  pop_html = pop_html + numb + "</h2> <br> <h2>Employment: " ;
  var c_emp = determine_size(name,county_d);
  pop_html = pop_html + c_emp;
  return pop_html;
}


// Creating map object
var myMap = L.map("map", {
  center: [34.72, -79.17],
  zoom: 6
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

function change_panels(county_number) {

  // holding function to change the side panels.
  console.log(county_number)
  return;
}

function determine_size(county,county_d){

  var size = 0;
  if (county_d[0][0] === "NAICS2007_TTL" || county_d[0][0] === "NAICS2012_TTL" ) {
    county = county + " County, North Carolina";
    for (var i= 1;i < county_d.length-1; i++) {
     if (county === county_d[i][1]) {
       size = parseInt(county_d[i][2]);
     }
    }
   }
    else {
     county = county + " County, NC";
     for (var i= 1;i < county_d.length-1; i++) {
      if (county === county_d[i][0]) {
        size = parseInt(county_d[i][2]);
      }
    }
   }
   console.log(size);
   return size;
}


// Function that will determine the color of a county based on the number of employees it has
 function chooseColor(county, county_info) {
   var result;
  //  var size = 0;
  //  if (county_info[0][0] === "NAICS2007_TTL" || county_info[0][0] === "NAICS2012_TTL" ) {
  //    county = county + " County, North Carolina";
  //    for (var i= 1;i < county_info.length-1; i++) {
  //     if (county === county_info[i][1]) {
  //       size = parseInt(county_info[i][2]);
  //     }
  //    }
  //   }
  //    else {
  //     county = county + " County, NC";
  //     for (var i= 1;i < county_info.length-1; i++) {
  //      if (county === county_info[i][0]) {
  //        size = parseInt(county_info[i][2]);
  //      }
  //    }
  //   }
  size = determine_size(county, county_info);
   var size1 = size / 1000;
   switch (parseInt(size1)) {
     case 0:
       result = "#66ffff";
       break;
     case 1:
       result = "#66ffd9";
       break;
     case 2:
       result = "#80ffff";
       break;
     case 3:
       result = "#66ffb3";
       break;
     case 4:
       result = "#66ff8c";
       break;
     case 5:
       result = "#66ff66";
       break;
     case 6:
       result = "#8cff66";
       break;
     case 7:
       result = "#b3ff66";
       break;
     case 8:
       result = "#d9ff66";
       break;
     case 9:
       result = "#ffff66";
       break;
     default:
      size1 = size1 / 10;
      switch (parseInt(size1)) {
        case 0:
          result = "#ffd966";
          break;
        case 1:
          result = "#ffb366";
          break;
        case 2:
          result = "#ff8c66";
          break;
        case 3:
          result = "#ff6666";
          break;
        case 4:
          result = "#ff668c";
          break;
        case 5:
          result = "#ff66b3";
          break;
        case 6:
          result = "#ff66d9";
          break;
        case 7:
          result = "#ff66ff";
          break;
        case 8:
          result = "#d966ff";
          break;
        case 9:
          result = "#b366ff";
          break;
        default:
          result = "#8c66ff"
      }                  
  }
    return result;
  }

//url = "https://api.census.gov/data/2018/cbp?get=NAICS2017_LABEL,NAICS2017,GEO_ID,LFO,LFO_LABEL,EMPSZES_LABEL,EMPSZES,EMP&for=county:*&in=state:37"
// url = "https://api.census.gov/data/2012/cbp?get=NAICS2012_TTL,GEO_TTL,EMP,LFO_TTL,GEO_ID,ESTAB&for=county:*&in=state:37"
//url = "https://api.census.gov/data/2010/cbp?get=NAICS2007_TTL,GEO_TTL,EMP,ESTAB&for=county:*&in=state:37";
// url = "https://api.census.gov/data/1986/cbp?get=GEO_TTL,SIC_TTL,EMP,ESTAB&for=county:*&in=state:37";
// url = "https://api.census.gov/data/1990/cbp?get=GEO_TTL,SIC_TTL,EMP,ESTAB&for=county:*&in=state:37";
 url = "http://127.0.0.1:5000/get_census"
      // Perform an API call to the Citi Bike Station Information endpoint  1986 1990
d3.json(url, function(county_data) {
 var county_info = county_data.result;
  console.log(county_info);
// Use this link to get the geojson data.
var link = "http://127.0.0.1:5000/get_geo"

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
            myMap.fitBounds(event.target.getBounds())
            console.log(this.feature.properties);
            change_panels(this.feature.properties.CNTY_NBR);
          }
        });
        // Giving each feature a pop-up with information pertinent to it
        layer.bindPopup(fill_in_popup(feature.properties.CountyName,feature.properties.CNTY_NBR,county_info));

      }
    }).addTo(myMap);
  });
});



