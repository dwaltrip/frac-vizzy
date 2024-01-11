class Timer {
  private start: number;
  private end: number | null;

  constructor() {
    this.start = performance.now();
    this.end = null;
  }

  public restart() {
    this.start = performance.now();
    this.end = null;
  }

  public stop() {
    this.end = performance.now();
  }

  public stopAndLog(label: string) {
    if (this.end) throw new Error('Timer already stopped');
    this.stop();
    console.log(label, this.elapsed.toFixed(3), 'ms');
  }

  public get elapsed() {
    if (this.end === null) throw new Error('Timer not stopped');
    return this.end - this.start;
  }
}

export { Timer };
