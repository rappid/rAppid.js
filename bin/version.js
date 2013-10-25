var path = require('path'),
    fs = require('fs');

var version = function (args, callback) {

    var argv = require('optimist')(args)
            .describe("version", "the version to set")
            .argv,
        version = argv.version,
        file = argv._[0] || "package.json";

    var fileContent = JSON.parse(fs.readFileSync(file));

    if (version) {
        // set version
        fileContent.version = version;
        fs.writeFileSync(file, JSON.stringify(fileContent));
    }

    console.log(fileContent.version);

};

version.usage = "rappidjs version [--version=setversion] [package.json]";

module.exports = version;

