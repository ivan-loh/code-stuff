var MongoClient = require('mongodb').MongoClient;
var Server      = require('mongodb').Server;
var http        = require('http');
var url         = require('url');
var fs          = require('fs');
var filename    = __dirname + '/' + require('node-uuid').v4();
var lineReader  = require('line-reader');
var client      = new MongoClient(new Server('localhost', 27017));


/*
 * File Download
 */
var download = function download(next, client) {

  // Http Request options
  var options = url.parse('http://standards.ieee.org/develop/regauth/oui/oui.txt');
  options.agent = false;

  // Download handler
  var handle = function handle(res) {
    var outFile = fs.createWriteStream(filename);
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
	outFile.write(chunk);
     }).on('end', function () {
	outFile.end();
	return next(null, client);
     }).on('close', function () {
	outFile.end();
	fs.unlink(filename, function () {
	  return next(new Error('premature eof'));
	});
     });
  };

  // error handler
  var error = function error(err) {
    return next(err);
  };

  // Request!
  http.request(options, handle).on('error',error).end();

};

/*
 * Database Insert
 */
var insert = function insert(err, client) {

  var db      = client.db('tide');
  var ouis    = db.collection('oui');
  var options = { w:1, continueOnError: true };

  var display = function (err, count) {
    if (err) console.warn(err);
  };

  // File Reading.
  lineReader.eachLine(filename, function (line) {
    var oui, name;
    line = line.trimLeft().trimRight();

    // Extraction
    if (line.length > 15) {
      oui  = line.substr(0,8).split('-').join('');
      line = line.substr(9).trimLeft();
      if (line.substr(0,5) === '(hex)')
	name = line.substr(6).trimLeft();
    }

    // Insertion
    if ( (!!oui)  && (oui.length === 6) &&
	 (!!name) && (name.length > 0) ) {
      ouis.insert({ _id: oui, name: name }, options, display);
    }

  }).then(function () {
    // Clean Up
    fs.unlink(filename, function(err) {
      if (err) console.warn(err);
      db.close();
      console.log('Import Completed');
    });
  });

};

// Let the games begin.
client.open(function (err, client) {
  download(insert, client);
});
