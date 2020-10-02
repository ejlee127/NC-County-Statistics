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
            //fillColor: "rgba(255,12,32,0.5)",
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
            text: "Employees of NC from 1986"
        }
    }
});
/*--------------------------------------------------------------------*/

// Find total number of employees for each business category
// --- empdata has all counties data
function empNCbar(empdata) {

    var ncAllcensus = empdata.filter( (d) => d[4] == '999' )
    ncAllcensus.sort( (a,b) => b[1] - a[1] );
    console.log("after sort", ncAllcensus);

    // Set labels as naics codes    
    codes = ncAllcensus.map( (x) => naics_codes[x[2]] );

    // Set values as emp numbers
    values = ncAllcensus.map( (x) => parseInt(x[1]) );

    //---- remove the entry for total '00'
    codes = codes.slice(1);
    values = values.slice(1);

    // Set colors for the bars
    var colors = codes.map( (d) => 'rgba(21, 67, 96, 0.6)' );

    // Removing existing data in the chart
    /*
    console.log("in NCbar",myBarChart.data.labels);
    console.log("in NCbar",myBarChart.data.datasets);
    myBarChart.data.labels.pop();
    myBarChart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });*/

    // Updating chart with new data
    console.log("in NCbar",myBarChart.data.labels);
    console.log("in NCbar",myBarChart.data.datasets.data);
    myBarChart.data.labels = codes;
    myBarChart.data.datasets.forEach((dataset) => {
        dataset.label = codes.map( (c) => c);
        dataset.data = values.map( (d) => d);
        console.log(dataset.data);
        dataset.backgroundColor = colors.map( (cl) => cl );
    });
    console.log("in NCbar-after adding",myBarChart.data.labels);
    console.log("in NCbar-after adding",myBarChart.data.datasets);
    myBarChart.update();
}

// Line chart of total employees of years from 1986 to the given year.
function empNCtimeline(year) {

    // Removing existing data
    /*
    myLineChart.data.labels.pop();
    myLineChart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });*/

    url = "http://127.0.0.1:5000//get_nc_data/";

    d3.json(url, function(data){
        console.log("in NCtimeline",data);
        var selData = data.filter( (d) => parseInt(d[0]) <= parseInt(year) );
        console.log("in NCtimeline",selData);        
        var years = selData.map( (d) => d[0] );
        var values = selData.map( (d) => parseInt(d[1]) );

        // Adding new data with values
        myLineChart.data.labels = years;
        myLineChart.data.datasets.forEach((dataset) => {
           dataset.data = values.map( (v) => v );
           dataset.borderColor= 'rgba(21, 67, 96, 1)';
       });
       myLineChart.update();
    });

       
}

function countyCharts(county, census) {

    var url = "http://127.0.0.1:5000//get_county_data/"+county;
    d3.json(url, function(data) {
        console.log(data);

        //---- Update the line chart
        //-- On the nc line chart, adding county line
        //updating existing line chart look
        myLineChart.data.datasets.forEach( (dataset) => {
            dataset.label = 'NC State-wide'
            dataset.borderColor = 'rgba(21, 67, 96, 0.6)'
        });
        //adding county data
        var newDataset = {
            label: county+'County',
            fill: false,
            borderColor:  'rgba(255,12,32,0.6)',  //"#3e95cd",
            data: data.size
        }
        myLineChart.data.datasets.push(newDataset);
        myLineChart.options.legend.display = true;
        console.log("in county,", myLineChart.data.datasets);
        myLineChart.update();
    });

}