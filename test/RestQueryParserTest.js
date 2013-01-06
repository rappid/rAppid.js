var chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    testRunner = require('..').TestRunner.setup(),
    query = require('../js/lib/query.js').query;

var C = {};


describe('srv.data.RestQueryMapper', function () {

    before(function (done) {
        testRunner.requireClasses({
            RestQueryMapper: 'js/data/mapper/RestQueryMapper',
            RestQueryParser: 'srv/data/RestQueryParser'
        }, C, done);
    });

    describe('#compose', function(){

        it('should parse .where statement ', function(){
            var q = query()
                .gt("age", 4);

            var mapper = new C.RestQueryMapper();

            var uriQuery = mapper.compose(q);

            var parser = new C.RestQueryParser();

            var parsedQuery = parser.parse(uriQuery);

            expect(mapper.compose(parsedQuery)).to.eql(uriQuery);
        });

        it('should parse .where statement with or', function () {
            var q = query()
                .or(function(){
                    this
                        .lt("number",3)
                        .eql("name","Tony")
                },function(){
                    this
                        .lt("number",5)
                        .eql("name","Marcus")
                })
                .gt("age", 4);

            var mapper = new C.RestQueryMapper();

            var uriQuery = mapper.compose(q);

            var parser = new C.RestQueryParser();

            var parsedQuery = parser.parse(uriQuery);

            expect(mapper.compose(parsedQuery)).to.eql(uriQuery);
        })
    });


});