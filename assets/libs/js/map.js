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
    // Date time range picker
    // ============================================================== 
    $('input[name="datetimes"]').daterangepicker({
        timePicker: true,
        startDate: moment().startOf('hour').subtract(24 * 14, 'hour'),
        endDate: moment().startOf('hour'),
        locale: {
            format: 'M/DD hh:mm A'
        }
    });

}); // END OF JQUERY





// ============================================================== 
// stuff
// ============================================================== 

function changeLoginToLogoutURL() {
    document.getElementById("loginBtn").href = "https://algaelytics.auth.ca-central-1.amazoncognito.com/logout?client_id=rr1puarvl8edm9e4ofmocfrjf&logout_uri=https://algaelytics-web.s3.ca-central-1.amazonaws.com/index.html";
    document.getElementById("loginBtn").href = "https://algaelytics.auth.ca-central-1.amazoncognito.com/logout?client_id=rr1puarvl8edm9e4ofmocfrjf&logout_uri=http://localhost:8080";
}

function appendTokenToURL() {
    var url_string = window.location.href;
    document.getElementById("a-realtime").href = "/realtime.html/" + url_string.substring(url_string.indexOf("#"));
    document.getElementById("a-map").href = "/map.html/" + url_string.substring(url_string.indexOf("#"));
    document.getElementById("a-index").href = "/index.html/" + url_string.substring(url_string.indexOf("#"));

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

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
}

/* Makes a scan of the DynamoDB table to set a data object for the chart */
function getData() {

    var docClient = new AWS.DynamoDB.DocumentClient();
    var params = {
        TableName: 'hubData',
        KeyConditionExpression: 'deviceID = :part',
        ProjectionExpression: "#timestamp, #lat, #lon",
        ExpressionAttributeNames: {
            "#timestamp": "timestamp",
            "#lat": "lat",
            "#lon": "lon",
        },
        ScanIndexForward: false,
        Limit: 1,
        ExpressionAttributeValues: {
            ":part": "864475040553264",
        }
    };

    docClient.query(params, function (err, data) {
        if (err) {
            document.getElementById('textarea').innerHTML = "Query failed: " + "\n" + JSON.stringify(err, undefined, 2);
            return null;
        } else {
            document.getElementById('textarea').innerHTML = "Query succeeded: " + "\n" + JSON.stringify(data, undefined, 2);
            var latVal = parseFloat(data['Items'][0]['lat']);
            var lonVal = parseFloat(data['Items'][0]['lon']);
            var timestamp = new Date(0);
            timestamp.setUTCSeconds(parseFloat(data['Items'][0]['timestamp']));
        
            const contentString =
                '<div>' +
                '<h5 id="firstHeading" class="firstHeading">' + "864475040553264" + '</h5>' +
                '<div id="bodyContent">' +
                "<p>Last update time: " + String(timestamp) + "</p>" +
                "</div>";
        
            const infowindow = new google.maps.InfoWindow({
                content: contentString,
                ariaLabel: "864475040553264",
            });
        
            const marker = new google.maps.Marker({
                position: {
                    lat: latVal,
                    lng: lonVal,
                },
                map,
                title: "864475040553264",
            });
        
            marker.addListener("click", () => {
                infowindow.open({
                    anchor: marker,
                    map,
                });
            });
        }
    });


}

let map;

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: {
            lat: 48.47339545086138, 
            lng: -123.23257108189898
        },
        zoom: 6,
    });

}

window.initMap = initMap;