let assert = require('assert')

// BDD Style
describe('確認測試可運行', () => {
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

        it('should take less than 100ms', function(done){
            setTimeout(done, 100)
        })

        it('should take less than 200ms as well', function(done){
            setTimeout(done, 200)
        })

        it('should take less than 300ms', function(done){
            setTimeout(done, 300)
        })
    })
})
