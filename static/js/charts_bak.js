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

var myBarChart;
var myLineChart;

function init_barChart(codes, values) {
    //---- Init bar chart with top 10 otus of the given sample

    //var ctx = d3.select("#barChart")
    var ctx = document.getElementById('barChart').getContext('2d');
    var colors = codes.map( (d) => 'rgba(21, 67, 96, 0.6)' );

    console.log("in bar,", codes, values);

    var data = {
        labels: codes,
        datasets: [{
            label: '',
            barPercentage: 0.7,
            barThickness: 'flex',
            maxBarThickness: 12,
            backgroundColor: colors,
            //minBarLength: 2,
            data: values
        }]
    };

    var options = {
        legend: { 
            display: false
        },
        elements: {
            rectangle: {
                borderWidth: 2,
            }
        },
        /*
        scales: {
            xAxes: [{
                gridLines: {
                    offsetGridLines: true
                }
            }]
        },*/
        title: {
            display: true,
            text: "Employess of Business Sectors"
        }
    };

    var myBarChart = new Chart(ctx, {
        type: 'horizontalBar',
        data: data,
        options: options
    });

}

function init_lineChart(years, values){

    //var ctx = d3.select("#barChart")
    var ctx = document.getElementById('lineChart').getContext('2d');

    console.log(years, values);

    var data = {
        labels: years,
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
            data: values
        }]
    };

    var options = {
        legend: { 
            display: false
        },
        title: {
            display: true,
            text: "Employees of NC from 1986"
        }
    };

    var myLineChart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
}

// commented out and code moved to main loop
// // Action from 'selection' 
// function optionChanged(year) {
//     url = "http://127.0.0.1:5000/get_census/" + year

//     // Perform an API call to get the census daa for the year idnetified

//     d3.json(url, function(data) {
//         console.log(data.result)

//         ncData = empNCxy(data.result);
//         init_barChart(ncData)
        
//     });
    
// };

// Find total number of employees for each business category
// --- empdata has all counties data
function empNCbar(empdata) {

    var ncAllcensus = empdata.filter( (d) => d[4] == '999' )

    console.log(ncAllcensus);
    ncAllcensus.sort( (a,b) => b[1] - a[1] );
    console.log("after sort", ncAllcensus);
    // Set labels as naics codes
    
    labels = ncAllcensus.map( (x) => naics_codes[x[2]] );

    // Set values as emp numbers
    values = ncAllcensus.map( (x) => parseInt(x[1]) );

    console.log(labels.slice(1));
    console.log(values.slice(1));

    // 
    init_barChart(labels.slice(1), values.slice(1));
}

// Line chart of total employees of years from 1986 to the given year.
function empNCtimeline(year) {
    url = "http://127.0.0.1:5000//get_nc_data/";

    d3.json(url, function(data){
        console.log(data);
        var labels = data.map( (d)=>d[0] );
        var values = data.map( (d) => parseInt(d[1]) );
        init_lineChart(labels, values);
    });
}

function countyCharts(county, census) {

    var url = "http://127.0.0.1:5000//get_county_data/"+county;
    d3.json(url, function(data) {
        console.log(data);

        //Update the line chart
        myLineChart.data.datasets.forEach((dataset) => {
            dataset.data.pop();
            dataset.data.push(data.size)
        });
        myLineChart.update();
    });

}