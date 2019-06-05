const fs = require('fs')
const stylus = require('stylus')
const libSass = require('node-sass')
const dartSass = require('sass')
const readline = require('readline')

const repeats = 1000
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

async function benchmark(tests, currentIndex, total) {
    const test = tests[currentIndex]
    const testCompileTimes = []

    // Starts from -3 to skip initial warm-up iterations
    for (let i = -3; i < repeats; i++) {
        const start = process.hrtime.bigint()
        await test.compile(test.testName)
        const elapsed = process.hrtime.bigint() - start
        if (i >= 0) {
            testCompileTimes.push(elapsed)
        }
    }
    const avg = testCompileTimes.reduce((prev, curr) => prev + curr, 0n) / BigInt(repeats)
    total.push({
        compiler: test.compiler,
        testName: test.testName,
        avg: avg
    })

    if (currentIndex + 1 < tests.length) {
        await benchmark(tests, currentIndex + 1, total)
    }
}

function writeTsv(filename, tests) {
    const groupedByTestName = tests.reduce(function(rv, x) {
        (rv[x.testName] = rv[x.testName] || {})[x.compiler] = x.avg
        return rv
    }, {})

    const compilerNames = pprs.map(p => p.compiler)
    compilerNames.sort()

    const rows = Object.keys(groupedByTestName).map(testName =>
        [testName, ...compilerNames.map(compilerName => groupedByTestName[testName][compilerName])])
    rows.unshift(['Test Name', ...compilerNames])

    const tsv = rows.map(row => row.join('\t')).join('\n')
    fs.writeFile(filename, tsv, (err) => {
        if (err) { console.log(err) }
    })
}

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})
rl.question('Please hit Enter to start benchmarking...', () => {
    fs.readdir('src', async function(err, items) {
        if (items.some(i => i.startsWith('_'))) {
            items = items.filter(i => i.startsWith('_'))
        }

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
        const total = []

        await benchmark(tests, 0, total)
        writeTsv(`results.${Date.now()}.tsv`, total)
        total.forEach(t => {
            console.log(`${t.testName}\t${t.compiler}\t${(t.avg / 1000n).toString()}us`)
        })
    })
    rl.close()
})
