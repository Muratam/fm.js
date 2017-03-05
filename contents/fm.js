'use strict'
// TODO: Safari のkeycode
// 全然いい感じの(無料の)FM音源サイトがない…！
// http://www.hikari-ongaku.com/study/fm.html
// http://www.geocities.jp/brotherasazuke/sakekanworks/fm/16.htm
// http://qiita.com/fukuroder/items/e1c2708222bbb51c7634
//   https://synth-voice.sakura.ne.jp/synth-voice/html5/voice-lab00.html


class FMInfo {
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
  calc(t, data) {
    if (t / FM.sampleRate > this.endTime + this.adsr[3]) return;
    const toFq = (t) => 2 * Math.PI * t;
    const getM = (x, y) => {
      const val = this.operators[x][y] / 200 * 100;
      return val * val / FM.sampleRate * 2 / (x === y ? 2 : 1);
    };
    let gs = new Array(FM.operatorNum);
    let ps = new Array(FM.operatorNum);
    gs.fill(0);
    for (let i = 0; i < data.length; ++i, t++) {
      const now = (t * this.hz / FM.sampleRate);
      let sum = 0;
      for (let j = 0; j < FM.operatorNum; j++) ps[j] = gs[j];
      for (let x = 0; x < FM.operatorNum; x++) {
        let gsum = 0;
        for (let y = 0; y < FM.operatorNum; y++) {
          gsum += getM(x, y) * ps[y];
        }
        gs[x] = Math.sin(toFq(now * this.ratios[x] + gsum));
        sum += gs[x] * this.volumes[x] / 200;
      }
      data[i] += sum / 3 * this.byADSR(t / FM.sampleRate);
    }
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
class FM {
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
    this.t = 0;
    this.id = new Date().getTime();
    this.socket = io();
    this.socket.on(
        'receive_message', (text) => {this.receivedSocketMessage(text)});
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.context.samplingRate = FM.sampleRate;
    this.oneTimeLength = 2048;
    this.node = this.context.createScriptProcessor(this.oneTimeLength, 1, 1);
    this.node.onaudioprocess = (e) => { this.process(e) };
    this.gs = new Array(FM.operatorNum);
    this.oneTimeData = new Array(this.oneTimeLength);
    this.sliderVals = FM.makeMatrix(FM.operatorNum + 2);
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
  getVolume(x) { return this.sliderVals[x][FM.operatorNum]; }
  getVolumes() {
    let res = new Array(FM.operatorNum);
    for (let x = 0; x < FM.operatorNum; x++) res[x] = this.getVolume(x);
    return res;
  }
  getRatio(x) { return this.sliderVals[x][FM.operatorNum + 1]; }
  getRatios() {
    let res = new Array(FM.operatorNum);
    for (let x = 0; x < FM.operatorNum; x++) res[x] = this.getRatio(x);
    return res;
  }
  findADSR() {
    let adsr = new Array(4);
    for (let i = 0; i < 4; i++) {
      adsr[i] = $('#adsr' + i).slider()[0].value;
    }
    return adsr;
  }
  setSliderVal(x, y, val) { this.sliderVals[x][y] = val; }
  createInfo(hz, startTime, endTime) {
    return new FMInfo(
        hz, this.getOperators(), this.getVolumes(), this.getRatios(),
        this.findADSR(), startTime, endTime);
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
          info.adsr = this.findADSR();
        }
        this.receivedInfos[id][hz].calc(this.t, data);
      }
    }
    for (let i = 0; i < data.length; i++) this.oneTimeData[i] = data[i];
    this.t += data.length;
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
// FM <= regist & release hz
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
// FM => (Amplitude created)adsr
class AmplitudeView {
  get noteNum() { return 20; }
  constructor(fm) {
    this.fm = fm;
    this.canvas = document.getElementById('amplitude');
    if (!this.isOK()) return false;
    this.ctx = this.canvas.getContext('2d');
    [this.w, this.h] = [this.canvas.width, this.canvas.height];
    this.begin();
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
// FM <= fm.sliderVals
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
            drag: (e) => { this.fm.setSliderVal(x, y, e.value); },
            change: (e) => { this.fm.setSliderVal(x, y, e.value); }
          };
          if (y === FM.operatorNum) {
            property.max = 100;
            property.width = 11;
          } else if (y === FM.operatorNum + 1) {
            property.max = 11.0;
            property.min = 0.0125;
            property.value = 1;
            property.tooltipFormat = (a) => 'x' + a.value;
            property.step = 0.0001;
          } else if (y === FM.operatorNum + 2) {
            property.max = 400;
            property.min = 0;
            property.value = 0;
            property.step = 2;
          } else {
            property.tooltipFormat = (a) => a.value + '';
          }
          if (x === 0 && y === FM.operatorNum) {
            property.value = property.max;
          }
          if (y <= FM.operatorNum) slider[0].classList.add('tuner');
          slider.roundSlider(property);
          this.fm.setSliderVal(x, y, property.value);
        })(x, y);
        sliderContainer.appendChild(slider[0]);
      }
      fmsliders.appendChild(sliderContainer);
    }
    //$('.tuner .edit').removeClass('edit');
    $('.edit').removeClass('edit');
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
class VPianoView extends Vue {
  //<div id="vpiano">
  //    <vpiano-key v-for="p in pianos()" :code="p.code" :keyboard="p.keyboard"
  //    :issharp="p.issharp" :hz="p.hz" :fm="p.fm">
  //    </vpiano-key>
  //</div>
  constructor(fm, el = '#vpiano') {
    const pianokey = {
      props: ['code', 'keyboard', 'issharp', 'hz', 'ispressed', 'fm'],
      template: `
            <span class="piano-key"
                  :class="{'sharp' :issharp,'piano-press':ispressed}"
                  @mouseenter="press" @mouseleave="release">
              {{code}}<br>{{ keyboard.toUpperCase() }}
            </span>`,
      created() {
        document.addEventListener(
            'keydown', (e) => e.key === this.keyboard && this.press());
        document.addEventListener(
            'keyup', (e) => e.key === this.keyboard && this.release());
      },
      methods: {
        press() {
          this.fm.regist(this.hz);
          this.ispressed = true;
        },
        release() {
          this.fm.release(this.hz);
          this.ispressed = false;
        },
      },
    };
    Vue.component('vpiano-key', pianokey);
    super({
      el: el,
      data() {
        return {
          isSharps: '010100101010',
          keys: 'awsedftgyhujkolp;:[]',
          codes:
              ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
          fm: fm
        };
      },
      methods: {
        keyboardNum() { return this.keys.length; },
        create(i) {
          return {
            code: this.codes[i % this.codes.length] + Math.floor(i / 12 + 4),
            keyboard: this.keys[i],
            issharp: this.isSharps[i % this.isSharps.length] == 1,
            hz: FM.index2hx(i),
            fm: fm,
          };
        },
        pianos() {
          let res = [...Array(this.keys.length).keys()].map(this.create);
          console.log(res);
          return res;
        },
        template: `
          <div id="${el}">
            <vpiano-key v-for="p in pianos()"
              :code="p.code" :keyboard="p.keyboard"
              :issharp="p.issharp" :hz="p.hz" :fm="p.fm">
            </vpiano-key>
          </div>`,
      }
    });
  }
}
const fm = new FM();
const vpianoView = new VPianoView(fm);
const pianoView = new PianoView(fm);
const fmSliderView = new FMSliderView(fm);
const amplitudeView = new AmplitudeView(fm);