var should = require('chai').should(),
    testRunner = require('..').TestRunner.setup(),
    flow = require('flow.js').flow;
    parser = require("../js/lib/conditionParser.js").parser;

var C = {};


describe('condition parser test', function () {

    describe("#comparison", function(){
        var rule = "comparison";

        it('should parse "="', function(){
            var hash = parser.parse("a=b", rule);

            hash.name.should.equal("eq");
            hash.args.length.should.equal(2);
        });

        it('should parse ">"', function () {
            var hash = parser.parse("a>b", rule);

            hash.name.should.equal("gt");
            hash.args.length.should.equal(2);
        });

        it('should parse ">="', function () {
            var hash = parser.parse("a>=b", rule);

            hash.name.should.equal("gte");
            hash.args.length.should.equal(2);
        });


        it('should parse "\<"', function () {
            var hash = parser.parse("a\<b", rule);

            hash.name.should.equal("lt");
            hash.args.length.should.equal(2);
        });

        it('should parse "\<="', function () {
            var hash = parser.parse("a\<=b", rule);

            hash.name.should.equal("lte");
            hash.args.length.should.equal(2);
        });

    });

    describe("#parse operator", function () {
        var rule = "operator";

        it('should parse one operator', function(){
            var hash = parser.parse("eq(field,value)",rule);
            hash.name.should.equal('eq');
            hash.args.length.should.equal(2);
        });

        it('should parse a comparison', function(){
            var hash = parser.parse("name=tom",rule);

            hash.name.should.equal('eq');
            hash.args.length.should.equal(2);
        });

        it('should parse a "or" group', function(){
            var hash = parser.parse("(eq(name,tom) or eq(age,22) or lt(age,23))", rule);

            hash.name.should.equal("or");
            hash.args.length.should.equal(3);
        });

        it('should parse a "and" group', function () {
            var hash = parser.parse("(eq(name,tom) and eq(age,22) and lt(age,23))", rule);

            hash.name.should.equal("and");
            hash.args.length.should.equal(3);
        });

        it('should parse a "and" group with comparison', function () {
            var hash = parser.parse("(name=tom and age=22)",rule);

            hash.name.should.equal("and");
            hash.args.length.should.equal(2);
        });

        it('should parse a "or" group with comparison', function () {
            var hash = parser.parse("(name=tom or age=22)", rule);

            hash.name.should.equal("and");
            hash.args.length.should.equal(2);
        });

        it('should parse a "in" operator', function () {
            var hash = parser.parse("in(a,(1,2,3,4))", rule);

            hash.name.should.equal("in");
            hash.args.length.should.equal(2);
            hash.args[0].should.equal("a");
            hash.args[1].length.should.equal(4);
        });
    });


});
