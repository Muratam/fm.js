'use strict'
// TODO: Safari のkeycode
// key.innerHTML = '<small>' + m_code + '</small><br>' + m_key.toUpperCase();
console.assert($);
let vue = new Vue({el: '#FMJS', data: {title: 'FM.js'}});
vue.title = '-----FM.js------';

class FM {
  static get operatorNum() { return 6; }
  static get sampleRate() { return 44100; }
  constructor() {
    this.t = 0;
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.context.samplingRate = FM.sampleRate;
    this.node = this.context.createScriptProcessor(512, 1, 1);
    this.node.onaudioprocess = (e) => { this.process(e) };
    this.pressed = {};
    this.play();
    this.sliderVals = [];
    for (let x = 0; x < FM.operatorNum; x++) {
      this.sliderVals.push([]);
      for (var y = 0; y < FM.operatorNum; y++) {
        this.sliderVals[x].push(0);
      }
    }
  }
  process(e) {
    const [a, m] = [200, 100];
    let data = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < data.length; ++i, this.t++) {
      data[i] = 0;  // chrome💢
      for (const hz in this.pressed) {
        if (this.pressed[hz] !== 1) continue;
        const now = 2 * Math.PI * this.t / FM.sampleRate;
        const g1 = Math.sin(now * hz);
        data[i] += Math.sin(now * hz + g1 * this.sliderVals[0][0]);
      }
    }
  }
  play() { this.node.connect(this.context.destination); }
  pause() { this.node.disconnect(); }
  regist(key) { this.pressed[key] = 1; }
  release(key) { this.pressed[key] = 0; }
  static index2hx(i, base = 523.3) { return base * Math.pow(2, i / 12); }
}
class PianoInterface {
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
      const m_code = codes[i % codes.length] + Math.floor(i / 12 + 5);
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
class PianoRoll {
  get noteNum() { return 20; }
  constructor(fm) {
    this.fm = fm;
    this.canvas = document.getElementById('pianoroll');
    if (!this.isOK()) return false;
    [this.w, this.h] = [this.canvas.width, this.canvas.height];
    this.canvas.height *= 2;
    this.canvas.width *= 2;
    this.canvas.style.height = Math.floor(this.h / 2);
    this.canvas.style.width = Math.floor(this.w / 2);
    this.ctx = this.canvas.getContext('2d');
    [this.w, this.h] = [this.canvas.width, this.canvas.height];
  }
  isOK() { return this.canvas && this.canvas.getContext; }
  renderBackGround() {
    this.ctx.lineWidth = 2;
    this.ctx.imageSmoothingEnabled = false;
    for (let i = 0; i < this.noteNum; i++) {
      this.ctx.beginPath();
      const y = i * this.h / this.noteNum;
      this.ctx.moveTo(0.5, y + 0.5);
      this.ctx.lineTo(this.w + 0.5, y + 0.5);
      this.ctx.stroke();
    }
  }
  begin() {
    if (!this.isOK()) return;
    let x = 0;
    const renderLoop = () => {
      this.ctx.clearRect(0, 0, this.w, this.h);
      this.renderBackGround();
      this.ctx.beginPath();
      this.ctx.strokeRect(x, 0, 10, 10);
      x = x < 0 ? this.w : x - 1;
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
  }
}
class FMSliderInterface {
  constructor(fm) {
    this.fm = fm;
    this.createFMSliders();
  }
  createFMSliders() {
    const fmsliders = $('#fmsliders')[0];
    for (let x = 0; x < FM.operatorNum; x++) {
      const sliderContainer = $('<div class="slider-container"></div>')[0];
      for (let y = 0; y < FM.operatorNum; y++) {
        const slider = $('<div class="slider"></div>');
        ((x, y) => {
          slider.roundSlider({
            radius: 22,
            width: 11,
            handleSize: '+11',
            handleShape: 'dot',
            circleShape: 'pie',
            sliderType: 'min-range',
            value: 0,
            min: 0,
            max: 255,
            startAngle: -45,
            drag: (e) => { this.fm.sliderVals[x][y] = e.value; },
            change: (e) => { this.fm.sliderVals[x][y] = e.value; }
          });
        })(x, y);
        sliderContainer.appendChild(slider[0]);
      }
      fmsliders.appendChild(sliderContainer);
    }
    $('.edit').removeClass('edit');
  }
}

const fm = new FM();
const pianoInterface = new PianoInterface(fm);
const fmsliderInterface = new FMSliderInterface(fm);
const pianoRoll = new PianoRoll(fm);

pianoRoll.begin();
