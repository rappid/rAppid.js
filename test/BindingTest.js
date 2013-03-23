var chai = require('chai'),
    should = chai.should(),
    flow = require('flow.js').flow,
    expect = chai.expect,
    testRunner = require('..').TestRunner.setup();

var C = {};

describe('js.core.Binding', function () {

    var target,
        model,
        returnValue = "HALLO",
        parameters = ["'abc'",123,true,false,"null"],
        parStr = "abc",
        parNum = 123,
        extendedModel,
        ExtendedClass;

    before(function (done) {

        flow()
            .seq(function(cb){
                testRunner.requireClasses({
                    Binding: 'js/core/Binding',
                    Bindable: 'js/core/Bindable',
                    Parser: 'js/lib/parser'
                }, C, cb);

            })
            .seq(function(cb){
                ExtendedClass = C.Bindable.inherit('ExtendedClass', {
                    foo: function () {
                        return returnValue;
                    },
                    bar: function () {
                        var args = Array.prototype.slice.call(arguments);
                        if(args.length !== parameters.length){
                            return false;
                        }
                        var parameter;
                        for(var i = 0; i < args.length; i++){
                            parameter = parameters[i];
                            parameter = parameter === "null" ? null : parameter;
                            if(parameter && parameter.replace){
                                parameter = parameter.replace(/'/gi,"");
                            }
                            if(args[i] !== parameter){
                                return false;
                            }
                        }
                        return true;
                    },
                    foobar: function (a,b) {
                        return a === parStr && b === parNum;
                    },
                    calculatedAttribute: function(){
                        return "test";
                    }.onChange('m1'),

                    // MOCK FUNCTION
                    getScopeForFncName: function (name) {
                        if (this[name]) {
                            return this;
                        }
                        return null;
                    },
                    // MOCK FUNCTION
                    getScopeForKey: function (name) {
                        if (this.$[name]) {
                            return this;
                        }
                        return null;
                    }
                });
                cb();
            })
            .exec(done);



    });


    beforeEach(function () {
        target = new C.Bindable({val: null});
        model = new C.Bindable({});

        extendedModel = new ExtendedClass({});
    });

    describe('#one-way-binding', function () {

        it('simple value set should set value on binded target', function () {

            var b1 = new C.Binding({scope: model, path: 'a', target: target, targetKey: "val"});
            model.set("a", "A");

            expect(target.get('val')).to.be.equal('A');

        });

        it('path binding a.b should return undefined if b is not set', function () {
            var b1 = new C.Binding({scope: model, path: 'a.b', target: target, targetKey: "val"});

            model.set("a", "A");
            should.equal(target.get('val'), undefined);

            var m1 = new C.Bindable({b: "B"});
            model.set("a", m1);
            target.get('val').should.equal('B');

            m1.set("b", "B2");
            target.get("val").should.equal('B2');

            var m2 = new C.Bindable({b: "AWESOME"});
            model.set("a", m2);
            target.get("val").should.equal("AWESOME");

            model.set('a', null);
            should.equal(target.get('val'), undefined);
        });

        it('path binding a.b.c should return undefined if b or c is not set', function () {
            var b1 = new C.Binding({scope: model, path: 'a.b.c', target: target, targetKey: "val"});

            model.set("a", "A");
            should.equal(target.get('val'), undefined);

            var m1 = new C.Bindable({b: "B"});
            model.set("a", m1);
            should.equal(target.get("val"), undefined);

            var m2 = new C.Bindable({c: "WHAT UP"});
            m1.set('b', m2);
            target.get("val").should.equal('WHAT UP');

            var m3 = new C.Bindable({b: "AWESOME"});
            model.set("a", m3);
            should.equal(target.get("val"), undefined);
        });

        it('path binding a.b.c should return c if b is just a json object', function() {
            var b1 = new C.Binding({scope: model, path: 'a.b.c', target: target, targetKey: "val"});

            var testValue = "TEST VALUE";

            should.equal(target.get('val'),null);

            model.set("a", {
                b: {
                    c: testValue
                }
            });

            should.equal(target.get('val'),testValue);
        })

    });

    describe('#two way binding', function () {
        it('should set value on scope', function () {
            new C.Binding({scope: model, path: 'a', target: target, targetKey: "val", twoWay: true});

            model.set("a", "A");
            model.get('a').should.equal("A");
            target.set({val: 'TargetValue'});

            model.get("a").should.equal("TargetValue");
        });

        it('should set value if b in a.b is set', function () {
            var binding = new C.Binding({scope: model, path: 'a.b', target: target, targetKey: "val", twoWay: true});

            target.set({val: 'TargetValue'});
            should.equal(binding.getValue(), null);

            var m1 = new C.Bindable({b: "hello"});
            model.set("a", m1);

            target.set({val: 'TargetValue'});
            m1.get('b').should.equal("TargetValue");
        });
    });


    describe('#function binding', function () {

        it('foo() should call fnc and set returned value to target', function () {
            new C.Binding({scope: extendedModel, path: "foo()", target: target, targetKey: 'val'}).triggerBinding();
            target.get('val').should.equal(returnValue);
        });

        it('a.foo() should be triggered if "a" is set and has fnc', function () {
            new C.Binding({scope: model, path: 'a.foo()', target: target, targetKey: 'val'}).triggerBinding();
            should.not.exist(target.get('val'));

            var m1 = new C.Bindable({b: "what"});
            model.set('a', m1);

            should.not.exist(target.get('val'));

            model.set('a', extendedModel);

            target.get('val').should.equal(returnValue);
        });

        var fncBinding = "bar("+parameters.join(",")+")";

        it(fncBinding + " should call bar with parameters and return true", function () {
            new C.Binding({scope: extendedModel, path: fncBinding, target: target, targetKey: 'val'}).triggerBinding();
            target.get('val').should.equal(true);
        });

        var fncBinding2 = "foobar(m1.a,m1.b)";

        it(fncBinding2 + ' should be triggered if m1.a or m1.b is changing', function () {
            var extendedTarget = new ExtendedClass();
            // extendedTarget.set('m1', new ExtendedClass({}));
            extendedModel.set('m1', extendedTarget);
            new C.Binding({scope: extendedModel, path: fncBinding2, target: extendedTarget, targetKey: 'val'}).triggerBinding();
            extendedTarget.get('val').should.equal(false);

            extendedTarget.set({'a': parStr, 'b': parNum});
            extendedTarget.get('val').should.equal(true);

            extendedModel.set('m1', new ExtendedClass({
                a: 'a',
                b: 'b'
            }));
            extendedTarget.get('val').should.equal(false);
        });

    });

    describe('#destroy', function(){

        it('should be called on target.destroy', function(){
            var binding = new C.Binding({scope: extendedModel, path: "foo()", target: target, targetKey: 'val'}),
                binding2 = new C.Binding({scope: extendedModel, path: "foobar(m1.a,m1.b)", target: target, targetKey: 'val2'}),
                binding3 = new C.Binding({scope: extendedModel, path: "calculatedAttribute()", target: target, targetKey: 'val3'});

            target.destroy();

            extendedModel.set('m1', new ExtendedClass({
                a: 'a',
                b: 'b'
            }));

            expect(binding.$).to.not.exist;
            expect(binding2.$).to.not.exist;
            expect(binding3.$).to.not.exist;

        });

        it('should be called on scope.destroy', function () {
            var binding = new C.Binding({scope: extendedModel, path: "foo()", target: target, targetKey: 'val'}),
                binding2 = new C.Binding({scope: extendedModel, path: "foobar(m1.a,m1.b)", target: target, targetKey: 'val2'}),
                binding3 = new C.Binding({scope: extendedModel, path: "calculatedAttribute()", target: target, targetKey: 'val3'});

            extendedModel.destroy();

            expect(binding.$).to.not.exist;
            expect(binding2.$).to.not.exist;
            expect(binding3.$).to.not.exist;


        });

    });
});