var chai = require('chai'),
    expect = chai.expect,
    testRunner = require('..').TestRunner.setup();

var C = {};

describe('#DataSource', function () {

    var ds;

    before(function (done) {
        testRunner.requireClasses({
            DataSource: 'js/data/DataSource',
            Model: 'js/data/Model',
            Entity: 'js/data/Entity',
            Collection: 'js/data/Collection'
        }, C, done);
    });

    beforeEach(function () {
        ds = new C.DataSource();
    });


    describe('#Context', function () {

        it('same type and it should be same instance', function () {
            var a = ds.createEntity(C.Entity, 1),
                b = ds.createEntity(C.Entity, 1);

            expect(a).to.exist;
            expect(b).to.exist;
            expect(a).to.be.equal(b);
        });

        it('same type different id should not be same instance', function () {
            var a = ds.createEntity(C.Entity, 1),
                b = ds.createEntity(C.Entity, 2);

            expect(a).to.exist;
            expect(b).to.exist;
            expect(a).to.be.not.equal(b);
        });

        it('different type same id should not be same instance', function () {

            var E = C.Entity.inherit('testEntity');

            var a = ds.createEntity(C.Entity, 1),
                b = ds.createEntity(E, 1);

            expect(a).to.exist;
            expect(b).to.exist;
            expect(a).to.be.not.equal(b);
        });

        it('createEntity without context and within rootContext should be the same instance', function () {

            var a = ds.createEntity(C.Entity, 1),
                b = ds.getContext().createEntity(C.Entity, 1);

            expect(a).to.exist;
            expect(b).to.exist;
            expect(a).to.be.equal(b);
        });

        it('same type same id but different context should not be same instance', function () {

            var a = ds.createEntity(C.Entity, 1),
                b = ds.getContext({
                    foo: 'bar'
                }).createEntity(C.Entity, 1);

            expect(a).to.exist;
            expect(b).to.exist;
            expect(a).to.be.not.equal(b);
        });

        it('context properties order should be independent', function () {

            var a = ds.getContext({
                    a: 'a',
                    b: 'b'
                }),
                b = ds.getContext({
                    b: 'b',
                    a: 'a'
                });

            expect(a).to.exist;
            expect(b).to.exist;
            expect(a).to.be.equal(b);
        });
    });

});