'use strict'
// TODO: Safari のkeycode
class FM {
  static get sampleRate() { return 44100; }
  constructor() {
    this.t = 0;
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    this.context.samplingRate = FM.sampleRate;
    this.node = this.context.createScriptProcessor(256, 1, 1);
    this.node.onaudioprocess = (e) => { this.process(e) };
    this.pressed = {};
  }
  process(e) {
    let data = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < data.length; ++i, this.t++) {
      data[i] = 0;  // chrome💢
      for (const hz in this.pressed) {
        if (this.pressed[hz] === 1)
          data[i] += Math.sin(hz * this.t / FM.sampleRate);
      }
    }
  }
  play() { this.node.connect(this.context.destination); }
  pause() { this.node.disconnect(); }
  regist(key) { this.pressed[key] = 1; }
  release(key) { this.pressed[key] = 0; }
  static index2hx(i, base = 261.6) {
    return base * Math.pow(2, i / 12) * 2 * Math.PI;
  }
}
class PianoInterface {
  constructor(fm) {
    this.fm = fm;
    this.createKeys();
  }
  createKeys() {
    const piano = document.getElementById('piano');
    const isSharp = '010100101010';
    const keyboard = 'awsedftgyhujkolp;:[]';
    const codes =
        ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    for (let i = 0; i < keyboard.length; i++) {
      const key = document.createElement('span');
      const m_key = keyboard[i].toUpperCase();
      const m_code = codes[i % codes.length] + Math.floor(i / 12 + 4);
      const m_isSharp = isSharp[i % isSharp.length];
      piano.appendChild(key);
      key.classList.add('pianokey');
      key.innerText = m_code + '\n' + m_key;
      if (m_isSharp === '1') key.classList.add('sharp');
      const hz = FM.index2hx(i);
      const press = () => {
        this.fm.regist(hz);
        key.classList.add('pianoshadow');
      };
      const release = () => {
        this.fm.release(hz);
        key.classList.remove('pianoshadow');
      };
      key.addEventListener('mouseenter', press);
      key.addEventListener('mouseleave', release);
      document.addEventListener(
          'keydown', (e) => { e.key === keyboard[i] && press(); });
      document.addEventListener(
          'keyup', (e) => { e.key === keyboard[i] && release(); });
    }
  }
}
const fm = new FM();
const pianoInterface = new PianoInterface(fm);
fm.play();
