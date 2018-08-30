import Adapter from '../../../../src/Utils/EzACD/Response/Adapter'
let assert = require('assert')

describe('Adapter 單元測試', () => {
    it('測試字串轉換為物件', () => {
        let testString = "a=b\nc=d\ne=f\n"
        let testObj = Adapter.toObj(testString)

        assert.equal(testObj.a, 'b')
        assert.equal(testObj.c, 'd')
        assert.equal(testObj.e, 'f')
    })

    it('測試 Adapter 從字串取值的功能', () => {
        let testString = "a=b\nc=d\ne=f\n"

        assert.equal(Adapter.get(testString, 'e'), 'f')
    })

    it ('測試 Adapter isSuccess 判斷是否正常', () => {
        let testSuccessString = "a=b\nc=d\ne=f\ncode=0"
        let testFailString_1 = "a=b\nc=d\ne=f\ncodess=0"
        let testFailString_2 = "a=b\nc=d\ne=f\ncode=1"

        assert.equal(Adapter.isSuccess(testSuccessString), true)
        assert.equal(Adapter.isSuccess(testFailString_1), false)
        assert.equal(Adapter.isSuccess(testFailString_2), false)
    })
})