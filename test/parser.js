var should = require('chai').should(),
    testRunner = require('..').TestRunner.setup(),
    flow = require('flow.js').flow;
var C = {};


describe('parser test', function () {

    before(function(done) {
        testRunner.requireClasses({
            Parser: "js/lib/parser"
        }, C, done);
    });

    describe("#parse varName", function () {

        it('should parse valid var names', function(done){
            var validNames = ["asd", "a123", "$asd", "_asd", "a_", "Abc"];
            var parsed, RULE = "varName";
            flow().seqEach(validNames,
                function (name, cb) {
                    try {
                        parsed = C.Parser.parse(name, RULE);
                        cb();
                    } catch(e) {
                        cb(e);
                    }
                }).exec(done);
        });

        it('should not parse an invalid var name', function (done) {
            // todo: complete the list
            var invalidNames = ["123asd", "-asd", "asd()", ".asdasd", "asd|asd"];
            var parsed, RULE = "varName";
            flow().seqEach(invalidNames,
                function (name, cb) {
                    try {
                        parsed = C.Parser.parse(name, RULE);
                        cb(name + " should be an invalid varname");
                    } catch(e) {
                        cb();
                    }
                }).exec(done);
        });
    });

    describe('#parse number', function () {
        var RULE = "number", parsed;

        it('should parse a number', function () {
            var number = 6;
            var numberDef = "" + number;

            parsed = C.Parser.parse(numberDef, RULE);
            parsed.should.equal(number);
        });

        it('should parse a negative number', function () {
            var number = 6;
            var numberDef = "-" + number;

            parsed = C.Parser.parse(numberDef, RULE);
            parsed.should.equal(-1 * number);
        })
    });

    describe('#parse float', function () {
        var RULE = "float", parsed;

        it('should parse a float', function () {
            var number = 6.4;
            var numberDef = "" + number;

            parsed = C.Parser.parse(numberDef, RULE);
            parsed.should.equal(number);
        });

        it('should parse a negative float', function () {
            var number = 6.4;
            var numberDef = "-" + number;

            parsed = C.Parser.parse(numberDef, RULE);
            parsed.should.equal(-1 * number);
        })
    });

    describe('#parse index', function() {
       var RULE = "index", parsed;

        it('should return a number', function(){
            var index = 6;
            var indexDef = "["+index+"]";

            parsed = C.Parser.parse(indexDef,RULE);
            parsed.should.equal(index);
        })
    });

    describe('#parse var', function () {

        var RULE = "var", parsed;

        it('should return a object with name and type', function () {
            var varName = "a";

            parsed = C.Parser.parse(varName, RULE);
            parsed.type.should.equal('var');
            parsed.name.should.equal(varName);
            parsed.index.should.equal('');
        });

        it('should return a object with name, type and index', function () {
            var varName = "a";
            var index = 1;
            var indexDef = "[" + index + "]";

            parsed = C.Parser.parse(varName + indexDef, RULE);
            parsed.type.should.equal('var');
            parsed.name.should.equal(varName);
            parsed.index.should.equal(index);
        });

        it('should not parse var ""', function(done){
            var varName = "";

            try{
                parsed  = C.Parser.parse(varName, RULE);
            }catch(e){
                done();
            }
        })

    });

    describe('#parse fnc', function () {
        var RULE = "fnc", parsed;

        it('should return a object with name, type and parameter', function () {
            var fncName = "abc";

            parsed = C.Parser.parse(fncName + "()", RULE);
            parsed.type.should.equal('fnc');
            parsed.name.should.equal(fncName);
            parsed.parameter.length.should.equal(0);
            parsed.index.should.equal('');
        });

        it('should return a object with name, type, parameter and index', function () {
            var fncName = "abc";
            var index = 188;
            var indexDef = "[" + index + "]";

            parsed = C.Parser.parse(fncName + "()" + indexDef, RULE);
            parsed.type.should.equal('fnc');
            parsed.name.should.equal(fncName);
            parsed.parameter.length.should.equal(0);
            parsed.index.should.equal(index);
        });

        it('should return a object with an array of parameters', function () {
            var fncName = "abc";

            parsed = C.Parser.parse(fncName + "('hello',123,binding)", RULE);
            parsed.type.should.equal('fnc');
            parsed.name.should.equal(fncName);
            parsed.parameter.length.should.equal(3);
            parsed.index.should.equal('');
        });

    });

    describe('#parse parameter', function () {
        var parsed, RULE = "parameter";
        it('should parse a single escaped string', function () {
            var string = "myString";
            var def = "'" + string + "'";
            parsed = C.Parser.parse(def, RULE);

            parsed.should.equal(string);
        });

        it.skip('should parse a double escaped string', function () {
            var string = "myString";
            var def = "\"" + string + "\"";
            parsed = C.Parser.parse(def, RULE);

            parsed.should.equal(string);
        });

        it('should parse an emptystring', function () {
            var string = "";
            var def = "'" + string + "'";
            parsed = C.Parser.parse(def, RULE);

            parsed.should.equal(string);
        });

        it('should parse a integer', function () {
            var integer = 123123;
            var def = "" + integer;
            parsed = C.Parser.parse(def, RULE);

            parsed.should.equal(integer);
        });

        it('should parse a float', function () {
            var flo = 12.23;
            var def = "" + flo;
            parsed = C.Parser.parse(def, RULE);

            parsed.should.equal(flo);
        });

        it('should parse a boolean', function () {
            C.Parser.parse("true", RULE).should.equal(true);
            C.Parser.parse("false", RULE).should.equal(false);
        });

        it('should parse a path', function () {
            should.exist(C.Parser.parse("abc", RULE));
        });

        it('should parse static binding', function () {
            should.exist(C.Parser.parse("${abc}", RULE));
        });

        it('should not parse two way binding', function (done) {
            try {
                C.Parser.parse("{{abc}}", RULE);
                done("TwoWay binding should not be parsed by path parser");
            } catch(e) {
                done();
            }
        });
    });

    describe('#parse parameterArray', function () {
        var RULE = "parameterArray";

        it("should parse an empty parameter list", function () {
            var string = "";
            C.Parser.parse(string, RULE).length.should.equal(0);
        });

        it("should parse a parameter list with empty string", function () {
            var string = "''";
            C.Parser.parse(string, RULE).length.should.equal(1);
        });

        it("should parse a , separated parameter list", function(){
            var string = "'',123213,binding,null";
            C.Parser.parse(string,RULE).length.should.equal(4);
        });

        it("should parse a , separated parameter list with spaces", function (done) {
            var string = "'abc'   ,   123213  , binding";

            try {
                C.Parser.parse(string, RULE);
                done();
            } catch(e) {
                done("should parse a , separated list with spaces");
            }
        });

    });


        describe('#parse path', function () {
        var RULE = "path";

        it('should parse a path of varNames', function () {
            var path = ["a", "b"];
            var parsed = C.Parser.parse(path.join("."), RULE);

            parsed.length.should.equal(path.length);
            parsed[0].type.should.equal("var");
            parsed[0].name.should.equal("a");

            parsed[1].type.should.equal("var");
            parsed[1].name.should.equal("b");
        });

        it('should parse an index def', function(){
           var path = ["[1]","[2]"];
            var parsed = C.Parser.parse(path.join("."), RULE);

            parsed.length.should.equal(path.length);
            parsed[0].type.should.equal("index");
            parsed[0].index.should.equal(1);

            parsed[1].type.should.equal("index");
            parsed[1].index.should.equal(2);

        });

        it('should parse a path of mixed values', function () {
            var path = ["a", "b()"];
            var parsed = C.Parser.parse(path.join("."), RULE);

            parsed.length.should.equal(path.length);
            parsed[0].type.should.equal("var");
            parsed[0].name.should.equal("a");

            parsed[1].type.should.equal("fnc");
            parsed[1].name.should.equal("b");
        });
    });

    describe('#parse binding', function () {
        var RULE = "binding", parsed, NORMAL = "normal";

        it('should parse a binding like {asd}', function(){
            parsed = C.Parser.parse('{asd}',RULE);
            parsed.type.should.equal(NORMAL);
            parsed.path.length.should.equal(1);
        });

        it('should not parse a binding like {{asd}', function () {
            parsed = C.Parser.parse('{asd}', RULE);
            parsed.type.should.equal(NORMAL);
            parsed.path.length.should.equal(1);
        });

    });

    describe('#parse two way binding', function () {
        var RULE = "twoWayBinding", parsed, TWOWAY = "twoWay";

        it('should parse a binding like {asd}', function () {
            parsed = C.Parser.parse('{{asd}}', RULE);
            parsed.type.should.equal(TWOWAY);
            parsed.path.length.should.equal(1);
        });

    });

    describe('#parse static binding', function(){
        var RULE = "staticBinding", parsed;

        it('should parse a binding like ${asd}', function() {
            parsed = C.Parser.parse('${asd}', RULE);
            parsed.type.should.equal('static');
            parsed.path.length.should.equal(1);
        });

    });

    describe('#parse text', function() {

        var RULE = "text", parsed;


        it('should return an array of char if only text', function () {
            var text = "ABC";
            C.Parser.parse(text, RULE).join("").should.equal(text);
        });

        it('should return an array of normal binding definitions', function () {
            var text = "{what}{isGoing}{On}";
            parsed = C.Parser.parse(text, RULE);

            for (var i = 0; i < parsed.length; i++) {
                parsed[i].type.should.equal('normal');
            }
        });

        it('should return an array of static binding definitions', function () {
            var text = "${what}${isGoing}${On}";
            parsed = C.Parser.parse(text, RULE);

            for (var i = 0; i < parsed.length; i++) {
                parsed[i].type.should.equal('static');
            }
        });

        it('should return an array of mixed binding definitions', function () {
            var text = "${what}{isGoing}${On}";
            parsed = C.Parser.parse(text, RULE);

            parsed[0].type.should.equal('static');
            parsed[1].type.should.equal('normal');
            parsed[2].type.should.equal('static');
        });

        it('should return an array of chars and binding definitions', function () {
            var text = "${what}a{isGoing}b${On}";
            parsed = C.Parser.parse(text, RULE);

            parsed[0].type.should.equal('static');
            parsed[1].should.equal('a');
            parsed[2].type.should.equal('normal');
            parsed[3].should.equal('b');
            parsed[4].type.should.equal('static');
        });

        it('should return a twoWayBinding definition for {{asdasd}}', function () {
            var text = "{{asdasd}}";
            C.Parser.parse(text, RULE)[0].type.should.equal("twoWay");
        });

        it('should not parse a text with mixed twoWay and normal bindings', function (done) {
            var text = "{{what}} {isGoing}{On}";
            try {
                C.Parser.parse(text, RULE);
                done('should not parse a text with mixed twoWay and normal bindings');
            } catch(e) {
                done();
            }
        });
    })

});
