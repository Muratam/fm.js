import FM from './fm';
import $ from 'jquery';
import Vue from 'vue';

export default class VPianoView {
  constructor(fm, name = 'piano') {
    const isSharps = '010100101010';
    const keys = 'awsedftgyhujkolp;:[]';
    const codes =
        ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const keyboardNum = keys.length;

    Vue.component(name, {
      components: {
        pianokey: {
          created() {
            document.addEventListener(
                'keydown', (e) => e.key === this.keyboard && this.press());
            document.addEventListener(
                'keyup', (e) => e.key === this.keyboard && this.release());
          },
          props: ['code', 'keyboard', 'issharp', 'hz', 'ispressed', 'fm'],
          template: `
          <span class="piano-key"
                :class="{'sharp' :issharp,'piano-press':ispressed}"
                @mouseenter="press" @mouseleave="release">
            {{code}}<br>{{ keyboard.toUpperCase() }}
          </span>`,
          methods: {
            press() {
              fm.regist(this.hz);
              this.ispressed = true;
            },
            release() {
              fm.release(this.hz);
              this.ispressed = false;
            },
          },
        }
      },
      methods: {
        create(i) {
          return {
            code: codes[i % codes.length] + Math.floor(i / 12 + 4),
            keyboard: keys[i],
            issharp: isSharps[i % isSharps.length] == 1,
            hz: FM.index2hx(i),
            fm: fm,
          };
        },
        pianos() { return [...Array(keys.length).keys()].map(this.create); },
      },
      template: `
      <div class="piano">
        <pianokey  v-for="p in pianos()"
            :code="p.code" :keyboard="p.keyboard"
            :issharp="p.issharp" :hz="p.hz" :fm="p.fm">
        </pianokey>
      </div>
      `,
    });
  }
}
