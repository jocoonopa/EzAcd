let assert = require('assert')

// BDD Style
describe('基本測試', () => {
    before(function() {
        // runs before all tests in this block
    })

    after(function() {
        // runs after all tests in this block
    })

    beforeEach(function() {
        // runs before each test in this block
    })

    afterEach(function() {
        // runs after each test in this block
    })

    describe('#indexOf()', () => {
        it('should return -1 when the value is not present', function(done) {
            assert.equal(
                [ 1, 2, 3].indexOf(4), 
                -1
            )

            done()
        })

        it('測試是否支援 async/await', async function() {
            let testAwait = (obj, val) => {
                return new Promise((resolve) => {
                    return setTimeout(() => {
                        obj.a = val

                        resolve()
                    }, 1000)
                })
            }
            let obj = {
                a: 0
            }
            const assertVal = 2

            await testAwait(obj, assertVal)

            assert.equal(obj.a, assertVal)
        })
    })

    describe('a suite of tests', function() {
        // 限制測試時間要在多少秒內完成
        this.timeout(500)

        it('should take less than 500ms', function(done){
            setTimeout(done, 400)
        })

        it('should take less than 500ms as well', function(done){
            setTimeout(done, 250)
        })
    })
})
