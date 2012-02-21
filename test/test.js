var should = require('chai').should();

describe('foo', function () {
    describe('#bar()', function () {
        it('should throw an exception', function () {
//            var model1 = api.createModelFromReference("/dummy/123");
//            var model2 = api.createModelFromReference("/dummy/123");
//
//
//            expect(model1).to.equal(model2);
            throw "foo.bar";
        })
    });
});