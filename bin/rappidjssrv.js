#!/usr/bin/env node

var args = process.argv.splice(2),
    http = require('http'),
    path = require('path'),
    fs = require('fs'),
    requirejs = require('requirejs'),
    rAppid = require('../rAppid.js').rAppid,
    jsdom = require('jsdom'),
    flow = require('flow.js').flow,
    _  = require('underscore');

var port = 8080,
    baseUrl = 'http://grid.js',
    applicationDir = '/Users/tony/Development/js/grid/public',
    indexFile = 'index.html',
    applicationFile = 'app/Grid.xml',
    configFile = 'config.json';


//var requireJsContext = requirejs.config({
//
//    baseUrl: applicationDir,
//    nodeRequire: require,
//
//    applicationDir: applicationDir,
//    applicationUrl: baseUrl
//});

flow()
    .seq("indexContent", function(cb){
        fs.readFile(path.join(applicationDir, indexFile), cb);
    })
    .seq("applicationConfig", function(cb) {
        fs.readFile(path.join(applicationDir, configFile), function(err, data) {
            if (!err) {
                data = JSON.parse(data);
                _.extend(data, {

                    baseUrl: applicationDir,
                    nodeRequire: require,

                    applicationDir: applicationDir,
                    applicationUrl: baseUrl
                });
            }

            cb(err, data);
        });
    })
    .seq("applicationContext", function(cb){
        rAppid.createApplicationContext(requirejs, null, applicationFile, this.vars.applicationConfig, cb);
    })
    .seq(function(){
        this.vars.applicationContext.document = jsdom.jsdom('<html></html>');
    })
    .seq("server", function(){
        var applicationContext = this.vars.applicationContext;
        var indexContent = this.vars.indexContent;

        var srv = http.createServer(function(request, response){

            var d = new Date();

            flow()
                .seq("doc", function(){
                    // render application
                    var doc = jsdom.jsdom(indexContent);

                    var scripts = doc.getElementsByTagName('script');
                    scripts._snapshot.forEach(function(script){
                        var usage = script.getAttribute("data-usage");
                        if (usage == "bootstrap" || usage == "lib") {
                            script.parentNode.removeChild(script);
                        }
                    });

                    return doc;

                })
                .seq("app", function(cb){
                    applicationContext.createApplicationInstance(cb.vars.doc, function(err, systemManager, application){
                        cb(err, application);
                    });
                })
                .seq(function(cb){
                    // start application
                    var parameter = {};
                    // TODO: sett parameter.initialHash
                    cb.vars.app.start(parameter, cb);
                })
                .seq("html", function() {
                    this.vars.app.render(this.vars.doc.body);
                    return this.vars.doc;
                })
                .exec(function(err, results) {

                    var status = 500,
                        buf;

                    if (!err) {
                        try {
                            status = 200;
                            buf = results.html.innerHTML;
                        } catch (e) {
                            status = 500;
                            buf = JSON.stringify(e);
                        }
                    } else {
                        buf = JSON.stringify(err);
                    }

                    response.writeHead(status, {
                        'Content-Length': buf.length,
                        'Content-Type': 'text/html' });
                    response.write(buf);
                    response.end();

                    console.log("Responses " + ((new Date()).getTime() - d.getTime()) + "ms");

                });
        });

        srv.listen(port);

        return srv;
    })
    .exec(function(err, results) {
        console.log(err || "server started");
    });
