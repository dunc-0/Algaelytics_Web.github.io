jQuery(document).ready(function ($) {
    'use strict';

    // ============================================================== 
    // Notification list
    // ============================================================== 
    if ($(".notification-list").length) {

        $('.notification-list').slimScroll({
            height: '250px'
        });

    }

    // ============================================================== 
    // Menu Slim Scroll List
    // ============================================================== 


    if ($(".menu-list").length) {
        $('.menu-list').slimScroll({

        });
    }

    // ============================================================== 
    // Sidebar scrollnavigation 
    // ============================================================== 

    if ($(".sidebar-nav-fixed a").length) {
        $('.sidebar-nav-fixed a')
            // Remove links that don't actually link to anything

            .click(function (event) {
                // On-page links
                if (
                    location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') &&
                    location.hostname == this.hostname
                ) {
                    // Figure out element to scroll to
                    var target = $(this.hash);
                    target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
                    // Does a scroll target exist?
                    if (target.length) {
                        // Only prevent default if animation is actually gonna happen
                        event.preventDefault();
                        $('html, body').animate({
                            scrollTop: target.offset().top - 90
                        }, 1000, function () {
                            // Callback after animation
                            // Must change focus!
                            var $target = $(target);
                            $target.focus();
                            if ($target.is(":focus")) { // Checking if the target was focused
                                return false;
                            } else {
                                $target.attr('tabindex', '-1'); // Adding tabindex for elements not focusable
                                $target.focus(); // Set focus again
                            };
                        });
                    }
                };
                $('.sidebar-nav-fixed a').each(function () {
                    $(this).removeClass('active');
                })
                $(this).addClass('active');
            });

    }

    // ============================================================== 
    // tooltip
    // ============================================================== 
    if ($('[data-toggle="tooltip"]').length) {

        $('[data-toggle="tooltip"]').tooltip()

    }

    // ============================================================== 
    // popover
    // ============================================================== 
    if ($('[data-toggle="popover"]').length) {
        $('[data-toggle="popover"]').popover()

    }

}); // END OF JQUERY





// ============================================================== 
// stuff
// ============================================================== 

function changeLoginToLogoutURL() {
    document.getElementById("loginBtn").href = "https://algaelytics.auth.ca-central-1.amazoncognito.com/logout?client_id=rr1puarvl8edm9e4ofmocfrjf&logout_uri=https://algaelytics-web.s3.ca-central-1.amazonaws.com/index.html";
    //document.getElementById("loginBtn").href = "https://algaelytics.auth.ca-central-1.amazoncognito.com/logout?client_id=rr1puarvl8edm9e4ofmocfrjf&logout_uri=http://localhost:8080";
}

function appendTokenToURL() {
    var url_string = window.location.href;
    document.getElementById("a-index").href = "/index.html" + url_string.substring(url_string.indexOf("#"));
    document.getElementById("a-map").href = "/map.html" + url_string.substring(url_string.indexOf("#"));
    document.getElementById("a-historical").href = "/historical.html" + url_string.substring(url_string.indexOf("#"));
}

// ============================================================== 
// aws stuff
// ============================================================== 

var idToken = null;
var timerangeStart, timerangeEnd = 0;

function checkLogin() {
    var url_string = window.location.href;
    url_string = url_string.replace("#", "?")
    var url = new URL(url_string);
    idToken = url.searchParams.get("id_token");
    if (idToken != null) {
        var parsedIdToken = parseJwt(idToken);
        document.getElementById("navbarDropdownMenuLink2").innerHTML = "Hello, <span style=\"font-family: Sorts Mill Goudy\; color: #008000;\"><b>" + parsedIdToken.name.toUpperCase() + "</b></span>!&nbsp;&nbsp;&nbsp;<img src=\"/assets/images/user_green.png\" alt=\"\" class=\"user-avatar-md rounded-circle\"></img>";
        document.getElementById("signinStatus").innerHTML = "Signed In";
        document.getElementById("signinName").innerHTML = parsedIdToken.name;
        document.getElementById("loginBtn").innerHTML = "<i class=\"fas fa-power-off mr-2\"></i>Logout";
        document.getElementById("loginSplash").style.display = "none";
        document.getElementById("pageContent").style.display = "block";
        appendTokenToURL();
        changeLoginToLogoutURL();
        auth();
    } else {
        document.getElementById("navbarDropdownMenuLink2").innerHTML = "Login &nbsp;&nbsp;&nbsp;<img src=\"assets/images/user.png\" alt=\"\" class=\"user-avatar-md rounded-circle\"></img>";
        document.getElementById("signinStatus").innerHTML = "Signed Out";
        document.getElementById("signinName").innerHTML = "-";
        document.getElementById("loginBtn").innerHTML = "<i class=\"fas fa-power-off mr-2\"></i>Login";
        document.getElementById("pageContent").style.display = "none";
        document.getElementById("loginSplash").style.display = "block";
    }
}

function auth() {
    AWS.config.update({
        region: "ca-central-1",
    });
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'ca-central-1:c0f6e0de-7f28-4daf-b773-8dc9bcbf0127',
        Logins: {
            "cognito-idp.ca-central-1.amazonaws.com/ca-central-1_s3VpKETXG": idToken
        }
    });
}

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

$(function () {
    getData();
    $.ajaxSetup({ cache: false });
    setInterval(getData, 300000);
});


/* Makes a scan of the DynamoDB table to set a data object for the chart */
function getData() {

    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: 'hubData',
        KeyConditionExpression: 'deviceID = :part AND #timestamp BETWEEN :t1 AND :t2',
        ProjectionExpression: "#timestamp, #tempWater, #tempAir, #humidity, #salinity, #curSpd, #pH, #waves",
        ExpressionAttributeNames: {
            "#timestamp": "timestamp",
            "#tempWater": "tempWater",
            "#tempAir": "tempAir",
            "#humidity": "humidity",
            "#salinity": "salinity",
            "#curSpd": "curSpd",
            "#waves": "waves",
            "#pH": "pH",
        },
        ExpressionAttributeValues: {
            ":part": "864475040553264",
            ":t1": String(0.001 * (Date.now() - 12 * 60 * 60 * 1000)),
            ":t2": String(0.001 * (Date.now())),
        }
    };

    docClient.query(params, function (err, data) {
        if (err) {
            document.getElementById('textarea').innerHTML = "Query failed: " + "\n" + JSON.stringify(err, undefined, 2);
            return null;
        } else {
            document.getElementById('textarea').innerHTML = "Query succeeded: " + "\n" + JSON.stringify(data, undefined, 2);

            // placeholders for the data arrays
            var tempWaterVals = [];
            var tempAirVals = [];
            var humidityVals = [];
            var salinityVals = [];
            var pHVals = [];
            var wavesVals = [];
            var curSpdVals = [];
            var labelVals = [];

            // placeholders for the data read
            var tempAir = 0.0;
            var tempWater = 0.0;
            var humidity = 0.0;
            var salinity = 0.0;
            var pH = 0.0;
            var waves = 0.0;
            var curSpd = 0.0;
            var timestamp = "";

            for (var i in data['Items']) {
                // read the values from the dynamodb JSON packet
                tempWater = parseFloat(data['Items'][i]['tempWater']);
                tempAir = parseFloat(data['Items'][i]['tempAir']);
                humidity = parseFloat(data['Items'][i]['humidity']);
                salinity = parseFloat(data['Items'][i]['salinity']);
                pH = parseFloat(data['Items'][i]['pH']);
                waves = parseFloat(data['Items'][i]['waves']);
                curSpd = parseFloat(data['Items'][i]['curSpd']);
                timestamp = new Date(0);
                timestamp.setUTCSeconds(parseFloat(data['Items'][i]['timestamp']));

                const enUS = timestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                // append the read data to the data arrays
                tempWaterVals.push(tempWater);
                tempAirVals.push(tempAir);
                humidityVals.push(humidity);
                salinityVals.push(salinity);
                pHVals.push(pH);
                curSpdVals.push(curSpd);
                wavesVals.push(waves);
                labelVals.push(enUS);
            }

            // set the chart object data and label arrays
            temperaturegraph.data.labels = labelVals;
            humiditygraph.data.labels = labelVals;
            salinitygraph.data.labels = labelVals;
            pHgraph.data.labels = labelVals;
            wavesgraph.data.labels = labelVals;
            curSpdgraph.data.labels = labelVals;
            temperaturegraph.data.datasets[0].data = tempWaterVals;
            temperaturegraph.data.datasets[1].data = tempAirVals;
            humiditygraph.data.datasets[0].data = humidityVals;
            salinitygraph.data.datasets[0].data = salinityVals;
            curSpdgraph.data.datasets[0].data = curSpdVals;
            wavesgraph.data.datasets[0].data = wavesVals;
            pHgraph.data.datasets[0].data = pHVals;

            // redraw the graph canvas
            temperaturegraph.update();
            humiditygraph.update();
            salinitygraph.update();
            wavesgraph.update();
            curSpdgraph.update();
            pHgraph.update();
        }
    });
}

/* Create the context for applying the chart to the HTML canvas */
var tctx = $("#temperaturegraph").get(0).getContext("2d");
var hctx = $("#humiditygraph").get(0).getContext("2d");
var sctx = $("#salinitygraph").get(0).getContext("2d");
var pHctx = $("#pHgraph").get(0).getContext("2d");
var cSctx = $("#curSpdgraph").get(0).getContext("2d");
var wctx = $("#wavesgraph").get(0).getContext("2d");


/* Set the options for our line charts */
var options = {
    legend: {
        display: true,
        position: 'bottom',
        labels: {
            fontColor: '#71748d',
            fontFamily: 'Circular Std Book',
            fontSize: 14,
        }
    },
    responsive: true,
    showLines: true,
    scales: {
        xAxes: [{
            ticks: {
                //display: false,
                fontSize: 14,
                fontFamily: 'Circular Std Book',
                fontColor: '#71748d',
            }
        }],
        yAxes: [{
            ticks: {
                fontSize: 14,
                fontFamily: 'Circular Std Book',
                fontColor: '#71748d',
            }
        }]
    }
};

/* Set the options for our line charts */
var h_options = {
    legend: {
        display: true,
        position: 'bottom',
        labels: {
            fontColor: '#71748d',
            fontFamily: 'Circular Std Book',
            fontSize: 14,
        }
    },
    responsive: true,
    showLines: true,
    scales: {
        xAxes: [{
            ticks: {
                //display: false,
                fontSize: 14,
                fontFamily: 'Circular Std Book',
                fontColor: '#71748d',
            }
        }],
        yAxes: [{
            ticks: {
                min: 0,
                max: 100,
                fontSize: 14,
                fontFamily: 'Circular Std Book',
                fontColor: '#71748d',
            }
        }]
    }
};

/* Set the options for our line charts */
var pH_options = {
    legend: {
        display: true,
        position: 'bottom',
        labels: {
            fontColor: '#71748d',
            fontFamily: 'Circular Std Book',
            fontSize: 14,
        }
    },
    responsive: true,
    showLines: true,
    scales: {
        xAxes: [{
            ticks: {
                //display: false,
                fontSize: 14,
                fontFamily: 'Circular Std Book',
                fontColor: '#71748d',
            }
        }],
        yAxes: [{
            ticks: {
                min: 6,
                max: 10,
                fontSize: 14,
                fontFamily: 'Circular Std Book',
                fontColor: '#71748d',
            }
        }]
    }
};

/* Set the inital data */
var t_init = {
    labels: [],
    datasets: [
        {
            label: "Water Temperature (??C)",
            backgroundColor: "rgba(89, 105, 255,0.5)",
            borderColor: "rgba(89, 105, 255,0.7)",
            borderWidth: 2,
            data: []
        },
        {
            label: "Air Temperature (??C)",
            backgroundColor: "rgba(255, 64, 123,0.5)",
            borderColor: "rgba(255, 64, 123,0.7)",
            borderWidth: 2,
            data: []
        },
    ]
};

/* Set the inital data */
var h_init = {
    labels: [],
    datasets: [
        {
            label: "Air Humidity (%)",
            backgroundColor: "rgba(0, 140, 255, 0.5)",
            borderColor: "rgba(0, 140, 255, 0.7)",
            borderWidth: 2,
            data: []
        }
    ]
};

/* Set the inital data */
var s_init = {
    labels: [],
    datasets: [
        {
            label: "Total Dissolved Solids (ppm)",
            backgroundColor: "rgba(40, 200, 80, 0.5)",
            borderColor: "rgba(40, 200, 80, 0.7)",
            borderWidth: 2,
            data: []
        }
    ]
};

/* Set the inital data */
var pH_init = {
    labels: [],
    datasets: [
        {
            label: "pH Level",
            borderColor: "rgba(255, 0, 0, 0.7)",
            backgroundColor: "rgba(255, 0, 0, 0.5)",
            fill: false,
            borderWidth: 2,
            data: [],
        }
    ]
};


/* Set the inital data */
var w_init = {
    labels: [],
    datasets: [
        {
            label: "Wave Data (m)",
            borderColor: "rgba(255, 145, 0, 0.7)",
            backgroundColor: "rgba(255, 145, 0, 0.5)",
            borderWidth: 2,
            data: [],
        }
    ]
};

/* Set the inital data */
var cS_init = {
    labels: [],
    datasets: [
        {
            label: "Current Speed (cm/s)",
            borderColor: "rgba(245, 100, 255, 0.7)",
            backgroundColor: "rgba(245, 100, 255, 0.5)",
            borderWidth: 2,
            data: [],
        }
    ]
};

var temperaturegraph = new Chart.Line(tctx, { data: t_init, options: options });
var humiditygraph = new Chart.Line(hctx, { data: h_init, options: h_options });
var salinitygraph = new Chart.Line(sctx, { data: s_init, options: options });
var pHgraph = new Chart.Line(pHctx, { data: pH_init, options: pH_options });
var wavesgraph = new Chart.Line(wctx, { data: w_init, options: options });
var curSpdgraph = new Chart.Line(cSctx, { data: cS_init, options: options });

$('#datetimes').on('apply.daterangepicker', function (ev, picker) {
    console.log("start: " + picker.startDate.unix());
    console.log("end: " + picker.endDate.unix());
    timerangeStart = String(picker.startDate.unix());
    timerangeEnd = String(picker.endDate.unix());
});

