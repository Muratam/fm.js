import FM from './fm';

export default class FMInfo {
  constructor(hz, operators, volumes, ratios, adsr, startTime, endTime) {
    this.hz = hz;
    this.operators = operators;
    this.volumes = volumes;
    this.ratios = ratios;
    this.adsr = adsr;
    this.startTime = startTime;
    this.endTime = endTime;
  }
  static create(info) {
    return new FMInfo(
        info.hz, info.operators, info.volumes, info.ratios, info.adsr,
        info.startTime, info.endTime);
  }
  getMaxtrix() {
    const calcMatrix = (x, y) => {
      const val = this.operators[y][x] / 200 * 100;
      return val * val / FM.sampleRate * 2 / (x === y ? 2 : 1);
    };
    let matrix = FM.makeMatrix(FM.operatorNum);
    for (let x = 0; x < FM.operatorNum; x++) {
      for (let y = 0; y < FM.operatorNum; y++) {
        matrix[x][y] = calcMatrix(x, y);
      }
    }
    return matrix;
  }
  calc(t, data) {
    if (t / FM.sampleRate > this.endTime + this.adsr[3]) return false;
    const toFq = (t) => 2 * Math.PI * t;
    const matrix = this.getMaxtrix();
    let gs = new Float32Array(FM.operatorNum);
    let ps = new Float32Array(FM.operatorNum);
    gs.fill(0);
    for (let i = 0; i < data.length; ++i, ++t) {
      const now = (t * this.hz / FM.sampleRate);
      let sum = 0;
      for (let j = 0; j < FM.operatorNum; j++) ps[j] = gs[j];
      for (let x = 0; x < FM.operatorNum; x++) {
        let gsum = 0;
        for (let y = 0; y < FM.operatorNum; y++) {
          gsum += matrix[x][y] * ps[y];
        }
        gs[x] = Math.sin(toFq(now * this.ratios[x] + gsum));
        sum += gs[x] * this.volumes[x] / 200;
      }
      data[i] += sum / 3 * this.byADSR(t / FM.sampleRate);
    }
    return true;
  }
  byADSR(now) {
    const [a, d, s, r] = this.adsr;
    let t = now - this.startTime;
    if (t < 0) return 0;
    if (t < a) return t / a;
    t -= a;
    if (t < d) return s + (1 - s) * (1 - t / d);
    t = now - this.endTime;
    if (t < 0) return s;
    if (t < r) return s * (1 - t / r);
    return 0;
  }
}
