'use strict';

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var assert = require('assert');

// BDD Style
describe('確認測試可運行', function () {
    describe('#indexOf()', function () {
        it('should return -1 when the value is not present', function (done) {
            assert.equal([1, 2, 3].indexOf(4), -1);

            done();
        });

        it('測試是否支援 async/await', _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
            var testAwait, obj, assertVal;
            return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                    switch (_context.prev = _context.next) {
                        case 0:
                            testAwait = function testAwait(obj, val) {
                                return new Promise(function (resolve) {
                                    return setTimeout(function () {
                                        obj.a = val;

                                        resolve();
                                    }, 1000);
                                });
                            };

                            obj = {
                                a: 0
                            };
                            assertVal = 2;
                            _context.next = 5;
                            return testAwait(obj, assertVal);

                        case 5:

                            assert.equal(obj.a, assertVal);

                        case 6:
                        case 'end':
                            return _context.stop();
                    }
                }
            }, _callee, this);
        })));
    });

    describe('a suite of tests', function () {
        // 限制測試時間要在多少秒內完成
        this.timeout(500);

        it('should take less than 100ms', function (done) {
            setTimeout(done, 100);
        });

        it('should take less than 200ms as well', function (done) {
            setTimeout(done, 200);
        });

        it('should take less than 300ms', function (done) {
            setTimeout(done, 300);
        });
    });
});