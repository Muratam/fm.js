import $ from 'jquery';
import io from 'socket.io-client';
import * as underscore from 'underscore';
import parse from 'url-parse';

import {renderNotesTime} from './amplitude-view';
import FMInfo from './fm-info';

export default class FM {
  static get maxSameTimeTuneNum() {
    return 16;
  }
  static get operatorNum() {
    return 6;
  }
  static get sampleRate() {
    return 44100;
  }
  static get pianoKeys() {
    return 'awsedftgyhujkolp;:[]';
  }
  static get sliderDim() {
    return FM.operatorNum + 2;
  }
  static calcTimeMS(func, name = '') {
    const start = new Date().getTime();
    func();
    let time = new Date().getTime() - start;
    console.log([name, time]);
  }
  static get baseHz() {
    return 261.2;
  }
  static id2hsl_h(id) {
    return id % 360;
  }
  static index2hz(i) {
    return FM.baseHz * Math.pow(2, i / 12);
  }
  static hz2index(hz) {
    return 12 * Math.log2(hz / FM.baseHz);
  }
  static makeMatrix(dim) {
    let res = new Array(dim);
    for (let x = 0; x < dim; x++) {
      res[x] = new Array(dim);
      res[x].fill(0);
    }
    return res;
  }
  constructor() {
    this.socket = io(window.location.origin, {path: '/fmsocket'});
    this.socket.on(
        'receive_message', (text) => {this.receivedSocketMessage(text)});
    this.socket.on('fix_time', (text) => {this.fixTimeSocketMessage(text)});
    this.fixTimeFunction = () => {
      this.socket.emit(
          'fix_time', JSON.stringify({id: this.id, pre: new Date().getTime()}));
      setTimeout(this.fixTimeFunction, 5000);
    };
    this.fixTimeFunction();

    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.context.samplingRate = FM.sampleRate;
    this.oneTimeLength = 2048;
    this.t = this.getNowT();
    this.id = new Date().getTime();
    this.node = this.context.createScriptProcessor(this.oneTimeLength, 1, 1);
    this.node.onaudioprocess = (e) => {
      this.process(e)
    };
    this.gs = new Array(FM.operatorNum);
    this.oneTimeData = new Array(this.oneTimeLength);
    this.sliderVals = FM.makeMatrix(FM.sliderDim);
    this.adsr = [0.2, 0.05, 0.9, 0.2];
    this.released = {};
    this.sustainTime = 20;
    this.receivedInfos = new Map();
    this.preReceiveds = [];
    this.infos = {};
    this.delayedTime = 0;
    this.play();
  }
  getOperator(x, y) {
    return this.sliderVals[x][y];
  }
  getOperators() {
    let res = FM.makeMatrix(FM.operatorNum);
    for (let x = 0; x < FM.operatorNum; x++) {
      for (let y = 0; y < FM.operatorNum; y++) {
        res[x][y] = this.getOperator(x, y);
      }
    }
    return res;
  }
  getVolume(y) {
    return this.sliderVals[FM.operatorNum][y];
  }
  getVolumes() {
    let res = new Array(FM.operatorNum);
    for (let x = 0; x < FM.operatorNum; x++) res[x] = this.getVolume(x);
    return res;
  }
  getRatio(y) {
    return this.sliderVals[FM.operatorNum + 1][y];
  }
  getRatios() {
    let res = new Array(FM.operatorNum);
    for (let x = 0; x < FM.operatorNum; x++) res[x] = this.getRatio(x);
    return res;
  }
  static getCurrentHistory() {
    try {
      let mat = JSON.parse(parse(location.href, true).query.mat);
      for (let x = 0; x < mat.length; x++) {
        for (let y = 0; y < mat[x].length; y++) {
          if (typeof (mat[x][y]) !== 'number') throw 'mat bad type';
        }
        if (mat[x].length !== FM.sliderDim) throw 'mat bad length';
      }
      if (mat.length !== FM.sliderDim) throw 'mat bad length';
      let adsr = JSON.parse(parse(location.href, true).query.adsr);
      for (const adsr_i of adsr) {
        if (typeof (adsr_i) !== 'number') throw 'adsr bad type';
      }
      if (adsr.length !== 4) throw 'adsr length bad';
      return {mat: mat, adsr: adsr};
    } catch (e) {
      console.log(e);
      history.replaceState('', '', './');
      return {mat: undefined, adsr: undefined};
    }
  }
  replaceHistory() {
    if (!('replaceHistoryDebounced' in this)) {
      this.replaceHistoryDebounced = underscore.debounce(function() {
        let newState = `./?mat=${JSON.stringify(this.sliderVals)}&adsr=${
            JSON.stringify(this.adsr)}`;
        history.replaceState('', '', newState);
        if (window.twttr) {
          $(`.twitter-share-button`).replaceWith(`
            <a href="https://twitter.com/share"
              class="twitter-share-button"
              data-url="${encodeURI(location.href)}"
              data-text="fm.jsで音を創ってみた！ "></a>`);
          twttr.widgets.load();
        }
      }, 1000);
    }
    this.replaceHistoryDebounced();
  }

  setADSR(index, val, replaceHistory = true) {
    this.adsr[index] = val;
    if (replaceHistory) this.replaceHistory();
  }
  setSliderVal(x, y, val, replaceHistory = true) {
    this.sliderVals[x][y] = val;
    if (replaceHistory) this.replaceHistory();
  }
  createInfo(hz, startTime, endTime) {
    return new FMInfo(
        hz, this.getOperators(), this.getVolumes(), this.getRatios(), this.adsr,
        startTime, endTime);
  }
  getNowT() {
    return Math.round(
               (new Date().getTime() / 1000 - this.delayedTime) *
               FM.sampleRate / this.oneTimeLength) *
        this.oneTimeLength;
  }
  process(e) {
    let data = e.outputBuffer.getChannelData(0);
    data.fill(0);
    let allowTime =
        new Date().getTime() + data.length / FM.sampleRate * 1000 * 0.85;
    (() => {
      if (this.id in this.receivedInfos) {
        let id = this.id;
        for (const hz in this.receivedInfos[id]) {
          let info = this.receivedInfos[id][hz];
          info.operators = this.getOperators();
          info.volumes = this.getVolumes();
          info.ratios = this.getRatios();
          info.adsr = this.adsr;
          info.calc(this.t, data);
          if (allowTime - new Date().getTime() < 0) return;
        }
      }
      for (const id in this.receivedInfos) {
        for (const hz in this.receivedInfos[id]) {
          if (id == this.id) continue;
          this.receivedInfos[id][hz].calc(this.t, data);
          if (allowTime - (new Date().getTime()) < 0) return;
        }
      }
    })();
    for (let i = 0; i < data.length; i++) this.oneTimeData[i] = data[i];
    if (Math.random() < 0.1) {
      this.t = this.getNowT();
    } else {
      this.t += data.length;
    }
  }
  play() {
    this.node.connect(this.context.destination);
  }
  pause() {
    this.node.disconnect();
  }
  regist(hz) {
    if (hz in this.released && !this.released[hz]) return;
    const now = this.getNowT() / FM.sampleRate;
    if (hz in this.infos && this.infos[hz].endTime >= now) return;
    this.released[hz] = false;
    this.infos[hz] = this.createInfo(hz, now, now + this.sustainTime);
    this.sendSocketMessage({status: 'regist', info: this.infos[hz]});
  }
  release(hz) {
    this.released[hz] = true;
    this.infos[hz].endTime =
        Math.min(this.getNowT() / FM.sampleRate, this.infos[hz].endTime);
    this.sendSocketMessage({status: 'release', info: this.infos[hz]});
  }
  sendSocketMessage(status) {
    status.id = this.id;
    this.socket.emit('send_message', JSON.stringify(status));
  }
  fixTimeSocketMessage(text) {
    try {
      const json = JSON.parse(text);
      if (json.id === this.id) {
        this.delayedTime =
            ((json.pre + (new Date().getTime())) / 2 - json.now) / 1000;
      }
    } catch (e) {
      console.log(e);
    }
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
        const startTime = this.receivedInfos[id][hz].startTime;
        const endTime = json.info.endTime;
        this.receivedInfos[id][hz].endTime = endTime;
        this.preReceiveds.unshift([id, hz, startTime, endTime]);
        const now = this.getNowT() / FM.sampleRate;
        this.preReceiveds = this.preReceiveds.filter((v) => {
          return renderNotesTime - (now - v[3]) > 0;
        });
      }
    } catch (e) {
      console.log(e);
    }
  }
}
