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
                        type: "and",
                        expressions: [
                            {
                                operator: "eql",
                                field: "name",
                                values: [
                                    "tony"
                                ]
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
                        type: "and",
                        expressions: [
                            {
                                operator: "eql",
                                field: "name",
                                values: [
                                    "tony"
                                ]
                            }, {
                                operator: "gt",
                                field: "age",
                                values: [
                                    18
                                ]
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
                        type: "and",
                        expressions: [
                            {
                                operator: "eql",
                                field: "name",
                                values: [
                                    "tony"
                                ]
                            }, {
                                operator: "eql",
                                field: "age",
                                values: [
                                    26
                                ]
                            }
                        ]
                    }
                });
        });

    });


});
