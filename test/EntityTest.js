var chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    flow = require("flow.js").flow,
    _ = require('underscore'),
    testRunner = require('..').TestRunner.setup();

var C = {};


describe('js.data.Entity', function () {

    var EntityClass,
        OptionalAttributeEntity;

    before(function (done) {
        testRunner.requireClasses({
            Entity: 'js/data/Entity',
            Model: 'js/data/Model',
            List: 'js/core/List',
            RegExValidator: 'js/data/validator/RegExValidator'
        }, C, function(err) {

            EntityClass = C.Entity.inherit('app.entity.Entity', {
                schema: {
                    name: String
                }
            });

            OptionalAttributeEntity = EntityClass.inherit("app.entity.OptionalAttributeEntity", {
                schema: {
                    phone: {
                        required: false,
                        type: String
                    }
                },

                validators: [
                    new C.RegExValidator({
                        field: "phone",
                        regEx: /\d+/,
                        errorMessage: "Phone number in wrong format"
                    })
                ]
            });

            done(err);
        });

    });

    describe('#validate', function () {

        it('should validate required fields', function (done) {
            var entity = new EntityClass();

            entity.validate(null, function(err) {
                var error = null;

                try {
                    expect(err).not.to.exist;
                    expect(entity.isValid()).to.be.equal(false);
                    expect(entity.fieldError('name')).to.exist;
                } catch (e) {
                    error = e;
                }

                done(error);
            });

        });

        it ('should handle optional fields', function(done) {
            var entity = new OptionalAttributeEntity({
                name: "foo"
            });

            entity.validate(null, done);

        });

        it('optional fields with wrong format should not validate', function (done) {
            var entity = new OptionalAttributeEntity({
                name: "foo",
                phone: "a"
            });

            entity.validate(null, function(err) {

                var error;

                try {
                    expect(err).to.not.exist;
                    expect(entity.fieldError('phone')).to.exist;
                } catch (e) {
                    error = e;
                }

                done(error);

            });

        });

        it('optional fields with correct format should validate', function (done) {
            var entity = new OptionalAttributeEntity({
                name: "foo",
                phone: "123"
            });

            entity.validate(null, function (err) {

                var error;

                try {
                    expect(err).to.not.exist;
                    expect(entity.isValid()).to.be.true;
                } catch (e) {
                    error = e;
                }

                done(error);

            });

        });


        it('should validate the types of the attributes', function (done) {
            EntityClass = C.Entity.inherit('app.entity.Entity', {
                schema: {
                    name: String,
                    isMale: Boolean,
                    birthDate: Date,
                    age: Number,
                    subEntity: C.Entity
                }
            });

            var entity = new EntityClass({
                name: 123,
                isMale: "asd",
                birthDate: '123123',
                age: "12",
                subEntity: "asd"
            });

            entity.validate(null, function (err) {

                var error = null;

                try {
                    expect(err).not.to.exist;
                    expect(entity.isValid()).to.be.equal(false);
                    expect(entity.fieldError('name')).to.exist;
                    expect(entity.fieldError('isMale')).to.exist;
                    expect(entity.fieldError('birthDate')).to.exist;
                    expect(entity.fieldError('age')).to.exist;
                    expect(entity.fieldError('subEntity')).to.exist;
                } catch (e) {
                    error = e;
                }

                done(error);
            });

        });

        it('should validate sub entity', function(done){
            var SubEntityClass = C.Entity.inherit('app.entity.SubEntity', {
                schema: {
                    name: String
                }
            });

            EntityClass = C.Entity.inherit('app.entity.Entity', {
                schema: {
                    name: String,
                    subEntity: SubEntityClass
                }
            });

            var subEntity  = new SubEntityClass({
            });

            var entity = new EntityClass({
                name: "Test",
                subEntity: subEntity
            });

            entity.validate(null, function(err){

                var error = null;

                try {
                    expect(err).not.to.exist;
                    expect(entity.isValid()).to.be.equal(false);
                    expect(entity.fieldError('name')).not.to.exist;
                    expect(entity.fieldError('subEntity')).to.exist;
                } catch (e) {
                    error = e;
                }

                done(error);
            });
        });

    });

    describe('#clone', function(){

        it('should clone all primitive attributes and subEntities', function(){
            EntityClass = C.Entity.inherit('app.entity.Entity', {
                schema: {
                    name: String,
                    isMale: Boolean,
                    birthDate: Date,
                    age: Number,
                    subEntity: C.Entity
                }
            });

            var entity = new EntityClass({
                name: "Marcus",
                isMale: true,
                birthDate: new Date(),
                age: 12,
                subEntity: new EntityClass({
                    name: "Sandra",
                    isMale: false
                })
            });

            var clone = entity.clone();

            expect(clone.isDeepEqual(entity)).to.be.equal(true);
            expect(clone.$.subEntity).to.be.not.equal(entity.$.subEntity);

        });

        it('should not clone model', function(){
            EntityClass = C.Entity.inherit('app.entity.Entity', {
                schema: {
                    name: String,
                    company: C.Model
                }
            });

            var company = new C.Model({
                name: "Rappid"
            });

            var entity = new EntityClass({
                name: "Marcus",
                company: company
            });

            var clone = entity.clone();

            expect(clone.$.company).to.be.equal(clone.$.company);
        });

        it('should not clone models in a list', function(){
            EntityClass = C.Entity.inherit('app.entity.Entity', {
                schema: {
                    name: String,
                    companies: [C.Model]
                }
            });

            var list = new C.List();

            list.add([
                new C.Model({name: "rappid"}),
                new C.Model({name: "google"})
            ]);

            var entity = new EntityClass({
                name: "Marcus",
                companies: list
            });

            var clone = entity.clone();

            expect(clone.$.companies).to.be.not.equal(entity.$.companies);
            clone.$.companies.each(function(item, index){
                expect(item).to.be.equal(entity.$.companies.at(index));
            });
        });

    });

    describe.skip('#sync', function(){

        it('should write values back to source', function(){
            // TODO
        });

        it('should do nothing if no source is defined', function(){
            // TODO
        });

    });


});