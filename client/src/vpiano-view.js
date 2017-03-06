import FM from './fm';
import $ from 'jquery';
import Vue from 'vue';

export default class VPianoView {
  constructor(fm, name = 'piano') {
    Vue.component(name, {
      components: {
        pianokey: {
          props: ['msg'],
          template: `<span class="piano-key"">
              {{msg}}<br>{{ msg }}
            </span>`,
        }
      },
      data() { return {msg: 'VPiano'}; },
      methods: {
        log() {
          this.msg += 'h ';
          console.log(fm);
        }
      },
      template: `
      <div>
        <pianokey v-for="p in 10" :msg=p>
        </pianokey>
      </div>
      `,
    });
  }
  /*
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
  }*/
}
