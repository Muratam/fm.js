import FMInfo from './fm-info';
import $ from 'jquery';
import io from 'socket.io-client';

export default class FM {
  static get operatorNum() { return 6; }
  static get sampleRate() { return 44100; }
  static index2hx(i, base = 261.2) { return base * Math.pow(2, i / 12); }
  static makeMatrix(dim) {
    let res = [];
    for (let x = 0; x < dim; x++) {
      res.push([]);
      for (let y = 0; y < dim; y++) res[x].push(0);
    }
    return res;
  }

  constructor() {
    this.socket = io();
    this.socket.on(
        'receive_message', (text) => {this.receivedSocketMessage(text)});
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.context.samplingRate = FM.sampleRate;
    this.oneTimeLength = 2048;
    this.t = this.getNowT();
    this.id = new Date().getTime();
    this.node = this.context.createScriptProcessor(this.oneTimeLength, 1, 1);
    this.node.onaudioprocess = (e) => { this.process(e) };
    this.gs = new Array(FM.operatorNum);
    this.oneTimeData = new Array(this.oneTimeLength);
    this.sliderVals = FM.makeMatrix(FM.operatorNum + 2);
    this.adsr = [0.2, 0.05, 0.9, 0.2];
    this.released = {};
    this.sustainTime = 20;
    this.receivedInfos = {};
    this.infos = {};
    this.play();
  }
  getOperator(x, y) { return this.sliderVals[x][y]; }
  getOperators() {
    let res = FM.makeMatrix(FM.operatorNum);
    for (let x = 0; x < FM.operatorNum; x++) {
      for (let y = 0; y < FM.operatorNum; y++) {
        res[x][y] = this.getOperator(x, y);
      }
    }
    return res;
  }
  getVolume(y) { return this.sliderVals[FM.operatorNum][y]; }
  getVolumes() {
    let res = new Array(FM.operatorNum);
    for (let x = 0; x < FM.operatorNum; x++) res[x] = this.getVolume(x);
    return res;
  }
  getRatio(y) { return this.sliderVals[FM.operatorNum + 1][y]; }
  getRatios() {
    let res = new Array(FM.operatorNum);
    for (let x = 0; x < FM.operatorNum; x++) res[x] = this.getRatio(x);
    return res;
  }
  static getLocalStrageADSRKey(index) { return 'FMADSR' + index; }
  setADSR(index, val) {
    localStorage[FM.getLocalStrageADSRKey(index)] = val;
    this.adsr[index] = val;
  }
  static getLocalStrageSliderKey(x, y) { return 'FMSliderVal' + x + ',' + y; }
  setSliderVal(x, y, val) {
    localStorage[FM.getLocalStrageSliderKey(x, y)] = val;
    this.sliderVals[x][y] = val;
  }
  createInfo(hz, startTime, endTime) {
    return new FMInfo(
        hz, this.getOperators(), this.getVolumes(), this.getRatios(), this.adsr,
        startTime, endTime);
  }
  getNowT() {
    return Math.round(
               new Date().getTime() / 1000 * FM.sampleRate /
               this.oneTimeLength) *
        this.oneTimeLength;
  }
  process(e) {
    let data = e.outputBuffer.getChannelData(0);
    data.fill(0);  // chrome💢
    for (const id in this.receivedInfos) {
      for (const hz in this.receivedInfos[id]) {
        if (id == this.id) {
          // 自分のなら上書き
          let info = this.receivedInfos[id][hz];
          info.operators = this.getOperators();
          info.volumes = this.getVolumes();
          info.ratios = this.getRatios();
          info.adsr = this.adsr;
        }
        this.receivedInfos[id][hz].calc(this.t, data);
      }
    }
    for (let i = 0; i < data.length; i++) this.oneTimeData[i] = data[i];
    if (Math.random() < 0.1) {
      this.t = this.getNowT();
    } else {
      this.t += data.length;
    }
  }
  play() { this.node.connect(this.context.destination); }
  pause() { this.node.disconnect(); }
  regist(hz) {
    if (hz in this.released && !this.released[hz]) return;
    const now = this.t / FM.sampleRate;
    if (hz in this.infos && this.infos[hz].endTime >= now) return;
    this.released[hz] = false;
    this.infos[hz] = this.createInfo(hz, now, now + this.sustainTime);
    this.sendSocketMessage({status: 'regist', info: this.infos[hz]});
  }
  release(hz) {
    this.released[hz] = true;
    this.infos[hz].endTime =
        Math.min(this.t / FM.sampleRate, this.infos[hz].endTime);
    this.sendSocketMessage({status: 'release', info: this.infos[hz]});
  }
  sendSocketMessage(status) {
    status.id = this.id;
    this.socket.emit('send_message', JSON.stringify(status));
  }
  receivedSocketMessage(text) {
    try {
      const json = JSON.parse(text);
      const id = json.id;
      const hz = json.info.hz;
      if (!(id in this.receivedInfos)) {
        this.receivedInfos[id] = {};
      }
      if (json.status === 'regist') {
        this.receivedInfos[id][hz] = FMInfo.create(json.info);
      } else if (json.status === 'release') {
        this.receivedInfos[id][hz].endTime = json.info.endTime;
      }
    } catch (e) {
      console.log(e);
    }
  }
}
