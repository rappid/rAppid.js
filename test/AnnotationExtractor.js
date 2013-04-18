var expect = require('chai').expect;

describe('#Annotations', function () {

    describe("@param", function () {

        var rParam = /\*\s{0,4}@param\s+?(?:\{(.+)?\})?\s*(?:([^[ ]+)|(?:\[([^=]+)(?:=(.*)?)?\]))\s*-?\s*(.+)?$/;

        function testMatch(input, expected) {

            var result = rParam.exec(input);
            expect(result).to.exist;

            result.shift();

            if (expected.type) {
                expect(result[0]).to.be.equal(expected.type);
            } else {
                expect(result[0]).to.not.exist;
            }

            if (!expected.optional) {
                expect(result[1]).to.be.equal(expected.name);
                expect(result[2]).to.not.exist;
            } else {
                expect(result[2]).to.be.equal(expected.name);
                expect(result[1]).to.not.exist;
            }

            if (expected.defaultValue) {
                expect(result[3]).to.be.equal(expected.defaultValue);
            } else {
                expect(result[3]).to.not.exist;
            }

            if (expected.description) {
                expect(result[4]).to.be.equal(expected.description);
            } else {
                expect(result[4]).to.not.exist;
            }

        }

        it('* @param foo', function () {
            testMatch('* @param foo', {
                name: 'foo'
            });
        });

        it('* @param {String} foo', function () {
            testMatch('* @param {String} foo', {
                name: 'foo',
                type: 'String'
            });
        });

        it('* @param {String|Object} foo', function () {
            testMatch('* @param {String|Object} foo', {
                name: 'foo',
                type: 'String|Object'
            });
        });

        it('* @param [foo]', function () {
            testMatch('* @param [foo]', {
                name: 'foo',
                optional: true
            });
        });

        it('* @param [foo=xy]', function () {
            testMatch('* @param [foo=xy]', {
                name: 'foo',
                defaultValue: 'xy',
                optional: true
            });
        });

        it('* @param {*} [foo=xy]', function () {
            testMatch('* @param {*} [foo=xy]', {
                name: 'foo',
                type: '*',
                defaultValue: 'xy',
                optional: true
            });
        });

        it('* @param {*} [foo=xy] - a b c', function () {
            testMatch('* @param {*} [foo=xy] - a b c', {
                name: 'foo',
                type: '*',
                defaultValue: 'xy',
                description: 'a b c',
                optional: true
            });
        });

        it('* @param {*} [foo=xy] - a b c', function () {
            testMatch('* @param {*} [foo=xy] a b c', {
                name: 'foo',
                type: '*',
                defaultValue: 'xy',
                description: 'a b c',
                optional: true
            });
        });

    });

    describe("@type", function () {

        var rType = /\*\s{0,4}@type\s+?\{?([^}]+)?\}?\s*?$/;

        function testMatch(input, expected) {

            var result = rType.exec(input);
            expect(result).to.exist;

            result.shift();

            if (expected.type) {
                expect(result[0]).to.be.equal(expected.type);
            } else {
                expect(result[0]).to.not.exist;
            }

            if (!expected.optional) {
                expect(result[1]).to.be.equal(expected.name);
                expect(result[2]).to.not.exist;
            } else {
                expect(result[2]).to.be.equal(expected.name);
                expect(result[1]).to.not.exist;
            }

            if (expected.defaultValue) {
                expect(result[3]).to.be.equal(expected.defaultValue);
            } else {
                expect(result[3]).to.not.exist;
            }

            if (expected.description) {
                expect(result[4]).to.be.equal(expected.description);
            } else {
                expect(result[4]).to.not.exist;
            }

        }

        it('* @type String', function () {
            testMatch('* @type String', {
                type: "String"
            });
        });

        it('* @type {String}', function () {
            testMatch('* @type {String}', {
                type: 'String'
            });
        });

        it('* @type {String|Object} foo', function () {
            testMatch('* @type {String|Object}', {
                type: 'String|Object'
            });
        });


    });

});