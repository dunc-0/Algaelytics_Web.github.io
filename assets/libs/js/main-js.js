
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
    // ============================================================== 
    // Chat List Slim Scroll
    // ============================================================== 


    if ($('.chat-list').length) {
        $('.chat-list').slimScroll({
            color: 'false',
            width: '100%'


        });
    }

}); // END OF JQUERY





// ============================================================== 
// stuff
// ============================================================== 

function changeLoginToLogoutURL() {
    document.getElementById("loginBtn").href = "https://algaelytics.auth.ca-central-1.amazoncognito.com/logout?client_id=rr1puarvl8edm9e4ofmocfrjf&logout_uri=https://algaelytics-web.s3.ca-central-1.amazonaws.com/index.html";
    document.getElementById("loginBtn").href = "https://algaelytics.auth.ca-central-1.amazoncognito.com/logout?client_id=rr1puarvl8edm9e4ofmocfrjf&logout_uri=http://localhost:8080";
}


// ============================================================== 
// aws stuff
// ============================================================== 

var idToken = null;

function checkLogin() {
    var url_string = window.location.href;
    url_string = url_string.replace("#", "?")
    var url = new URL(url_string);
    idToken = url.searchParams.get("id_token");
    if (idToken != null) {
        var parsedIdToken = parseJwt(idToken);
        document.getElementById("navbarDropdownMenuLink2").innerHTML = "Hello, <span style=\"font-family: Sorts Mill Goudy\; color: #008000;\"><b>" + parsedIdToken.name.toUpperCase() + "</b></span>!&nbsp;&nbsp;&nbsp;<img src=\"assets/images/user.png\" alt=\"\" class=\"user-avatar-md rounded-circle\"></img>";
        document.getElementById("signinStatus").innerHTML = "Signed In";
        document.getElementById("signinName").innerHTML = parsedIdToken.name;
        document.getElementById("loginBtn").innerHTML = "<i class=\"fas fa-power-off mr-2\"></i>Logout";
        document.getElementById("pageContent").style.display = "block";
        changeLoginToLogoutURL();
        auth();
    } else {
        document.getElementById("navbarDropdownMenuLink2").innerHTML = "Login &nbsp;&nbsp;&nbsp;<img src=\"assets/images/user.png\" alt=\"\" class=\"user-avatar-md rounded-circle\"></img>";
        document.getElementById("signinStatus").innerHTML = "Signed Out";
        document.getElementById("signinName").innerHTML = "-";
        document.getElementById("loginBtn").innerHTML = "<i class=\"fas fa-power-off mr-2\"></i>Login";
        document.getElementById("pageContent").style.display = "none";
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

function readItem() {
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: "SensorStor",
        Key: {
            "EventID": "80ad1045-b637-4901-ab86-eb654a75ad2a", // Partition Key
        }
    };
    docClient.get(params, function (err, data) {
        if (err) {
            document.getElementById('textarea').innerHTML = "Unable to read item: " + "\n" + JSON.stringify(err, undefined, 2);
        } else {
            document.getElementById('textarea').innerHTML = "GetItem succeeded: " + "\n" + JSON.stringify(data, undefined, 2);
        }
    });
}

function getPartitionKeys() {
    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: 'hubData',
        ProjectionExpression: 'deviceID'
    };
    docClient.scan(params, function (err, data) {
        if (err) {
            document.getElementById('textarea').innerHTML = "Unable to read item: " + "\n" + JSON.stringify(err, undefined, 2);
        } else {
            document.getElementById('textarea').innerHTML = "Scan succeeded: " + "\n" + JSON.stringify(data, undefined, 2);
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
        KeyConditionExpression: 'deviceID = :part',
        ProjectionExpression: "#timestamp, #tempWater",
        ExpressionAttributeNames: {
            "#timestamp": "timestamp",
            "#tempWater": "tempWater",
        },
        ExpressionAttributeValues: {
            ":part": "864475040553264"
        }
    };

    docClient.query(params, function (err, data) {
        if (err) {
            document.getElementById('textarea').innerHTML = "Query failed: " + "\n" + JSON.stringify(err, undefined, 2);
            return null;
        } else {

            console.log(data);
            document.getElementById('textarea').innerHTML = "Query succeeded: " + "\n" + JSON.stringify(data, undefined, 2);

            // placeholders for the data arrays
            var tempVals = [];
            var labelVals = [];

            // placeholders for the data read
            var temp = 0.0;
            var time = "";

            for (var i in data['Items']) {
                // read the values from the dynamodb JSON packet
                temp = parseFloat(data['Items'][i]['tempWater']);
                var time = new Date(0);
                time.setUTCSeconds(parseFloat(data['Items'][i]['timestamp']));

                // append the read data to the data arrays
                tempVals.push(temp);
                labelVals.push(time);
            }

            // set the chart object data and label arrays
            temperaturegraph.data.labels = labelVals;
            temperaturegraph.data.datasets[0].data = tempVals;

            // redraw the graph canvas
            temperaturegraph.update();
        }
    });
}

/* Create the context for applying the chart to the HTML canvas */
var tctx = $("#temperaturegraph").get(0).getContext("2d");

/* Set the options for our chart */
var options = {
    responsive: true,
    showLines: true,
    scales: {
        xAxes: [{
            display: false
        }],
        yAxes: [{
            ticks: {
                beginAtZero: true
            }
        }]
    }
};

/* Set the inital data */
var tinit = {
    labels: [],
    datasets: [
        {
            label: "Temperature °C",
            backgroundColor: 'rgba(204,229,255,0.5)',
            borderColor: 'rgba(153,204,255,0.75)',
            data: []
        }
    ]
};

var temperaturegraph = new Chart.Line(tctx, { data: tinit, options: options });