[![test-workflow][test-workflow-badge]][ci-test]

# stream-repro
List of failure cases when [streaming][streams] over HTTP

## Cases

This is a WIP. A draft description each cases can be [found here][cases].

## Install

git clone, then:

```bash
# install
npm i

# spin up a PG server, then export it as DATABASE_URL
export DATABASE_URL=postgres://postgres:123@localhost:5432/repro

# create a 1-table DB with sample data
# ~ 25k events, ~1MB total
npm run initdb
```

## Test

To collect accurate runtime statistics, the requests are run in a separate
process, via [httpie][httpie], which you need to install.

Run the test cases:

```bash
npm test
```

### Plot the Garbage Collector compaction cycles

Each case tests the compaction cycles of [Oilpan][oilpan].  
Heap statistics are collected immediately following a collection/compaction.

To plot the heap while running the tests:

```bash
npm test --plot-gc
```

prints something like this:
```text

client aborts request while in-flight
  when we send one request
    ✔ sends an HTTP 200 and a 20 MB response
  when we send a lot of requests
    ✔ releases database connections back to the pool
*
                                                              -- Heap size following GC --

   Cur: 17 MB
   Max: 42 MB                                                                                   ─── heap size      No leakage
          ╷
    42.00 ┼                     ╭───────╮                    ╭───────╮             ╭───────╮                                                  
    35.17 ┤                     │       │                    │       │             │       │             ╭─────────────────────╮              
    28.33 ┤       ╭─────────────╯       │      ╭─────────────╯       ╰─────────────╯       ╰──────╮      │                     ╰──────╮       
    21.50 ┼───────╯                     ╰──────╯                                                  ╰──────╯                            │       
    14.67 ┤                                                                                                                           ╰──────
     7.83 ┤                                                                                                                                   
     1.00 ┤                                                                                                                                   
          ┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬

   Initial: 18 MB                                                                                                               GC Cycles: 18


    ✔ exhibits memory spikes that return to baseline

```

## Run server

Not much point in this but you can view the streams
in the browser itself

```bash
npm start
```

## Env info

```yml
# machine
MacOS Sonoma @M2 24GB Air
Node: v22.0.0
Chrome: v124.0.6  
Postgres: v16
```

## Notes

- https://stackoverflow.com/questions/41155877/node-js-passthrough-stream-not-closing-properly

## Authors

@nicholaswmin

MIT License, 2024

[test-workflow-badge]: https://github.com/nicholaswmin/stream-repro/actions/workflows/tests.yml/badge.svg
[ci-test]: https://github.com/nicholaswmin/stream-repro/actions/workflows/tests.yml
[streams]: https://nodejs.org/api/stream.html#readable-streams
[nicholaswmin]: https://github.com/nicholaswmin
[httpie]: https://httpie.io/docs/cli/installation
[oilpan]: https://v8.dev/blog/oilpan-library
[cases]: .github/docs/CASES.md
