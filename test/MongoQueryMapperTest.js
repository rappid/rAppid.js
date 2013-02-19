var chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    testRunner = require('..').TestRunner.setup(),
    query = require('../js/lib/query/query.js').query;

var C = {};


describe('srv.data.MongoQueryMapper', function () {

    before(function (done) {
        testRunner.requireClasses({
            MongoQueryMapper: 'srv/data/MongoQueryMapper'
        }, C, done);
    });

    describe('#compose', function () {
        it('should serialize .where statement', function () {
            var q = query()
                .lt("number", 3)
                .gt("age", 4)
                .eql("name", "what")
                .in("unit", ["what", "the", "hell"]);

            var mapper = new C.MongoQueryMapper();

            var ret = mapper.compose(q);

            expect(ret.where).to.exist;
            expect(ret.where).to.eql({
                $and: [
                    {
                        number: {
                            $lt: 3
                        }
                    },
                    {
                        age: {
                            $gt: 4
                        }
                    },
                    {
                        name: "what"
                    },
                    {
                        unit: {
                            $in: ["what", "the", "hell"]
                        }
                    }

                ]
            });
        });

        it('should serialize .where statement with or', function () {
            var q = query()
                .or(function () {
                    this
                        .lt("number", 3)
                        .eql("name", "Tony")
                }, function () {
                    this
                        .lt("number", 5)
                        .eql("name", "Marcus")
                })
                .gt("age", 4);

            var mapper = new C.MongoQueryMapper();

            var ret = mapper.compose(q);

            expect(ret.where).to.exist;
            expect(ret.where).to.eql({
                $and: [
                    {
                        $or: [
                            {
                                $and: [
                                    {
                                        number: {
                                            $lt: 3
                                        }
                                    },
                                    {
                                        name: "Tony"
                                    }
                                ]
                            },
                            {
                                $and: [
                                    {
                                        number: {
                                            $lt: 5
                                        }
                                    },
                                    {
                                        name: "Marcus"
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        age: {
                            $gt: 4
                        }
                    }
                ]

            });


        })
    });

});