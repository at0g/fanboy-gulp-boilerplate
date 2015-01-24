var express = require('express'),
    path    = require('path'),
    xstatic = require('express-static')
;

var app = express();
var port = process.env.PORT || 3000;

app.use('/', xstatic( path.join(__dirname, '../srcs')) );
app.use('/', xstatic( path.join(__dirname, '../dist')) );

app.listen(port, function(){
    console.log('Express app listening on port %s', port);
});