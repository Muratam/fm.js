import FM from './fm';
import Vue from 'vue';
import keyIDs from './keyids';

export default function(fm) {
  const isSharps = '010100101010';
  const keys = FM.pianoKeys;
  const codes =
      ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const keyboardNum = keys.length;
  return {
    methods: {
      pianos() {
        return [...Array(keys.length).keys()].map(i => {
          return {
            code: codes[i % codes.length] + Math.floor(i / 12 + 4),
            keyboard: keys[i],
            issharp: isSharps[i % isSharps.length] == 1,
            hz: FM.index2hz(i),
          }
        });
      },
    },
    template: `
      <div class="piano">
        <pianokey  v-for="p in pianos()"
            :code="p.code" :keyboard="p.keyboard"
            :issharp="p.issharp" :hz="p.hz">
        </pianokey>
      </div>
      `,
    components: {
      pianokey: {
        created() {
          document.addEventListener(
              'keydown',
              (e) => (e.key || keyIDs[e.keyIdentifier]) === this.keyboard &&
                  this.press());
          document.addEventListener(
              'keyup',
              (e) => (e.key || keyIDs[e.keyIdentifier]) === this.keyboard &&
                  this.release());
        },
        props: ['code', 'keyboard', 'issharp', 'hz'],
        data() { return {ispressed: false}; },
        template: `
          <div class="piano-key"
                :class="{'sharp' :issharp,'piano-press':ispressed}"
                @mousedown="press" @mouseup="release" @mouseleave="release">
            <div>{{code}}<br>{{ keyboard.toUpperCase() }}</div>
          </div>`,
        methods: {
          press() {
            fm.regist(this.hz);
            this.ispressed = true;
          },
          release() {
            if (!this.ispressed) return;
            fm.release(this.hz);
            this.ispressed = false;
          },
        },
      }
    },
  };
}
