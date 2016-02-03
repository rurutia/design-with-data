var express    = require('express');
var app        = express();
var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var beautify = require('js-beautify').js_beautify;
var Promise = require("bluebird");

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

function createHttpPromise(option) {
  return new Promise(function(resolve, reject) {
      var str = '';
      https.request(option, function(response) {
          response.on('data', function (chunk) { str += chunk; });
          response.on('end', function () {
              resolve(str);
          });
      }).end();
  });
};

router.get('/live/:resourceName', function(req, res) {
    var result = {content: []};
    switch(req.params.resourceName) {
        case "racing":
            var randomMeetings;
            createHttpPromise({host: "m.sb.pre.sbetenv.com", path:"/v1/sportsbook/meetings?classId=1"}).then(function(response) {
                console.log(response);
                var meetings = JSON.parse(response).meetingList;
                randomMeetings = _.sample(meetings, 4);
                return createHttpPromise({host: "m.sb.pre.sbetenv.com", path:"/mobile/sportsbook/racecardmeeting/" + randomMeetings[0].eventList[0].id})
            }).then(function(response) {
                console.log(response);
                var event = JSON.parse(response).meeting.event[0];
                result.content.push(getContentItemFromResponse(event));
                return createHttpPromise({host: "m.sb.pre.sbetenv.com", path:"/mobile/sportsbook/racecardmeeting/" + randomMeetings[1].eventList[0].id})
            }).then(function(response) {
                console.log(response);
                var event = JSON.parse(response).meeting.event[0];
                result.content.push(getContentItemFromResponse(event));
                return createHttpPromise({host: "m.sb.pre.sbetenv.com", path:"/mobile/sportsbook/racecardmeeting/" + randomMeetings[2].eventList[0].id})
            }).then(function(response) {
                console.log(response);
                var event = JSON.parse(response).meeting.event[0];
                result.content.push(getContentItemFromResponse(event));
                return createHttpPromise({host: "m.sb.pre.sbetenv.com", path:"/mobile/sportsbook/racecardmeeting/" + randomMeetings[3].eventList[0].id})
            }).then(function(response) {
                console.log(response);
                var event = JSON.parse(response).meeting.event[0];
                result.content.push(getContentItemFromResponse(event));
                result.content = beautify(JSON.stringify(result.content));
                res.json(result);
            });

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
