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

/**  CHart styling functions */

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
            data: []
        }]
    },
    options: {
        legend: { 
            display: false
        },
        title: {
            display: true,
            text: "Employees of Sectors"
        }
    }
});
// Create new Line Chart 
ctx = document.getElementById('lineChart').getContext('2d');
var myLineChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: '',
        datasets: [{
            label: '',
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
function empNCbar(year) {

    var eind = 1 // emp index
    var nind = 2 // naics-code index

    url = "http://127.0.0.1:5000/get_nc_data/" + year;

    d3.json(url, function(data) {

        
        // Remove the first row - column names and second row-total number
        ncInfo = data.result.slice(2);
        console.log("in NCbar", ncInfo)

        // Sort the array by emp numbers
        ncInfo.sort( (a,b) =>  parseInt(b[eind]) - parseInt(a[eind]) );

        // Set labels as naics codes    
        codes = ncInfo.map( (x) => naics_codes[x[nind]] );

        // Set values as emp numbers
        values = ncInfo.map( (x) => parseInt(x[eind]) );

        console.log("value", values)
        //---- remove the entry for total '00'
        //codes = codes.slice(1);
        //values = values.slice(1);

        // Updating chart with new data
        //myBarChart.data.datasets.pop();
        myBarChart.data.labels = codes.map( (c) => c);
        myBarChart.data.datasets.forEach((dataset) => {
            dataset.label = '';
            dataset.data = values.map( (d) => d);
            dataset.backgroundColor = codes.map( (d) => ncColor(0.6) )
        });
        myBarChart.options.legend.display = false;
        myBarChart.options.title.text = 'Employees of Sectors in '+year;
        myBarChart.update();
    });
}

// Line chart of total employees of years from 1986 to the given year.
function empNCtimeline(year) {

    url = "http://127.0.0.1:5000/get_nc_total/" + year;

    d3.json(url, function(data){
        console.log("in NCline", data);
        /*
        var selData = data.filter( (d) => parseInt(d[0]) <= parseInt(year) );
        var years = selData.map( (d) => d[0] );
        var values = selData.map( (d) => parseInt(d[1]) );*/
        values = data.size;
        years = data.year;

        console.log(values);

        // Remove the previous county dataset
        /*
        if (myLineChart.data.datasets.length > 1) {
            myLineChart.data.datasets.pop();
        };
        // Updating chart with new data -- employment data
        myLineChart.data.labels = years;
        myLineChart.data.datasets.forEach((dataset) => {
            dataset.label = 'NC Employees';
            dataset.data = values.map( (d) => d);
            dataset.borderColor = ncColor(1);
            dataset.fillColor = ncColor(0.6);
            dataset.fill = false
        });*/
        while (myLineChart.data.datasets.length > 0) {
            myLineChart.data.datasets.pop()
        }
           
        myLineChart.data.labels = years;
        myLineChart.data.datasets.push({
            label : 'NC Employees',
            data : values.map( (d) => d),
            borderColor : ncColor(1),
            backgroundColor:  ncColor(0.5),
            fill : false
        })
        myLineChart.options.legend.display = true;

        // Updating chart with new data - population data
        pop_url = "http://127.0.0.1:5000/get_population/" + year + "/STATE"
        d3.json(pop_url, function(population){
            console.log("for pop", population)
            var newDataSet = {
                label: 'NC Population',
                data: population.size,
                borderwidth: 0.2,
                borderColor : 'rgba(128, 128, 128, 0.1)',
                backgroundColor:  'rgba(128, 128, 128, 0.1)',
                pointRadius: 0,
                fill: true,
                cubicInterpolationMode: 'monotone'
            }
            myLineChart.data.datasets.push(newDataSet);
            myLineChart.update();
        });   
        //myLineChart.update();
    });  
}

function countyCharts(year, county, census) {

    //-- Update the bar chart

    var cind = 4 // county index
    var eind = 1 // emp index
    var nind = 2 // naics-code index

    d3.json("http://127.0.0.1:5000/get_combined_codes", function(codes){
        console.log(codes,county)
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
        myBarChart.options.title.text = 'Employees of Sectors in '+year;
        myBarChart.update();
    })

    //- Update the line chart
    var url = "http://127.0.0.1:5000/get_county_data/"+county;
    d3.json(url, function(data) {
        /*
        // Removing existing county data in the chart
        if (myLineChart.data.datasets.length > 1 ) {
            myLineChart.data.datasets.pop();
        }

        //console.log("county line", data.size)
        // Updating existing chart look
        myLineChart.data.datasets.forEach( (dataset) => {
            dataset.label = 'NC State-wide'
            dataset.backgroundColor= ncColor(0.5)
        });
        */
        myLineChart.data.datasets.pop();
        myLineChart.data.datasets.pop();
        // Set a new dataset with county data
        var newDataset = {
            label: 'Total Number of Employees',
            fill: false,
            fillColor: countyColor(0.5),
            backgroundColor: countyColor(0.5),
            borderColor:  countyColor(0.6),  //"#3e95cd",
            data: data.size
        }
        myLineChart.data.datasets.push(newDataset);

        // Updating chart with new data - population data
        pop_url = "http://127.0.0.1:5000/get_population/" + year + "/" + county
        d3.json(pop_url, function(population){
            console.log("for pop", county, population)
            var newDataSet = {
                label: 'Population',
                data: population.size,
                borderwidth: 0.2,
                borderColor : 'rgba(128, 128, 128, 0.1)',
                backgroundColor:  'rgba(128, 128, 128, 0.1)',
                pointRadius: 0,
                fill: true,
                cubicInterpolationMode: 'monotone'
            }
            myLineChart.data.datasets.push(newDataSet);
            myLineChart.options.legend = {
                display : true,
                fillStyle: 'rgb(255,255,255'
            }
            myLineChart.options.title = {
                display : true,
                text: county + ' County:' + 'Employees since 1986'
            }
            myLineChart.update();
        });   
        /*
        myLineChart.options.scales = {
            xAxes: [{
                display: true
            }],
            yAxes: [{
                display: true,
                type: 'logarithmic',
                scaleLabel: {
                    display: true,
                    labelString: 'Log. Employee Numbers'
                }
            }]
        };*/
    });
}