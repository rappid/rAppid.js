var should = require('chai').should();
var rAppid = require('..');

var C = {};


describe('js.core.Bindable', function () {

    before(function(done) {
        rAppid.requireClasses({
            Bindable: 'js/core/Bindable',
            List: 'js/core/List'
        }, C, done);
    });


    describe('get', function () {

        var b,
            undefined;

        beforeEach(function(){
            b = new C.Bindable();
        });

        it('#empty get', function () {
            should.not.exist(b.get());
        });

        it('#one path $', function () {
            b.$.foo = "bar";
            var val = b.get('foo');
            should.exist(val);
            val.should.eql('bar');
        });

        it('#one path json', function () {
            var input = {
                foo: "bar"
            };

            var val = b.get(input, 'foo');
            should.exist(val);
            val.should.eql('bar');
        });

        it('#long path exists', function () {
            var input = {
                foo: {
                    bar: "zoo"
                }
            };

            var val = b.get(input, 'foo.bar');
            should.exist(val);
            val.should.eql('zoo');
        });

        it('#long path not exists', function () {
            var input = {
                foo: {
                    bar: "zoo"
                }
            };

            var val = b.get(input, 'foo.zoo');
            should.not.exist(val);
        });

        it('#array ', function () {
            b.$.foo = [1, 2, 3];

            var val = b.get('foo[1]');
            should.exist(val);
            val.should.eql(2);
        });

        it('#array to self', function () {

            var val = b.get([0, 1, 2], '[1]');
            should.exist(val);
            val.should.eql(1);
        });

        it('#List ', function () {
            b.$.foo = new C.List([3, 4, 5, 6]);

            var val = b.get('foo[2]');
            should.exist(val);
            val.should.eql(5);
        });

        it('#nested array ', function () {
            b.$.foo = [[0, 1, 2], [3, 4, 5], [6, 7, 8]];

            var val = b.get('foo[1].[2]');
            should.exist(val);
            val.should.eql(5);
        });

        it('#not existing array path', function () {
            b.$.foo = [];

            var val = b.get('foo[1].bar');
            should.not.exist(val);
        });

    });


});