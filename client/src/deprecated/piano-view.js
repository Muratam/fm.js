import FM from './fm';
import $ from 'jquery';


export default class PianoView {
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
