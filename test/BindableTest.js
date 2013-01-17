var chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    _ = require('underscore'),
    testRunner = require('..').TestRunner.setup();

var C = {};


describe('js.core.Bindable', function () {

    before(function (done) {
        testRunner.requireClasses({
            Bindable: 'js/core/Bindable',
            List: 'js/core/List'
        }, C, done);

    });

    describe('#defaults', function () {

        var BindableWithDefaults;

        before(function () {
            BindableWithDefaults = C.Bindable.inherit({
                defaults: {
                    foo: "bar",
                    x: 1,
                    list: C.List
                }
            });
        });

        it('new instance should have default attributes without modification of defaults', function () {
            var b = new BindableWithDefaults();
            expect(b).to.exist;
            expect(b.$.foo).to.exist.and.to.be.equal('bar');
            expect(b.$.x).to.exist.and.to.be.equal(1);
            expect(b.$.list).to.an.instanceof(C.List);

        });

        it('attributes set, should not be overwritten by defaults', function () {
            var b = new BindableWithDefaults({
                foo: 'foo'
            });

            expect(b).to.exist;
            expect(b.$.foo).to.exist.and.to.be.equal('foo');
            expect(b.$.x).to.exist.and.to.be.equal(1);
            expect(b.$.list).to.an.instanceof(C.List);

        });

        it('defaults should not be modified', function () {

            expect(BindableWithDefaults.prototype.defaults.foo).to.exist.and.to.be.equal('bar');
            expect(BindableWithDefaults.prototype.defaults.x).to.exist.and.to.be.equal(1);
            expect(BindableWithDefaults.prototype.defaults.list).to.exist.and.to.be.equal(C.List);
        })


    });

    describe('get', function () {

        var b,
            undefined;

        beforeEach(function () {
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

        it('#fnc value foo.bar()', function () {
            var input = {
                foo: {
                    bar: function () {
                        return "hello"
                    }
                }
            };
            var val = b.get(input, 'foo.bar()');
            val.should.eql('hello');
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

        it('#return array', function () {

            var a = b.$.foo = [1, 2, 3];

            var val = b.get('foo');
            should.exist(val);
            a.should.eql(val);
        });

        it('#return List', function () {

            var a = b.$.foo = new C.List([1, 2, 3]);

            var val = b.get('foo');
            should.exist(val);
            a.should.eql(val);
        });

        it('#List ', function () {
            b.$.foo = new C.List([3, 4, 5, 6]);

            var val = b.get('foo[2]');
            should.exist(val);
            val.should.eql(5);
        });

        it('#nested array ', function () {
            b.$.foo = [
                [0, 1, 2],
                [3, 4, 5],
                [6, 7, 8]
            ];

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


    describe('clone', function () {
        var original, nestedBindable, copy;
        beforeEach(function () {
            nestedBindable = new C.Bindable({
                street: 'Street 1',
                city: 'City 1'
            });
            original = new C.Bindable({
                str: 'String',
                number: 123,
                boolean: true,
                person: {
                    firstName: 'Peter',
                    lastName: 'Pan'
                },
                nested: nestedBindable,
                arr: [
                    nestedBindable, "ab", 2, "waht", ["a", "b"]
                ]
            });

            copy = original.clone();
        });

        it('#should clone all attributes', function () {
            for (var key in original.$) {
                if (original.$.hasOwnProperty(key)) {
                    expect(copy.$[key]).to.exist;
                }
            }
        });

        it('#should create a deep copy of each nested Object', function () {
            expect(copy.$.person).to.exist.and.not.to.be.equal(original.$.person);
            expect(copy.$.person.firstName).to.exist.and.to.be.equal(original.$.person.firstName);
            expect(copy.$.person.lastName).to.exist.and.to.be.equal(original.$.person.lastName);

            original.$.person.firstName = "Hans";
            expect(copy.$.person.firstName).not.be.equal(original.$.person.firstName);
        });

        it('#should create a deep copy of each nested Array', function () {
            var val, copyVal;
            expect(copy.$.arr).to.exist;
            expect(copy.$.arr.length).to.be.equal(original.$.arr.length);

            for (var i = 0; i < original.$.arr.length; i++) {
                val = original.$.arr[i];
                copyVal = copy.$.arr[i];
                expect(copyVal).to.exist;
                if (val instanceof C.Bindable) {
                    expect(val).not.to.be.equal(copyVal);
                } else if (_.isArray(val)) {
                    expect(val.length).to.be.equal(copyVal.length);
                    expect(val).not.to.be.equal(copyVal);
                } else if (_.isObject(val)) {
                    expect(val).not.to.be.equal(copyVal);
                } else {
                    // numbers, strings, boolean and stuff
                    expect(val).to.be.equal(copyVal);
                }
            }
        });

        it('#should clone all nested Bindables', function () {
            expect(copy.$.nested).to.exist.and.not.to.be.equal(original.$.nested);
            expect(copy.$.nested.$.street).to.exist.and.to.be.equal(original.$.nested.$.street);
            expect(copy.$.nested.$.city).to.exist.and.to.be.equal(original.$.nested.$.city);
        });
    });


    describe('sync', function () {
        var original, nestedBindable, copy;
        beforeEach(function () {
            nestedBindable = new C.Bindable({
                street: 'Street 1',
                city: 'City 1'
            });
            original = new C.Bindable({
                str: 'String',
                number: 123,
                boolean: true,
                person: {
                    firstName: 'Peter',
                    lastName: 'Pan'
                },
                nested: nestedBindable,
                arr: [
                    nestedBindable, "ab", 2, "waht", ["a", "b"]
                ]
            });

            copy = original.clone();
        });

        it('#should remove unset attributes from source', function () {
            copy.set('person',null,{unset: true});
            copy.set('nested', null, {unset: true});

            copy.sync();

            expect(original.$.person).not.to.exist;
            expect(original.$.nested).not.to.exist;
        });

        it('#should replace nested Bindable if they are new', function(){
            // create new Bindable
            copy.set('nested',new C.Bindable({
                street : 'A',
                city: 'B'
            }));

            copy.sync();

            expect(original.$.nested).not.to.be.equal(nestedBindable);
            expect(original.$.nested.$.street).to.be.equal(copy.$.nested.$.street);
            expect(original.$.nested.$.city).to.be.equal(copy.$.nested.$.city);

        });

        it('#should not replace nested Bindable if they were modified', function () {
            // modify nested Bindable
            copy.$.nested.set({
                street: 'A',
                city: 'B'
            });

            copy.sync();

            expect(original.$.nested).to.be.equal(nestedBindable);
            expect(original.$.nested.$.street).to.be.equal(copy.$.nested.$.street);
            expect(original.$.nested.$.city).to.be.equal(copy.$.nested.$.city);
        });
    });

    describe('#isDeepEqual', function(){
        var original, nestedBindable, copy;
        beforeEach(function () {
            nestedBindable = new C.Bindable({
                street: 'Street 1',
                city: 'City 1'
            });
            original = new C.Bindable({
                str: 'String',
                number: 123,
                boolean: true,
                person: {
                    firstName: 'Peter',
                    lastName: 'Pan'
                },
                nested: nestedBindable,
                arr: [
                    nestedBindable, "ab", 2, "what", ["a", "b"]
                ]
            });

            copy = original.clone();
        });

        it('#exact clone should be equal', function () {
            expect(original.isDeepEqual(copy)).to.equal(true);
        });

        it('#modified clone with same values should be equal', function(){
            copy.set("arr", [
                nestedBindable.clone(),
                "ab",
                2,
                "what",
                ["a", "b"]
            ]);
            expect(original.isDeepEqual(copy)).to.equal(true);
        });

        it('#modified clone should not equal', function(){
            copy.set('number',312);
            expect(original.isDeepEqual(copy)).to.equal(false);
        });
    })


});