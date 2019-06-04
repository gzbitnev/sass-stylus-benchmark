const fs = require('fs')
const stylus = require('stylus')
const libSass = require('node-sass')
const dartSass = require('sass')
const readline = require('readline')


const repeats = 100
const pprs = [
    {
        compiler: 'Stylus',
        compile: function(testName) {
            return new Promise((resolve, reject) => {
                stylus.render(
                    `@import "src/${testName}/index.styl"`,
                    function(err, css) {
                        if (err) { reject(err) } else { resolve(css) }
                    })
            })
        }
    },
    {
        compiler: 'LibSass',
        compile: function(testName) {
            return new Promise((resolve, reject) => {
                libSass.render({
                    file: `src/${testName}/index.scss`
                }, function(err, css) {
                    if (err) { reject(err) } else { resolve(css.css) }
                })
            })
        }
    },
    {
        compiler: 'DartSass',
        compile: function(testName) {
            return new Promise((resolve, reject) => {
                dartSass.render({
                    file: `src/${testName}/index.scss`
                }, function(err, css) {
                    if (err) { reject(err) } else { resolve(css.css) }
                })
            })
        }
    },
]

const total = [];
async function benchmark(tests, currentIndex) {
    const results = []
    const test = tests[currentIndex];

    // Starts from -3 to skip initial warm-up iterations
    for (let i = -3; i < repeats; i++) {
        const start = process.hrtime.bigint();
        await test.compile(test.testName)
        const elapsed = process.hrtime.bigint() - start;
        if (i >= 0) {
            results.push(elapsed)
        }
    }
    const avg = results.reduce((prev, curr) => prev + curr, 0n) / BigInt(repeats)
    total.push({
        compiler: test.compiler,
        testName: test.testName,
        avg: avg
    })

    if (currentIndex + 1 < tests.length) {
        await benchmark(tests, currentIndex + 1)
    }
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})
rl.question('Please hit Enter to start benchmarking:', () => {
    fs.readdir('src', async function(err, items) {
        const tests = items.reduce((prev, testName) => {
            return [
                ...prev,
                ...pprs.map(p => ({
                    compiler: p.compiler,
                    compile: p.compile,
                    testName: testName
                }))
            ]
        }, [])

        await benchmark(tests, 0);
        total.forEach(t => {
            console.log(`Test ${t.testName}\t\t${t.compiler} time:\t\t ${(t.avg / 1000n).toString()}μs`)
        })
    })
    rl.close()
})
