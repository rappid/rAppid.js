var chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    _ = require('underscore'),
    testRunner = require('..').TestRunner.setup();

var C = {};


describe('js.data.Entity', function () {

    var EntityClass;

    before(function (done) {
        testRunner.requireClasses({
            Entity: 'js/data/Entity',
            Model: 'js/data/Model',
            List: 'js/core/List'
        }, C, function(err) {

            EntityClass = C.Entity.inherit('app.entity.Entity', {
                schema: {
                    name: String
                }
            });

            done(err);
        });

    });

    describe('#validate', function () {

        it('should validate required fields', function () {
            var entity = new EntityClass();

            entity.validate({}, function (err) {
                expect(err).not.to.exist;
                expect(entity.isValid()).to.be.equal(false);
                expect(entity.fieldError('name')).to.exist;
            });
        });

        it('should validate the types of the attributes', function () {
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

            entity.validate({}, function (err) {
                expect(err).not.to.exist;
                expect(entity.isValid()).to.be.equal(false);
                expect(entity.fieldError('name')).to.exist;
                expect(entity.fieldError('isMale')).to.exist;
                expect(entity.fieldError('birthDate')).to.exist;
                expect(entity.fieldError('age')).to.exist;
                expect(entity.fieldError('subEntity')).to.exist;
            });

        });

        it('should validate sub entity', function(){
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

            entity.validate({}, function(err){
                expect(err).not.to.exist;
                expect(entity.isValid()).to.be.equal(false);
                expect(entity.fieldError('name')).not.to.exist;
                expect(entity.fieldError('subEntity')).to.exist;
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