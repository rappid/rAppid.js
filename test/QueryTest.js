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

        it('Sorting', function () {
            expect(
                query()
                    .sort("name")
                    .toObject()
            ).to.eql({
                    sort: "name"
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
