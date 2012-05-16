var path = require('path'),
    fs = require('fs'),
    exclude_dirs = ["node_modules", "bin", "doc", "test"],
    removeXMLSuffix = /^(.*).xml$/,
    backslashes = /\\/g;

var findXamlClasses = function (dir) {
    var xamlClasses = [];

    findFiles(dir, exclude_dirs, ["xml"], 0).forEach(function (file) {
        // make it relative
        file = path.relative(dir, file);

        file = file.replace(removeXMLSuffix, "$1");
        // issue #19
        file = file.replace(backslashes, "/");

        xamlClasses.push(file);
    });

    return xamlClasses;
};


function findFiles(dir, exclude_dirs, types, dept) {

    var ret = [];

    fs.readdirSync(dir).forEach(function (name) {

        if (exclude_dirs.indexOf(name) === -1 && name.substring(0, 1) !== ".") {
            name = path.join(dir, name);

            var stat = fs.statSync(name);

            if (stat.isDirectory()) {
                ret = ret.concat(findFiles(name, [], types, dept + 1));
            } else if (dept > 0) {

                var ext = path.extname(name).toLowerCase().substring(1);
                if (types.indexOf(ext) !== -1) {
                    ret.push(name);
                }
            }
        }
    });

    return ret;
}

module.exports = findXamlClasses;

