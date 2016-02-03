var express    = require('express');
var app        = express();
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var beautify = require('js-beautify').js_beautify;

var bodyParser = require('body-parser');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// app.use(express.static(__dirname + '/client'));

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router
// middleware to use for all requests
router
.use(function(req, res, next) {
    // do logging
    console.log('url: ' + req.url);
    next();
})
.use(express.static(__dirname + '/client'));

var filePath = path.join(__dirname, '../output-data');

router.get('/files', function(req, res) {
    fs.readdir(filePath, function(err,list){
        if(err) throw err;
        var result = [];
        for(var i=0; i<list.length; i++) {
            console.log(list[i]);
            result.push({
                type: 'file',
                name: list[i]
            });
        }
        res.json(result);
    });
});

// hardcode for now, should be loaded from configuration in production
var liveResources = [];
liveResources.push({type: 'live', name: 'racing'});
liveResources.push({type: 'live', name: 'soccer'});
liveResources.push({type: 'live', name: 'AFL'});

router.get('/live', function(req, res) {
    res.json(liveResources);
});

router.get('/file/:filename', function(req, res) {
	fs.readFile(path.join(__dirname, '../output-data', req.params.filename), 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        var result = {
            filename: req.params.filename,
            content: data
        };
        res.json(result);
    });
});

router.post('/login', function(req, res) {
    console.log(req.body);
    if(req.body.username == 'admin' && req.body.password == 'admin' ) {
        res.json({success: true});
    } else {
        res.json({success: false});
    }
});

router.post('/file/:filename', function(req, res) {
    var filename = req.params.filename;

    var json = beautify(JSON.stringify(req.body));
    fs.writeFile(path.join(__dirname, '../output-data', filename), json, function (err) {
        if (err) return console.log(err);
    });
    res.json({success: true});
});

router.post('/newfile/:filename', function(req, res) {
    var filename = req.params.filename;

    var json = beautify(JSON.stringify(req.body));
    fs.writeFile(path.join(__dirname, '../output-data', filename), json, function (err) {
        if (err) return console.log(err);
    });

    res.json({
        success: true,
        file: {type: "file", name: filename}
    });
});

var http = require('http'),
    https = require('https');

function getContentItemFromResponse(event) {
	var contentItem = {
		meeting_name: event.meetingName || 'Trentham',
        distance: event.distance ? event.distance + 'm' : '2300m',
        event_name: event.name || 'R1 The Kilbirnie Sports (bm65)',
        weather: event.weather || 'Ocast',
        runner_name: 'From Pentridge',
        runner_number: '7',
        form: '3x44',
        jockey: 'Winona Costin',
        trainer: 'J A Steinmetz',
        weight: '58kg',
        win: '16.36',
        place: '4.07'
	};
	if (event.marketList && event.marketList[0]) {
		var firstMarket = event.marketList[0];
		if (firstMarket.outcomeList && firstMarket.outcomeList[0]) {
			var firstOutcome = firstMarket.outcomeList[0];
			var weight = firstOutcome.weightGram;
			if (weight && !isNaN(weight)) {
				weight = Math.round(weight / 100) / 10 + 'kg';
			}
			contentItem = _.extend(contentItem, {
				runner_name: firstOutcome.name,
		        runner_number: firstOutcome.runnerNumber,
		        form: firstOutcome.shortForm,
		        jockey: firstOutcome.jockey,
		        trainer: firstOutcome.trainer,
		        weight: weight
			});
			
			if (firstOutcome.prices && firstOutcome.prices[0]) {
				contentItem = _.extend(contentItem, {
					win: firstOutcome.prices[0].winPrice,
			        place: firstOutcome.prices[0].placePrice
				});
			}
		}
	}
	return contentItem;
}

router.get('/live/:resourceName', function(req, res) {
    switch(req.params.resourceName) {
        case "racing":
            var options1 = {host: "m.sb.pre.sbetenv.com", path:"/v1/sportsbook/meetings?classId=1"};
            var str = '';
            var callback1 = function(response) {
              response.on('data', function (chunk) { str += chunk; });
              response.on('end', function () {
                var meetings = JSON.parse(str).meetingList;
                var randomMeetings = _.sample(meetings, 4);
                var result = {
                	content: []
                };
                
            	//----
                var options2 = {host: "m.sb.pre.sbetenv.com", path:"/mobile/sportsbook/racecardmeeting/" + randomMeetings[0].eventList[0].id};
                var callback2 = function(response) {
                  var str2 = '';
                  response.on('data', function (chunk) { str2 += chunk; });
                  response.on('end', function () {
                    var event = JSON.parse(str2).meeting.event[0];
                    result.content.push(getContentItemFromResponse(event));
                    var options3 = {host: "m.sb.pre.sbetenv.com", path:"/mobile/sportsbook/racecardmeeting/" + randomMeetings[1].eventList[0].id};
                    var callback3 = function(response) {
                        var str3 = '';
                        response.on('data', function (chunk) { str3 += chunk; });
                        response.on('end', function () {
                          var event = JSON.parse(str3).meeting.event[0];
                          result.content.push(getContentItemFromResponse(event));
                          var options4 = {host: "m.sb.pre.sbetenv.com", path:"/mobile/sportsbook/racecardmeeting/" + randomMeetings[2].eventList[0].id};
                          var callback4 = function(response) {
                              var str4 = '';
                              response.on('data', function (chunk) { str4 += chunk; });
                              response.on('end', function () {
                                var event = JSON.parse(str4).meeting.event[0];
                                result.content.push(getContentItemFromResponse(event));
                                var options5 = {host: "m.sb.pre.sbetenv.com", path:"/mobile/sportsbook/racecardmeeting/" + randomMeetings[3].eventList[0].id};
                                var callback5 = function(response) {
                                    var str5 = '';
                                    response.on('data', function (chunk) { str5 += chunk; });
                                    response.on('end', function () {
                                      var event = JSON.parse(str5).meeting.event[0];
                                      result.content.push(getContentItemFromResponse(event));
                                      result.content = beautify(JSON.stringify(result.content));

                                      res.json(result);
                                    });
                                  };
                                  https.request(options5, callback5).end();
                                
                              });
                            };
                            https.request(options4, callback4).end();
                        });
                      };
                      https.request(options3, callback3).end();
                  });
                };
                https.request(options2, callback2).end();

                //----             
                
              });
            };
            https.request(options1, callback1).end();

            break;

        default:
            res.json({content: "to be added soon..."});
            break;

    };
});

app.use('/', router);

// Start server
app.listen(3000, function () {
    console.log("Sketch data populator server listening on port %d", this.address().port);
});
