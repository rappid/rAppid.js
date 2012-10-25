var path = require('path'),
    fs = require('fs');

    fs.existsSync || (fs.existsSync = path.existsSync);

var help = function(args, callback) {
    if (args.length >= 1) {
        var cmd = args[0],
            cmdPath = path.join(__dirname, cmd + ".js");
        if (fs.existsSync(cmdPath)) {
            var usage = require(cmdPath).usage;

            if (usage instanceof Function) {
                usage();
            } else {
                console.log(usage);
            }

        } else {
            callback("Command '" + cmd + "' not found.");
        }
    } else {
        callback(true);
    }
};

help.usage = "rappidjs help <command>";

module.exports = help;

