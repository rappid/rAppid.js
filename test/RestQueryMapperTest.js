var chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    testRunner = require('..').TestRunner.setup(),
    query = require('../js/lib/query.js').query;

var C = {};


describe('srv.data.RestQueryMapper', function () {

    before(function (done) {
        testRunner.requireClasses({
            RestQueryMapper: 'js/data/mapper/RestQueryMapper'
        }, C, done);
    });

    describe('#compose', function(){
        it('should serialize .where statement', function(){
            var q = query()
                .lt("number",3)
                .gt("age",4)
                .eql("name","what")
                .in("unit",["what","the","hell"]);

            var mapper = new C.RestQueryMapper();

            var ret = mapper.compose(q);

            expect(ret.where).to.exist;
            expect(ret.where).to.equal("number<3 and age>4 and name=what and in(unit,(what,the,hell))");
        });

        it('should serialize .where statement with or', function(){
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

            var ret = mapper.compose(q);

            expect(ret.where).to.exist;
            expect(ret.where).to.equal("((number<3 and name=Tony) or (number<5 and name=Marcus)) and age>4");


        })
    });


});