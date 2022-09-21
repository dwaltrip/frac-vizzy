
/* Example usage:

  const statsCollector = new PerfStatsCollector();
  for (let i=0; i<100; i++) {
    statsCollector.timeFn(() => doSomething(i));
  }
  console.log('Stats for doSomething:', statsCollector.collectStats());

*/

class PerfStatsCollector {
  data = [];

  timeFn(fn) {
    const t0 = performance.now();
    const ret = fn(); 
    const t1 = performance.now();
    this.data.push(t1 - t0);
    return ret;
  }

  collectStats() {
    return getStats(this.data);
  }
}

function getStats(data) {
  const sortedData = [...data].sort();

  const average = data.reduce((memo, num) => memo + num, 0) / data.length;
  const median = sortedData[Math.floor(data.length / 2)];
  const standardDeviation = Math.sqrt(data.reduce((memo, num) => {
    return memo + (Math.pow(num - average, 2) / data.length);
  }, 0));

  return {
    average,
    median,
    standardDeviation,
  };
}

export { PerfStatsCollector };
