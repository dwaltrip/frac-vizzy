class PerfStats {
  private stats: Map<string, number[]>;

  constructor() {
    this.stats = new Map();
  }

  resetStats(key: string): void {
    this.stats.set(key, []);
  }

  startTimer(key: string): {
    end: () => void;
    endWithResult: <T>(result: T) => T;
  } {
    const startTime = performance.now();

    const stats = this.stats;
    return {
      end() {
        const endTime = performance.now();
        const elapsedTime = endTime - startTime;
        if (!stats.has(key)) {
          stats.set(key, []);
        }
        stats.get(key)?.push(elapsedTime);
      },
      endWithResult(result) {
        this.end();
        return result;
      },
    };
  }

  private calculateStatistics(times: number[]): {
    avg: number;
    median: number;
    min: number;
    max: number;
    p1: number;
    p99: number;
    cumulative: number;
  } {
    times.sort((a, b) => a - b);
    const min = times[0];
    const max = times[times.length - 1];
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const median = times[Math.floor(times.length / 2)];
    const p1 = times[Math.floor(times.length * 0.01)] || min;
    const p99 = times[Math.floor(times.length * 0.99)] || max;
    const cumulative = times.reduce((a, b) => a + b, 0);

    return { avg, median, min, max, p1, p99, cumulative };
  }

  logStats(key: string, prefix: string | undefined): void {
    const times = this.stats.get(key);

    const prefixStr = typeof prefix === 'string' ? prefix : '';
    const keyPadding = Array.from(this.stats.keys()).reduce(
      (max, key) => Math.max(max, key.length),
      0,
    );
    const fmtNum = (num: number) => num.toFixed(2).padStart(8);

    if (times && times.length > 0) {
      const { avg, median, min, max, p1, p99, cumulative } =
        this.calculateStatistics(times);
      console.log(
        `${prefixStr}[${key.padEnd(keyPadding)}]`,
        `avg: ${avg.toFixed(2)} ms ||`,
        `p1: ${fmtNum(p1)} ms ||`,
        `p99: ${fmtNum(p99)} ms ||`,
        `total: ${fmtNum(cumulative)} ms`,
        // `count: ${times.length.toFixed(0).padStart(5)}`,
      );
    } else {
      console.log(`${prefixStr}[${key}] No data`);
    }
  }

  logAllStats(prefix: string | undefined): void {
    const prefixStr = typeof prefix === 'string' ? prefix : '';
    console.log(`${prefixStr}PerfStats:`);
    for (const key of this.stats.keys()) {
      this.logStats(key, prefixStr);
    }
  }
}

export const perfStats = new PerfStats();
