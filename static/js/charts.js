const naics_codes = {
    "00": "Total for all sectors", 
    "11": "Agriculture, forestry, fishing and hunting", 
    "21": "Mining, quarrying, and oil and gas extraction", 
    "22": "Utilities", 
    "23": "Construction", 
    "42": "Wholesale trade", 
    "51": "Information", 
    "52": "Finance and insurance", 
    "53": "Real estate and rental and leasing", 
    "54": "Professional, scientific, and technical services", 
    "55": "Management of companies and enterprises", 
    "56": "Administrative and support and waste management and remediation services", 
    "61": "Educational services", 
    "62": "Health care and social assistance", 
    "71": "Arts, entertainment, and recreation", 
    "72": "Accommodation and food services", 
    "81": "Other services (except public administration)", 
    "95": "Auxiliaries, exc corp, subsidiary, & regional managing offices", 
    "99": "Industries not classified" };

function init_barChart(empNum) {


    //---- Init bar chart with top 10 otus of the given sample

    //var ctx = d3.select("#barChart")
    var ctx = document.getElementById('barChart').getContext('2d');

    var data = {
        labels: Object.keys(naics_codes),
        datasets: [{
            barPercentage: 0.5,
            barThickness: 6,
            maxBarThickness: 8,
            minBarLength: 2,
            data: empNum
        }]
    };

    var options = {
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

    //---- Init line chart with the given sample
    
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
function empNCxy(empdata) {

    var ncTotal= [];

    Object.keys(naics_codes).forEach(function(ncode){
        cdata = empdata.filter( (d) => d[2] === ncode );
        carray = cdata.map( (d) => parseInt(d[1]));
        csum = 0;
        for (var i = 0; i < carray.length; i++) { csum += carray[i] }    
        ncTotal.push({x: ncode, y: csum})
    })

    return ncTotal;
}

