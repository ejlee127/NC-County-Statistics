const naics_codes = {
    //"00": "Total for all sectors",
    "11": "Agri-Food",
    "21": "Mining",
    "22": "Utilities",
    "23": "Construction",
    "42": "Wholesale trade",
    "51": "Information",
    "52": "Finance & insurance",
    "53": "Real estate",
    "54": "Professional",
    "55": "Securities Management",
    "56": "Waste Management",
    "61": "Educational services",
    "62": "Human Services",
    "71": "Recreation Services",
    "72": "Service Industry",
    "81": "Other services",
    "95": "Auxiliary Establishments",
    "99": "Unclassified" };

function ncColor(op) {
    // op: opacity (0,1]
    return `rgba(21, 67, 96, ${op})`
}

function countyColor(op) {
    // cty: county number, op: opacity
    return `rgba(255,12,32,${op})`
}

/*---------- Initialize Charts -----------------------------------*/
// Create new Bar Chart (blank data)
var ctx = document.getElementById('barChart').getContext('2d');
var myBarChart = new Chart(ctx, {
    type: 'horizontalBar',
    data: {
        labels: '',
        datasets: [{
            label: '',
            barPercentage: 0.7,
            barThickness: 'flex',
            maxBarThickness: 12,
            backgroundColor: [],
            //minBarLength: 2,
            data: []
        }]
    },
    options: {
        legend: { 
            display: false
        }
    }
});
// Create new Line Chart (blank data)
ctx = document.getElementById('lineChart').getContext('2d');
var myLineChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: '',
        datasets: [{
            label: '',
            fill: false,
            fillColor: ncColor(0.6),
            //strokeColor: "rgba(255,12,32,1)",
            //pointColor: "rgba(255,12,32,1)",
            //pointStrokeColor: "#fff",
            borderColor:  'rgba(21, 67, 96, 1)',  //"#3e95cd",
            //pointHighlightFill: "#fff",
            //pointHighlightStroke: "rgba(255,12,32,1)",
            data: []
        }]
    },
    options: {
        legend: { 
            display: false
        },
        title: {
            display: true,
            text: "Employees of NC since 1986"
        }
    }
});
/*--------------------------------------------------------------------*/

// Find total number of employees for each business category
// --- empdata has all counties data
function empNCbar(empdata) {

    var cind = 4 // county index
    var eind = 1 // emp index
    var nind = 2 // naics-code index

    var ncInfo = empdata.filter( (d) => d[cind] == '999' )
    console.log("in NCbar", ncInfo)
    ncInfo.sort( (a,b) => b[eind] - a[eind] );

    // Set labels as naics codes    
    codes = ncInfo.map( (x) => naics_codes[x[nind]] );

    // Set values as emp numbers
    values = ncInfo.map( (x) => parseInt(x[eind]) );

    //---- remove the entry for total '00'
    codes = codes.slice(1);
    values = values.slice(1);

    // Updating chart with new data
    myBarChart.data.labels = codes;
    myBarChart.data.datasets.forEach((dataset) => {
        dataset.label = codes.map( (c) => c);
        dataset.data = values.map( (d) => d);
        console.log(dataset.data);
        dataset.backgroundColor = codes.map( (d) => ncColor(0.6) );
    });
    myBarChart.options.legend.display = false;
    myBarChart.update();
}

// Line chart of total employees of years from 1986 to the given year.
function empNCtimeline(year) {

    url = "http://127.0.0.1:5000//get_nc_data/";

    d3.json(url, function(data){
        var selData = data.filter( (d) => parseInt(d[0]) <= parseInt(year) );
        var years = selData.map( (d) => d[0] );
        var values = selData.map( (d) => parseInt(d[1]) );

        // Updating chart with new data
        myLineChart.data.labels = years;
        myLineChart.data.datasets.forEach((dataset) => {
           dataset.data = values.map( (v) => v );
           dataset.borderColor= ncColor(1);
        });
        myLineChart.options.legend.display = false;
        myLineChart.update();
    });       
}

function countyCharts(year, county, census) {

    //-- Update the bar chart

    var cind = 4 // county index
    var eind = 1 // emp index
    var nind = 2 // naics-code index

    d3.json("datasets/combined_county_codes.json", function(codes){

        // Get the county number for census and adjust the length of string
        var countyNbr = codes[county].Census_NBR;
        if (countyNbr.length < 3) { countyNbr = "0"+countyNbr; }

        // Get the info for the county
        var countyInfo = census.filter( (dt) => dt[cind] == countyNbr );
    
        // Sort the info by emp number in descending orger
        countyInfo.sort( (a,b) => b[eind] - a[eind] );
    
        // Set labels as naics codes    
        codes = countyInfo.map( (x) => naics_codes[x[nind]] );
    
        // Set values as emp numbers
        values = countyInfo.map( (x) => parseInt(x[eind]) );
    
        // Remove the entry for total '00'
        codes = codes.slice(1);
        values = values.slice(1);
        
        // Set a new dataset with the county info
        var newDataset = {
            label: county+' County',
            backgroundColor:  codes.map( (d) => countyColor(0.6) ),
            data: values
        }
        // Updating chart with new data
        myBarChart.data.datasets.pop();
        myBarChart.data.labels = codes;
        myBarChart.data.datasets.push(newDataset);
        myBarChart.options.legend.display = true;
        myBarChart.update();
    })

    //- Update the line chart
    var url = "http://127.0.0.1:5000//get_county_data/"+county;
    d3.json(url, function(data) {
        // Removing existing county data in the chart
        if (myLineChart.data.datasets.length > 1 ) {
            myLineChart.data.datasets.pop();
        }

        // Updating existing chart look
        myLineChart.data.datasets.forEach( (dataset) => {
            dataset.label = 'NC State-wide'
        });

        // Set a new dataset with county data
        var newDataset = {
            label: county+' County',
            fill: true,
            fillColor: countyColor(0.6),
            borderColor:  countyColor(0.6),  //"#3e95cd",
            data: data.size
        }
        myLineChart.data.datasets.push(newDataset);
        myLineChart.options.legend.display = true;
        myLineChart.update();
    });
}
