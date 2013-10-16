var path = require('path'),
    fs = require('fs');

var version = function (args, callback) {

    var argv = require('optimist')(args).argv,
        file = argv._[0] || "package.json";

    console.log(JSON.parse(fs.readFileSync(file)).version);
};

version.usage = "rappidjs version [package.json]";

module.exports = version;

