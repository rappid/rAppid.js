var path = require('path');

var help = function(args, callback) {
    if (args.length >= 1) {
        var cmd = args[0],
            cmdPath = path.join(__dirname, cmd + ".js");
        if (fs.existsSync(cmdPath)) {
            console.log(require(cmdPath).usage);
        } else {
            callback("Command '" + cmd + "' not found.");
        }
    } else {
        callback(true);
    }
};

help.usage = "rappidjs help <command>";

module.exports = help;

