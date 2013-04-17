var help = function(args, callback) {

    args = args || [];

    var amdDoc = require('./lib/doc.js'),
        fs = require('fs'),
        path = require('path'),
        argv = require('optimist')(args)
            .usage("rappidjs doc <dir> [<dir2>]")
            .demand(1)
            .options('o', {
                alias: 'output'
            })
            .options('s', {
                alias: 'suffix',
                default: '.json'
            })
            .options('x', {
                alias: 'exclude'
            })
            .describe({
                o: 'output directory where the my.class.suffix files will be saved',
                x: 'excludes files or folders from getting parsed'
            })
            .argv,

            outputDir;

        outputDir = argv.o ? argv.o.replace(/^~\//, process.env.HOME + '/') : null;

    generateDocumentation(argv._);

    function generateDocumentation(startFiles) {

        var documentation = new amdDoc.Documentation(),
            paths,
            stat;

        for (var i = 0; i < startFiles.length; i++) {
            var startFile = startFiles[i];
            startFile = startFile.replace(/^~\//, process.env.HOME + '/');

            stat = fs.statSync(startFile);

            if (stat.isDirectory()) {
                paths = findFiles(startFile);
                paths.forEach(function (p) {
                    var shortPath = path.relative(path.join(startFile, '..'), p),
                        code = fs.readFileSync(p, 'UTF-8');

                    console.log(shortPath);

                    var defaultFqClassName = shortPath.replace(/\//g, '.').replace(/\.js$/, '').replace(/\.xml$/, '');
                    var extension = /\.([a-z]+)$/.exec(shortPath);

                    if (extension) {
                        documentation.generateDocumentationsForFile(extension[1], code, defaultFqClassName, true);
                    } else {
                        console.warn("Cannot generate documentation for " + shortPath);
                    }


                });
            } else if (stat.isFile()) {

                var extension = /\.([a-z]+)$/.exec(startFile);

                if (extension) {
                    documentation.generateDocumentationsForFile(extension[1], fs.readFileSync(startFile, 'UTF-8'), startFile, true);
                } else {
                    console.warn("Cannot generate documentation for " + startFile);
                }

            }
        }

        var output = documentation.process();

        if (!outputDir) {
            console.log(JSON.stringify(output, null, 4));
        } else {
            // output directory specified

            // generate index.json
            var index = Object.keys(output);
            index.sort();

            writeFile(path.join(outputDir, 'index.json'), index);

            for (var fqClassName in output) {
                if (output.hasOwnProperty(fqClassName)) {
                    writeFile(path.join(outputDir, fqClassName + '.json'), output[fqClassName]);
                }
            }

        }

    }

    function writeFile(path, data) {

        fs.writeFileSync(path, JSON.stringify(data, null, 4))
    }

    function findFiles(dir) {

        var ret = [],
            extension = [".js", ".xml"],
            files = fs.readdirSync(dir);

        for (var i = 0; i < files.length; i++) {
            var file = path.join(dir, files[i]);
            var stat = fs.statSync(file);

            if (stat.isDirectory() && !isExcluded(file)) {
                ret = ret.concat(findFiles(file));
            } else if (stat.isFile() && extension.indexOf(path.extname(file)) !== -1 && !isExcluded(file)) {
                // javascript file or xaml
                ret.push(file);
            }
        }

        return ret;

    }

    function isExcluded(path) {
        // TODO: implement
        return false;
    }
};

help.usage = function() {
    help();
};

module.exports = help;

