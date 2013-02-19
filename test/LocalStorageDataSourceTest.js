var chai = require('chai'),
    expect = chai.expect,
    testRunner = require('..').TestRunner.setup(),
    flow = require('flow.js').flow;

var C = {};

// FIXME Add resource configuration to LocalStorageDataSource
describe.skip('js.data.LocalStorageDataSource', function () {

    var ds;
    var Person, person;

    before(function (done) {
        testRunner.requireClasses({
            LocalStorageDataSource: 'js/data/LocalStorageDataSource',
            LocalStorage: 'js/data/LocalStorage',
            Model: 'js/data/Model',
            Entity: 'js/data/Entity',
            Collection: 'js/data/Collection',
            Configuration: 'js/conf/Configuration'
        }, C, function (err) {
            if (!err) {
                Person = C.Model.inherit("test.Person", {
                    defaults: {
                        firstname: "Karl",
                        lastname: "Heinz"
                    },
                    fullName: function () {
                        return this.$.firstname + " " + this.$.lastname;
                    }
                });

                C.LocalStorageDataSource.prototype._getStorage = function () {
                    return new C.LocalStorage.ObjectImplementation();
                };

            }

            ds = new C.LocalStorageDataSource({
                name: ''
            });

            ds.addChild(new C.Configuration({
                modelClassName: 'test.Person',
                path: 'persons',
                collectionClassName: 'js.data.Collection[test.Person]'
            }));

            done(err);

        });
    });

    describe('#save ', function () {
        var personId;
        it('should create a new entry in localStorage', function () {
            var person = ds.createEntity(Person);
            person.save(null, function () {
                personId = person.get('id');
                expect(personId).to.exist;
            });
        });

        it('should update an existing model', function () {
            var persons = ds.createCollection(C.Collection.of(Person));
            var personSize = persons.length;
            var person, personId;

            flow().seq(function (cb) {
                persons.fetch(null, function (err, page) {
                    person = page.at(0);
                    personId = person.$.id;
                    cb(err);
                });

            }).seq(function (cb) {
                    person.set('firstname', 'Marcus');
                    person.save(null, cb);
                }).seq(function (err) {
                    expect(person.$.id).to.be.equal(personId);
                    expect(persons.length).to.be.equal(personSize);
                });

        });
    });

    describe('#fetch ', function () {
        it('should fetch a single model with id', function () {
            var id;
            var p2, p1 = ds.createEntity(Person);
            flow().
                seq(function (cb) {
                    p1.save(null, cb);
                }).
                seq(function (cb) {
                    p2 = ds.createEntity(Person);
                    p2.set('id', p1.$.id);
                    p2.fetch(null, cb)
                }).
                exec(function (err) {
                    expect(err).not.to.exist;
                    expect(p2.$.firstname).to.be.equal(p1.$.firstname);
                    expect(p2.$.lastname).to.be.equal(p1.$.lastname);
                });
        });

        it('should throw error if model has no id', function () {
            var p1 = ds.createEntity(Person);
            p1.fetch(null, function (err) {
                expect(err).to.exist;
            });
        });

        it('should throw error if model could not be found', function () {
            var p1 = ds.createEntity(Person, "a");
            p1.fetch(null, function (err) {
                expect(err).to.exist;
            });
        })
    })

});