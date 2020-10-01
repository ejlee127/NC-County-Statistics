
init_data(); 

function init_data() {

  url = "http://127.0.0.1:5000/get_years"
  // Perform an API call to the get the years stored from MongoDB
  d3.json(url, function(data) {
    console.log(data)
      //Create the drop down list of subject IDs
    document.getElementById("selDataset").innerHTML = generatetxt(data);

  });
  url = "http://127.0.0.1:5000/reload_census"
      // Perform an API call to the get the data into MongoDB
  d3.json(url, function(call_status) {
      console.log(call_status);
  });

  url = "http://127.0.0.1:5000/reload_geo"
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


function optionChanged(value) {
  buildMap(value);
  
}


/* function to generate the text for the drop downs.  This function creates a text string
  used to populate the drop down. 
  Input:
    keylist - array of strings containing the year

  Returns:
    text - text string with html encoding with the format of 
      <option> year </option>
*/
function generatetxt(keylist) {
  // set up variables being used in function.
  var text = [], i;

  // loop through array to populate the drop down.
  for (i = 0; i < keylist.length; i++) {
    text += "<option>" + keylist[i] + "</option>";
  }
  return text
} 


// Creating map object
var myMap = L.map("map", {
  //center: [35.787743, -78.644257],
  center: [34.72, -79.17],
  zoom: 7
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

function determine_size(county,county_d) {


  var size = 0;
  var ind = 1;
  var name_ind = 0;

  if (county_d[0][2] == 'NAICS2012' || county_d[0][2] == 'NAICS2017') {
    county = county + " County, North Carolina";
    for (var i= 1;i < county_d.length-1; i++) {
     if (county === county_d[i][name_ind] && '00' === county_d[i][2]) {
       size = parseInt(county_d[i][ind]);
     }
    }
   }
    else {
     if (county_d[0][0] == 'NAICS1997_TTL' || county_d[0][0] == 'NAICS2002_TTL' ) {
      ind += 1;
      name_ind += 1;
      suffix = county_d[1][name_ind].split(" ");
      if (suffix.length == 3){
        county = county + " County, NC";
      }
      else {
        county = county + ", NC";
      }
     }
     else {
       county = county + " County, NC";
     }
     for (var i= 1;i < county_d.length-1; i++){ 
      if (county === county_d[i][name_ind]) {
        size = parseInt(county_d[i][ind]);
      }
    }
    }
    return size;
   }


// Function that will determine the color of a county based on the number of employees it has
function chooseColor(county, county_info) {

  var size = determine_size(county, county_info)*100;
  var result = "#"+size.toString(16)
  return result;
}

function buildMap(year) {

  url = "http://127.0.0.1:5000/get_census/" + year
      // Perform an API call to get the census daa for the year idnetified

  d3.json(url, function(county_data) {

    var county_info = county_data.result;
    //console.log(county_data.result);
  
    // Use this link to get the geojson data.
    var link = "http://127.0.0.1:5000/get_geo"

    // Grabbing our GeoJSON data..
    d3.json(link, function(data) {   

      ncData = empNCxy(county_info);
      init_barChart(ncData);

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
              // myMap.fitBounds(event.target.getBounds())
              // console.log(this.feature.properties);
              change_panels(this.feature.properties.CNTY_NBR);
            }
          });
          // Giving each feature a pop-up with information pertinent to it
          layer.bindPopup(fill_in_popup(feature.properties.CountyName,feature.properties.CNTY_NBR,county_info));
        }
      }).addTo(myMap);
    });
  });
}