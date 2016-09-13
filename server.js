
var mongodb = require('mongodb').MongoClient;
var express = require('express');
var request = require('request');
var btoa = require('btoa');
var url = require('url');
var app = express();

var connectionString = 'mongodb://newdygo:newdygo99894517@ds029436.mlab.com:29436/image-search-api';

app.use('/api/imagesearch/:param', function (req, res, next) {
  next();
});

app.use('/api/latest/imagesearch', function (req, res, next) {
  next();
});

app.route('/api/imagesearch/:param').get(function (req, res) {
    
    mongodb.connect(connectionString, function(err, db) {
        
        if (!err) {
            
            var offset = 10;
            var urlclean = url.parse(req.url);
            var urlquery = urlclean.query.split('&').filter(function(value) {
                
                return /^offset=\d/g.test(value);
            });
            
            if (urlquery.length > 0) {
                
                var ttop = urlquery[0].split('=')[1];
                
                if (/^[0-9]*$/.test(ttop)) {
                    offset = Math.abs(parseInt(ttop, 10));
                }
            }
            
            var search = {
                term: urlclean.pathname.replace('/api/imagesearch/', ''),
                offset: offset,
                when: new Date()
            };
            
            db.collection('searches').insert(search, function(err2, data) {
            
                if (data.ops !== undefined && data.ops[0] !== undefined) {
                    
                    request({
                        url: 'https://api.datamarket.azure.com/Bing/Search/Image',
                        qs: { Query: "'" + data.ops[0].term + "'", $format: 'json', $top: offset },
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Basic ' + btoa(':+oQhselJMvCDJbVugR6gWrog3I+J1z3AOB1VVm5F4W4')
                        }
                    }, function(error, response, body){
                        
                        if(!error) {
                            
                            var images = [];
                            JSON.parse(body).d.results.forEach(function(element, index, array) {
                                
                                images.push({ 
                                    
                                    url: element.MediaUrl, 
                                    snippet: element.Title, 
                                    thumbnail: element.Thumbnail.MediaUrl, 
                                    context: element.SourceUrl
                                });
                            });
                            
                            res.writeHead(200, {'Content-Type': 'application/json'});
                            res.write(JSON.stringify(images, null, 4));
                            res.end();
                            
                        } else {
                            res.writeHead(404, {'Content-Type': 'application/json'});
                            res.write(error);
                            res.end();
                        }
                    });
                }
            });
        
            db.close();   
        }
    });
});

app.route('/api/latest/imagesearch').get(function (req, res) {
    
    mongodb.connect(connectionString, function(err, db) {
        
        if (!err) {
            
            db.collection('searches').find({}, {
                
                _id: 0,
                torp: 0,
                term: 1,
                when: 1
                
            }).toArray(function(errc, data) {
                
                if (!errc) {
                    res.writeHead(200, {'Content-Type': 'application/json'});
                    res.write(JSON.stringify(data, null, 4));
                    res.end();
                }
            });
        
            db.close();   
        }
    });
});

app.listen(process.env.PORT || 8080);