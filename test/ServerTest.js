var chai = require('chai'),
    expect = chai.expect,
    testRunner = require('..').TestRunner.setup();

var C = {};

// FIXME Create Server in application context
describe.skip('#Server', function () {

    var server;

    before(function (done) {
        testRunner.requireClasses({
            Server: 'srv/core/Server',
            EndPoint: 'srv/core/EndPoint',
            EndPoints: 'srv/core/EndPoints',
            Handlers: 'srv/core/Handlers',
            Filters: 'srv/core/Filters'
        }, C, function () {

            C.EndPointsMock = C.EndPoints.inherit({

                ctor: function (startCallback, stopCallback) {
                    this.startCallback = startCallback;
                    this.stopCallback = stopCallback;

                    this.callBase();
                },

                start: function () {
                    this.startCallback && this.startCallback();
                    this.callBase();
                },

                shutdown: function () {
                    this.stopCallback && this.stopCallback();
                    this.callBase();
                }
            });

            C.HandlersMock = C.Handlers.inherit({

                ctor: function (startCallback, stopCallback) {
                    this.startCallback = startCallback;
                    this.stopCallback = stopCallback;

                    this.callBase();
                },

                start: function () {
                    this.startCallback && this.startCallback();
                    this.callBase();
                },

                stop: function () {
                    this.stopCallback && this.stopCallback();
                    this.callBase();
                }
            });

            C.FiltersMock = C.Filters.inherit({

                ctor: function (startCallback, stopCallback) {
                    this.startCallback = startCallback;
                    this.stopCallback = stopCallback;

                    this.callBase();
                },

                start: function () {
                    this.startCallback && this.startCallback();
                    this.callBase();
                },

                stop: function () {
                    this.stopCallback && this.stopCallback();
                    this.callBase();
                }
            });

            C.EndPointMook = C.EndPoint.inherit({

                ctor: function(startCallback, stopCallback) {
                    this.startCallback = startCallback;
                    this.stopCallback = stopCallback;

                    this.callBase(null);
                },

                _start: function(callback) {
                    if (this.startCallback) {
                        this.startCallback(callback);
                    } else {
                        callback();
                    }
                },

                _stop: function(callback) {
                    if (this.stopCallback) {
                        this.stopCallback(callback);
                    } else {
                        callback();
                    }
                }
            });

            done();
        });
    });


    describe('#Start / Stop', function () {

        it('should not start if no endpoints are available', function (done) {

            var server = new C.Server();
            server.start(null, function (err) {
                expect(err).to.exist;
                expect(err.message).to.be.equal("No endPoints specified");
                done();
            });

        });

        it('end point, modules and filter should be started', function (done) {

            var server = new C.Server(),
                startCalled = 0,
                stopCalled = 0,
                endPointStarted = 0,
                endPointStopped = 0,
                start = function() {
                    startCalled++;
                },
                stop = function() {
                    stopCalled++;
                },
                endPoints =  new C.EndPointsMock(start, stop),
                handlers = new C.HandlersMock(start, stop),
                filters = new C.FiltersMock(start, stop);

            server.addChild(endPoints);
            server.addChild(handlers);
            server.addChild(filters);

            endPoints.addChild(new C.EndPointMook(function(callback) {
                setTimeout(function () {
                    endPointStarted++;
                    callback();
                }, 10);
            }, function(callback) {
                setTimeout(function () {
                    endPointStopped++;
                    callback();
                }, 10);
            }));

            server.start(null, function (err) {
                expect(err).to.not.exist;
                expect(startCalled).to.equal(3);
                expect(stopCalled).to.equal(0);
                expect(endPointStarted).to.equal(1);
                expect(endPointStopped).to.equal(0);

                server.shutdown(function(err) {
                    try {
                        expect(err).to.not.exist;
                        expect(stopCalled).to.equal(3);
                        expect(endPointStarted).to.equal(1);
                        expect(endPointStopped).to.equal(1);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });

            });

        });

//        it('should shutdown if an error during start occurs', function (done) {
//
//            var server = new C.Server();
//            server.start(null, function (err) {
//                expect(err).to.exist;
//                expect(err.message).to.be.equal("No endPoints specified");
//                done();
//            });
//
//        });

    });


//    describe('#Context', function () {
//
//        it('same type and it should be same instance', function () {
//            var a = ds.createEntity(C.Entity, 1),
//                b = ds.createEntity(C.Entity, 1);
//
//            expect(a).to.exist;
//            expect(b).to.exist;
//            expect(a).to.be.equal(b);
//        });
//
//        it('same type different id should not be same instance', function () {
//            var a = ds.createEntity(C.Entity, 1),
//                b = ds.createEntity(C.Entity, 2);
//
//            expect(a).to.exist;
//            expect(b).to.exist;
//            expect(a).to.be.not.equal(b);
//        });
//
//        it('different type same id should not be same instance', function () {
//
//            var E = C.Entity.inherit('testEntity');
//
//            var a = ds.createEntity(C.Entity, 1),
//                b = ds.createEntity(E, 1);
//
//            expect(a).to.exist;
//            expect(b).to.exist;
//            expect(a).to.be.not.equal(b);
//        });
//
//        it('createEntity without context and within rootContext should be the same instance', function () {
//
//            var a = ds.createEntity(C.Entity, 1),
//                b = ds.getContext().createEntity(C.Entity, 1);
//
//            expect(a).to.exist;
//            expect(b).to.exist;
//            expect(a).to.be.equal(b);
//        });
//
//        it('same type same id but different context should not be same instance', function () {
//
//            var a = ds.createEntity(C.Entity, 1),
//                b = ds.getContext({
//                    foo: 'bar'
//                }).createEntity(C.Entity, 1);
//
//            expect(a).to.exist;
//            expect(b).to.exist;
//            expect(a).to.be.not.equal(b);
//        });
//
//        it('context properties order should be independent', function () {
//
//            var a = ds.getContext({
//                    a: 'a',
//                    b: 'b'
//                }),
//                b = ds.getContext({
//                    b: 'b',
//                    a: 'a'
//                });
//
//            expect(a).to.exist;
//            expect(b).to.exist;
//            expect(a).to.be.equal(b);
//        });
//    });

});