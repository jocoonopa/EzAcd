'use strict';

var _Adapter = require('../../../../src/Utils/EzACD/Response/Adapter');

var _Adapter2 = _interopRequireDefault(_Adapter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var assert = require('assert');

describe('Adapter 單元測試', function () {
    it('測試字串轉換為物件', function () {
        var testString = "a=b\nc=d\ne=f\n";
        var testObj = _Adapter2.default.toObj(testString);

        assert.equal(testObj.a, 'b');
        assert.equal(testObj.c, 'd');
        assert.equal(testObj.e, 'f');
    });

    it('測試 Adapter 從字串取值的功能', function () {
        var testString = "a=b\nc=d\ne=f\n";

        assert.equal(_Adapter2.default.get(testString, 'e'), 'f');
    });

    it('測試 Adapter isSuccess 判斷是否正常', function () {
        var testSuccessString = "a=b\nc=d\ne=f\ncode=0";
        var testFailString_1 = "a=b\nc=d\ne=f\ncodess=0";
        var testFailString_2 = "a=b\nc=d\ne=f\ncode=1";

        assert.equal(_Adapter2.default.isSuccess(testSuccessString), true);
        assert.equal(_Adapter2.default.isSuccess(testFailString_1), false);
        assert.equal(_Adapter2.default.isSuccess(testFailString_2), false);
    });
});