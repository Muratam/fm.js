'use strict'
// TODO: Safari のkeycode
// http://www.hikari-ongaku.com/study/fm.html
// http://www.geocities.jp/brotherasazuke/sakekanworks/fm/16.htm
// http://qiita.com/fukuroder/items/e1c2708222bbb51c7634
// https://synth-voice.sakura.ne.jp/synth-voice/html5/voice-lab00.html
console.assert($);
((d, s, id) => {
  let js, fjs = d.getElementsByTagName(s)[0],
          p = /^http:/.test(d.location) ? 'http' : 'https';
  if (!d.getElementById(id)) {
    js = d.createElement(s);
    js.id = id;
    js.src = p + '://platform.twitter.com/widgets.js';
    fjs.parentNode.insertBefore(js, fjs);
  }
})(document, 'script', 'twitter-wjs');

// let vue = new Vue({el: '#FMJS', data: {title: 'FM.js'}});
// vue.title = 'fm.js';

class FM {
  static get operatorNum() { return 6; }
  static get sampleRate() { return 44100; }
  makeMatrix(dim) {
    let res = [];
    for (let x = 0; x < dim; x++) {
      res.push([]);
      for (let y = 0; y < dim; y++) res[x].push(0);
    }
    return res;
  }
  constructor() {
    this.t = 0;
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.context.samplingRate = FM.sampleRate;
    this.oneTimeLength = 2048;
    this.node = this.context.createScriptProcessor(this.oneTimeLength, 1, 1);
    this.node.onaudioprocess = (e) => { this.process(e) };
    this.gs = new Array(FM.operatorNum);
    this.oneTimeData = new Array(this.oneTimeLength);
    this.sliderVals = this.makeMatrix(FM.operatorNum + 2);
    this.adsr = [0.2, 0.05, 0.9, 0.2];  // a,d,r in [0,2] |s in [0,1]
    this.sustainTime = 20;
    this.startTime = {};
    this.endTime = {};
    this.released = {};
    this.play();
  }
  byADSR(a, d, s, r, startTime, endTime, now) {
    let t = now - startTime;
    if (t < 0) return 0;
    if (t < a) return t / a;
    t -= a;
    if (t < d) return s + (1 - s) * (1 - t / d);
    t = now - endTime;
    if (t < 0) return s;
    if (t < r) return s * (1 - t / r);
    return 0;
  }
  calc(hz, t, data) {
    const toFq = (t) => 2 * Math.PI * t;
    const getM = (x, y) => {
      const val = this.sliderVals[x][y] / 200 * 100;
      return val * val / FM.sampleRate * 2 / (x === y ? 2 : 1);
    };
    let gs = new Array(FM.operatorNum);
    let ps = new Array(FM.operatorNum);
    const [a, d, s, r] = this.adsr;
    gs.fill(0);
    for (let i = 0; i < data.length; ++i, t++) {
      const now = (t * hz / FM.sampleRate);
      let sum = 0;
      for (let j = 0; j < FM.operatorNum; j++) ps[j] = gs[j];
      for (let x = 0; x < FM.operatorNum; x++) {
        let gsum = 0;
        for (let y = 0; y < FM.operatorNum; y++) {
          gsum += getM(x, y) * ps[y];
        }
        gs[x] =
            Math.sin(toFq(now * this.sliderVals[x][FM.operatorNum + 1] + gsum));
        sum += gs[x] * this.sliderVals[x][FM.operatorNum] / 200;
      }
      const adsr = this.byADSR(
          a, d, s, r, this.startTime[hz], this.endTime[hz], t / FM.sampleRate);
      data[i] += adsr * sum / 3;
    }
  }
  findADSR() {
    for (let i = 0; i < 4; i++) {
      this.adsr[i] = $('#adsr' + i).slider()[0].value;
    }
  }
  process(e) {
    this.findADSR();
    let data = e.outputBuffer.getChannelData(0);
    data.fill(0);  // chrome💢
    for (const hz in this.endTime) {
      if (this.t / FM.sampleRate > this.endTime[hz] + this.adsr[3]) continue;
      this.calc(hz, this.t, data);
    }
    for (let i = 0; i < data.length; i++) this.oneTimeData[i] = data[i];
    this.t += data.length;
  }
  play() { this.node.connect(this.context.destination); }
  pause() { this.node.disconnect(); }
  regist(hz) {
    const now = this.t / FM.sampleRate;
    if (hz in this.endTime && this.endTime[hz] >= now) return;
    if (hz in this.released && !this.released[hz]) return;
    this.startTime[hz] = now;
    this.endTime[hz] = now + this.sustainTime;
    this.released[hz] = false;
  }
  release(hz) {
    this.endTime[hz] = Math.min(this.t / FM.sampleRate, this.endTime[hz]);
    this.released[hz] = true;
  }
  static index2hx(i, base = 261.2) { return base * Math.pow(2, i / 12); }
}
class PianoView {
  constructor(fm) {
    this.fm = fm;
    this.createKeys();
  }
  createKeys() {
    const piano = $('#piano')[0];
    const isSharp = '010100101010';
    const keyboard = 'awsedftgyhujkolp;:[]';
    const codes =
        ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    for (let i = 0; i < keyboard.length; i++) {
      const m_key = keyboard[i];
      const m_code = codes[i % codes.length] + Math.floor(i / 12 + 4);
      const m_isSharp = isSharp[i % isSharp.length];
      const hz = FM.index2hx(i);
      const key = $(
          `<span class="piano-key">${m_code}<br>${m_key.toUpperCase()}</span>`)
          [0];
      piano.appendChild(key);
      if (m_isSharp === '1') key.classList.add('sharp');
      const press = () => {
        this.fm.regist(hz);
        key.classList.add('piano-press');
      };
      const release = () => {
        this.fm.release(hz);
        key.classList.remove('piano-press');
      };
      key.addEventListener('mouseenter', press);
      key.addEventListener('mouseleave', release);
      document.addEventListener(
          'keydown', (e) => { e.key === m_key && press(); });
      document.addEventListener(
          'keyup', (e) => { e.key === m_key && release(); });
    }
  }
}
class AmplitudeView {
  get noteNum() { return 20; }
  constructor(fm) {
    this.fm = fm;
    this.canvas = document.getElementById('amplitude');
    if (!this.isOK()) return false;
    this.ctx = this.canvas.getContext('2d');
    [this.w, this.h] = [this.canvas.width, this.canvas.height];
  }
  isOK() { return this.canvas && this.canvas.getContext; }
  renderBackGround() {
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = '#3be';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.h * 0.5);
    for (let i = 0; i < this.fm.oneTimeData.length / 2; i++) {
      const val = this.fm.oneTimeData[i];
      const x = this.w * i / this.fm.oneTimeData.length * 2;
      const y = this.h * (val + 0.5);
      this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
  }
  begin() {
    if (!this.isOK()) return;
    const renderLoop = () => {
      this.ctx.clearRect(0, 0, this.w, this.h);
      this.renderBackGround();
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
  }
}
class FMSliderView {
  constructor(fm) {
    this.fm = fm;
    this.createFMSliders();
    this.createADSRSldiers();
  }
  createFMSliders() {
    const fmsliders = $('#fmsliders')[0];
    for (let x = 0; x < FM.operatorNum; x++) {
      const sliderContainer = $('<div class="slider-container"></div>')[0];
      for (let y = 0; y < FM.operatorNum + 2; y++) {
        const slider = $('<div class="slider"></div>');
        ((x, y) => {
          let property = {
            radius: 22,
            width: 5,
            handleSize: '+11',
            handleShape: 'dot',
            circleShape: 'pie',
            sliderType: 'min-range',
            value: 0,
            min: 0,
            max: 200,
            startAngle: -45,
            drag: (e) => { this.fm.sliderVals[x][y] = e.value; },
            change: (e) => { this.fm.sliderVals[x][y] = e.value; }
          };
          if (y === FM.operatorNum) {
            property.max = 100;
            property.width = 11;
          } else if (y === FM.operatorNum + 1) {
            property.max = 11.0;
            property.min = 0.0125;
            this.fm.sliderVals[x][y] = property.value = 1;
            property.tooltipFormat = (a) => 'x' + a.value;
            property.step = 0.0001;
          } else if (y === FM.operatorNum + 2) {
            property.max = 400;
            property.min = 0;
            this.fm.sliderVals[x][y] = property.value = 0;
            property.step = 2;
          } else {
            property.tooltipFormat = (a) => a.value + '';
          }
          if (x === 0 && y === FM.operatorNum)
            this.fm.sliderVals[x][y] = property.value = property.max;
          if (y <= FM.operatorNum) slider[0].classList.add('tuner');
          slider.roundSlider(property);
        })(x, y);
        sliderContainer.appendChild(slider[0]);
      }
      /*
      sliderContainer.appendChild($(
          '<input type="range" value="0.1" min="0" max="1"
      step="0.1">0.5</input>')
                                      [0]);*/
      fmsliders.appendChild(sliderContainer);
    }
    $('.tuner .edit').removeClass('edit');
  }
  createADSRSldiers() {
    const fmsliderAdsr = $('#fmslider-adsr')[0];
    const defaultADSR = [0.2, 0.05, 0.9, 0.2];  // a,d,r in [0,2] |s in [0,1]
    for (let i = 0; i < 4; i++) {
      const slider = $(
          `<div id="adsr${i}" class="adsr" data-slider-min="0" data-slider-max="1" data-slider-step="0.001" data-slider-value="0.8" data-slider-orientation= "vertical" > </div>`);
      fmsliderAdsr.appendChild(slider[0]);
      $('#adsr' +
        i).slider({reversed: true, tooltip: 'always', value: defaultADSR[i]});
    }
  }
}
const fm = new FM();
const pianoInterface = new PianoView(fm);
const fmsliderInterface = new FMSliderView(fm);
const amplitude = new AmplitudeView(fm);
amplitude.begin();
