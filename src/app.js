var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var mongodb = require('mongodb');
var sharp = require('sharp');
const fileType = require('file-type');

var db;

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/download/:id', function (req, res) {
    var col = db.collection('objects');
    var id = req.params.id;
    console.log('finding ' + id);
    const fields = {'name': 1, data: 1, mime: 1};
    col.findOne({_id: mongodb.ObjectId(id)}, fields, function (err, item) {
        if (item) {
            console.log('serving ' + item.name + ", len " + item.data.length() + ', mime ' + item.mime);
            res.writeHead(200, {
                'Content-Type': item.mime,
                'Content-Length': item.data.length()
            });
            res.end(new Buffer(item.data.read(0, item.data.length()), 'binary'));
        }
        else {
            res.status(404).end();
        }
    });
});

app.get('/thumbnail/:id', function (req, res) {
    var col = db.collection('objects');
    var id = req.params.id;
    console.log('finding ' + id);
    const fields = {'name': 1, thumbnail: 1, mime: 1};
    col.findOne({_id: mongodb.ObjectId(id)}, fields, function (err, item) {
        if (item) {
            console.log('serving ' + item.name + ", len " + item.thumbnail.length() + ', mime ' + item.mime);
            res.writeHead(200, {
                'Content-Type': item.mime,
                'Content-disposition': 'attachment;filename=' + item.name,
                'Content-Length': item.thumbnail.length()
            });
            res.end(new Buffer(item.thumbnail.read(0, item.thumbnail.length()), 'binary'));
        }
        else {
            res.status(404).end();
        }
    });
});

app.do_search = function (req, res, nameMatch) {
    var filter;
    if (nameMatch) {
        filter = {'name': {$regex: nameMatch}};
    }
    else {
        filter = {}
    }
    console.log('searching for ' + nameMatch);
    var col = db.collection('objects');
    col.find(filter, {name: 1, created_at: 1})
        .sort({created_at: -1})
        .limit(25)
        .toArray(function (err, items) {
                if (err) {
                    return console.log(err);
                }
                console.log('found ' + items.length + ' items');
                res.send(items);
            }
        );
};

app.get('/search/', function (req, res) {
    console.log('listing all entries');
    app.do_search(req, res);
});

app.get('/search/:name', function (req, res) {
    var name = req.params.name;
    console.log('searching for ' + name);
    app.do_search(req, res, name);
});

app.post('/upload', function (req, res) {

    // create an incoming form object
    var form = new formidable.IncomingForm();

    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = true;

    // store all uploads in the /uploads directory
    form.uploadDir = '/tmp/';

    form.on('file', function (field, file) {

        fs.readFile(file.path, function (err, data) {
            if (err) {
                fs.unlinkSync(file.path);
                return console.log(err);
            }
            fileInfo = fileType(data);
            if (!fileInfo.mime.startsWith('image')) {
                // only images make sense
                form._error('unsupported file type ' + fileInfo.mime);
                fs.unlinkSync(file.path);
                return console.log('unsupported file type ' + fileInfo.mime);
            }
            console.log('Uploading ' + file.name + ' to db, len ' + file.size + ', info ' + fileInfo);
            var col = db.collection('objects');

            sharp(data).resize(150).toBuffer(function (err, thumbnailData) {
                if (err) {
                    return console.log(err);
                }
                var record = {
                    name: file.name,
                    data: mongodb.Binary(data),
                    thumbnail: mongodb.Binary(thumbnailData),
                    created_at: new Date(),
                    mime: fileInfo.mime
                };
                col.insert(record);
                console.log('Done ' + file.name);
                fs.unlinkSync(file.path);
            });
        });
    });

    // log any errors that occur
    form.on('error', function (err) {
        console.log('An error has occured: \n' + err);
        res.status(422).end();
    });

    // once all the files have been uploaded, send a response to the client
    form.on('end', function () {
        console.log('upload done');
        res.end('success');
    });

    // parse the incoming request containing the form data
    form.parse(req);
});

// for OpenShift nodejs-mongo template health checks
app.get('/pagecount', function (req, res) {
    res.send({pagecount: 0});
});

app.init = function () {

    var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
        mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
        mongoURLLabel = '';

    if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
        var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
            mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
            mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
            mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
            mongoPassword = process.env[mongoServiceName + '_PASSWORD'];
        mongoUser = process.env[mongoServiceName + '_USER'];

        if (mongoHost && mongoPort && mongoDatabase) {
            mongoURLLabel = mongoURL = 'mongodb://';
            if (mongoUser && mongoPassword) {
                mongoURL += mongoUser + ':' + mongoPassword + '@';
            }
            // Provide UI label that excludes user id and pw
            mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
            mongoURL += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
        }
    }
    // still no url? use localhost
    if (mongoURL == null) {
        mongoURL = mongoURLLabel = 'mongodb://localhost/uploads';
    }

    console.log('Connecting to ' + mongoURLLabel);
    mongodb.MongoClient.connect(mongoURL, function (err, database) {
        if (err) return console.log(err);
        db = database;
        var server = app.listen(8080, function () {
            console.log('Server listening on port 8080');
        });
    });
};

app.init();
