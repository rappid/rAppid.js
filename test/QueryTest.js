var expect = require('chai').expect,
    query = require('../js/lib/query.js').query;

describe('query', function () {

    describe('empty query', function () {

        it('Create empty query', function () {
            query();
        });

        it('Empty query to parameters should not return any parameters', function () {
            expect(query().toObject()).to.eql({});
        });

    });

    describe('sort', function () {

        it('one field asc', function () {
            expect(
                query()
                    .sort("name")
                    .toObject()
            ).to.eql({
                    sort: [
                        {
                            field: "name",
                            direction: 1
                        }
                    ]
                });
        });

        it('one field desc', function () {
            expect(
                query()
                    .sort("-name")
                    .toObject()
            ).to.eql({
                    sort: [
                        {
                            field: "name",
                            direction: -1
                        }
                    ]
                });
        });


        it('array', function () {
            expect(
                query()
                    .sort([{
                        field: "xyz"
                    }, {
                        field: "abc",
                        direction: -1
                    }])
                    .toObject()
            ).to.eql({
                    sort: [
                        {
                            field: "xyz",
                            direction: 1
                        },
                        {
                            field: "abc",
                            direction: -1
                        }
                    ]
                });
        });

        it('mixed up', function () {
            expect(
                query()
                    .sort("name", "-firstname", "+birthday", {
                        field: "xyz"
                    }, {
                        field: "abc",
                        direction: -1
                    })
                    .toObject()
            ).to.eql({
                    sort: [
                        {
                            field: "name",
                            direction: 1
                        }, {
                            field: "firstname",
                            direction: -1
                        }, {
                            field: "birthday",
                            direction: 1
                        }, {
                            field: "xyz",
                            direction: 1
                        }, {
                            field: "abc",
                            direction: -1
                        }
                    ]
                });
        });

    });

    describe('where', function () {

        it('one comparator', function () {
            expect(
                query()
                    .eql("name", "tony")
                    .toObject()
            ).to.eql({
                    where: {
                        operator: "and",
                        expressions: [
                            {
                                operator: "eql",
                                field: "name",
                                value: "tony"
                            }
                        ]
                    }
                });
        });

        it('multiple comparators', function () {
            expect(
                query()
                    .eql("name", "tony")
                    .gt("age", 18)
                    .toObject()
            ).to.eql({
                    where: {
                        operator: "and",
                        expressions: [
                            {
                                operator: "eql",
                                field: "name",
                                value: "tony"
                            },
                            {
                                operator: "gt",
                                field: "age",
                                value: 18
                            }
                        ]
                    }
                });
        });

        it('multiple comparators', function () {
            expect(
                query()
                    .eql({
                        name: "tony",
                        age: 26
                    })
                    .toObject()
            ).to.eql({
                    where: {
                        operator: "and",
                        expressions: [
                            {
                                operator: "eql",
                                field: "name",
                                value: "tony"
                            },
                            {
                                operator: "eql",
                                field: "age",
                                value: 26
                            }
                        ]
                    }
                });
        });

    });


    describe('nested wheres', function () {

        it('not', function () {
            expect(
                query()
                    .not(function (where) {
                        where
                            .eql("name", "tony")
                    })
                    .toObject()
            ).to.eql({
                    where: {
                        operator: "and",
                        expressions: [
                            {
                                operator: "not",
                                expressions: [
                                    {
                                        operator: "and",
                                        expressions: [
                                            {
                                                operator: "eql",
                                                field: "name",
                                                value: "tony"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                });
        });

        it('or', function () {
            expect(
                query()
                    .or(function () {
                        this.eql("name", "tony")
                    }, function () {
                        this.eql("name", "marcus")
                    })
                    .toObject()
            ).to.eql({
                    where: {
                        operator: "and",
                        expressions: [
                            {
                                operator: "or",
                                expressions: [
                                    {
                                        operator: "and",
                                        expressions: [
                                            {
                                                operator: "eql",
                                                field: "name",
                                                value: "tony"
                                            }
                                        ]
                                    },
                                    {
                                        operator: "and",
                                        expressions: [
                                            {
                                                operator: "eql",
                                                field: "name",
                                                value: "marcus"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                });
        });

        it('or with composed wheres', function () {

            var where1 = query()
                .where()
                .eql("name", "tony");

            var where2 = query()
                .where()
                .eql("name", "marcus");

            expect(

                query()
                    .or(where1, where2)
                    .toObject()
            ).to.eql({
                    where: {
                        operator: "and",
                        expressions: [
                            {
                                operator: "or",
                                expressions: [
                                    {
                                        operator: "and",
                                        expressions: [
                                            {
                                                operator: "eql",
                                                field: "name",
                                                value: "tony"
                                            }
                                        ]
                                    },
                                    {
                                        operator: "and",
                                        expressions: [
                                            {
                                                operator: "eql",
                                                field: "name",
                                                value: "marcus"
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                });
        });


    });


});
