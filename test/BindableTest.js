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

        it('#undefined when path not exists', function () {
            var input = {
                foo: {
                    bar: null
                }
            };

            var val = b.get(input, "foo.bar.doo");
            expect(val).to.eql(undefined);

            expect(b.get(input, "foo.bar")).to.eql(null);
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

        it('should work with string numbers as key', function (done) {

            try {
                b.get("1");
                done();
            } catch (e) {
                done("key as number does not work");
            }
        });

        it('should not work with real numbers as key', function (done) {

            try {
                b.get(1);
                done("key as number was accepted");
            } catch (e) {
                done();
            }
        });

    });

    describe('bind', function () {

        var bindable;

        it('#should bind to event and trigger callback on scope', function (done) {

            bindable = new C.Bindable({
                foo: "bar"
            });

            var scope = {};

            bindable.bind('change', function () {

                expect(scope).to.equal(this);

                done();

            }, scope);

            bindable.set('foo', "newValue");
        });

        it('#should bind to event behind a path', function (done) {

            bindable = new C.Bindable({
                nested: new C.Bindable({
                    foo: "bar"
                })
            });

            var scope = {};

            bindable.bind('nested', 'change', function () {

                expect(scope).to.equal(this);
                done();

            }, scope);

            bindable.$.nested.set('foo', "newValue");
        });

        it('#should bind to an event with a function name', function (done) {

            var bindable = new C.Bindable({
                foo: "bar"
            });

            var scope = {
                callback: function () {
                    expect(this).to.equal(scope);
                    done();
                }
            };

            bindable.bind('change', "callback()", scope);

            bindable.set('foo', "newValue");

        });

        it('#should bind to an event with a function name and parameters', function (done) {
            var bindable = new C.Bindable({
                foo: "bar",
                foo2: "bar2"
            });

            var scope = {
                callback: function (event, foo, foo2, n, b, s) {
                    expect(this).to.equal(scope);
                    expect(event).to.exist;
                    expect(foo).to.equal(bindable.$.foo);
                    expect(foo2).to.equal(bindable.$.foo2);
                    expect(n).to.equal(5);
                    expect(b).to.equal(true);
                    expect(s).to.equal('test');
                    done();
                }
            };

            bindable.bind('change', "callback(event,foo,foo2,5,true,'test')", scope);
            bindable.set('foo', "newValue");
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
            copy.set('person', null, {unset: true});
            copy.set('nested', null, {unset: true});

            copy.sync();

            expect(original.$.person).not.to.exist;
            expect(original.$.nested).not.to.exist;
        });

        it('#should replace nested Bindable if they are new', function () {
            // create new Bindable
            copy.set('nested', new C.Bindable({
                street: 'A',
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

    describe('#isDeepEqual', function () {
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

        it('#modified clone with same values should be equal', function () {
            copy.set("arr", [
                nestedBindable.clone(),
                "ab",
                2,
                "what",
                ["a", "b"]
            ]);
            expect(original.isDeepEqual(copy)).to.equal(true);
        });

        it('#modified clone should not equal', function () {
            copy.set('number', 312);
            expect(original.isDeepEqual(copy)).to.equal(false);
        });
    });

    describe('#destroy', function () {

        var bindable;

        beforeEach(function () {
            bindable = new C.Bindable({
                street: 'Street 1',
                city: 'City 1'
            });
        });

        it('should trigger destroy event', function (done) {
            var destroyed = false;
            bindable.bind('destroy', function () {
                destroyed = true;
                done();
            });

            bindable.destroy();
            expect(destroyed).to.equal(true);
        });

        it('should remove all event listeners', function () {

            var triggered = false;

            bindable.bind('change', function () {
                triggered = true;
            });

            bindable.destroy();

            bindable.set('street', 'New Street');

            expect(triggered).to.equal(false);
        });

        it('should destroy all event bindables', function () {

            bindable.set('person', new C.Bindable({
                name: "Max"
            }));

            var triggered = 0;

            bindable.bind('person', 'change', function () {
                triggered++;
            });

            bindable.$.person.set('name', 'Peter');

            expect(triggered).to.be.equal(1);

            bindable.destroy();

            bindable.$.person.set('name', 'Max');

            expect(triggered).to.be.equal(1);
        });

    });

    describe('#_initialize', function () {

        var bindable;

        beforeEach(function () {

        });

        it('should initialize bindings in defaults when flag is set', function () {
            var ExtendedBindable = C.Bindable.inherit({
                defaults: {
                    firstName: "Peter",
                    lastName: "Mustermann"
                },
                fullName: function () {
                    return this.$.firstName + " " + this.$.lastName;
                }.onChange('firstName', 'lastName')
            });

            bindable = new C.Bindable({
                name: 'Street 1',
                city: '{address.city}',
                fullName: '{address.subEntity.fullName()}',
                address: new C.Bindable({
                    city: "Leipzig",
                    subEntity: new ExtendedBindable()
                })
            }, true);

            expect(bindable.$.city).to.be.equal(bindable.$.address.$.city);
            expect(bindable.$.fullName).to.be.equal(bindable.get('address.subEntity').fullName());
        });

    });

    describe('#_commit methods', function () {

        it('_commit method should be invoked once', function () {

            var MyBindable = C.Bindable.inherit({

                defaults: {
                    foo: "bar"
                },

                ctor: function () {
                    this.data = [];
                    this.callBase();
                },

                _commitFoo: function (value, oldValue) {
                    this.data.push({
                        value: value,
                        oldValue: oldValue
                    });
                }

            });

            var b = new MyBindable();

            expect(b.data).to.have.length(1);
            expect(b.data[0]).to.eql({
                value: "bar",
                oldValue: null
            });

        });

    })


});