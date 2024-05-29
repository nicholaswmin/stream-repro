// Stats Collector
//
// Collects heap size after a GC compaction, guessing whether it's a leak
//
// Authors: Nik Kyriakides
// @nicholaswmin

import v8 from 'node:v8'
import vm from 'node:vm'
import { setTimeout as sleep } from 'node:timers/promises'
import { PerformanceObserver } from 'node:perf_hooks'

import isLeaking from './is-leaking.js'
import Plot from './plot/index.js'

v8.setFlagsFromString('--expose-gc')
global.gc = vm.runInNewContext('gc')

export default class Memstat {
  constructor({ watch = false, drawPlot = false } = {}) {
    this.watch = watch || process.argv.includes('--memwatch')
    this.drawPlot = drawPlot

    this.initial = null
    this.snapshots = []
    this.current = null
    this.leaks = false

    this.plot = null
    this.observer = null
  }

  // public
  start() {
    this.end()

    this.initial = v8.getHeapStatistics().used_heap_size
    this.snapshots = [this.initial]
    this.current = null
    this.leaks = false

    this.plot = new Plot({ initial: this.initial, watch: this.watch })
    this.observer = new PerformanceObserver(list => {
      this.plot.update(this.update().getStats())
    })

    this.observer.observe({ entryTypes: ['gc'], buffered: false })

    this.update()
  }

  // public
  stop() {
    this.end()

    if (this.drawPlot)
      console.log(this.plot.generate())

    return this.getReport()
  }

  // private
  update() {
    this.current = v8.getHeapStatistics().used_heap_size
    this.snapshots.push(this.current)
    this.leaks = isLeaking(this.snapshots)

    this.plot.update(this.getStats())

    return this
  }

  // private,
  // public uses `this.stop()` instead
  // which calls this
  async end() {
    if (this.observer)
      this.observer.disconnect()

    global.gc()

    if (this.plot)
      this.update().plot.end()
  }

  // private
  // creates stats for internal-use, i.e:
  // plot drawing
  getStats() {
    return {
      initial: this.initial,
      snapshots: [ ...this.snapshots ],
      current: this.current,
      leaks: this.leaks
    }
  }

  // private
  // public report is generated by this but users
  // should get it via calling `this.end()` in userland
  getReport() {
    return {
      leaks: this.leaks,
      stats: this.getStats(),
      plot: this.plot.generate({ colors: [] })
    }
  }
}
