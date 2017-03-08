import Vue from 'vue';
import FM from './fm';
export const strokeColor = '#999';
export const lineWidth = 2;
export const renderNotesTime = 5.0;

export default function(fm) {
  return {
    template: `<canvas class="amplitude"></canvas>`,
    mounted() {
      let canvas = this.$el;
      let ctx = canvas.getContext('2d');
      const renderLoop = () => {
        let [w, h] = [canvas.width, canvas.height];
        ctx.clearRect(0, 0, w, h);
        this.renderAmplitude(ctx, w, h);
        this.renderNotes(ctx, w, h);
        requestAnimationFrame(renderLoop);
      };
      renderLoop();
    },
    methods: {
      renderNotes(ctx, w, h) {
        const keyNum = FM.pianoKeys.length;
        const now = fm.getNowT() / FM.sampleRate;
        const renderOneNote = (id, hz, startTime, endTime) => {
          const y = h * (1 - FM.hz2index(hz) / keyNum);
          const start = 1 + (startTime - now) / renderNotesTime;
          const end = 1 + (endTime - now) / renderNotesTime;
          ctx.strokeStyle = `hsl(${FM.id2hsl_h(id)},50%,30%)`;
          if (start > 1 || end < 0) return;
          ctx.beginPath();
          ctx.moveTo(w * start, y);
          ctx.lineTo(w * end, y);
          ctx.stroke();
        };
        ctx.lineWidth = h / keyNum;
        for (const id in fm.receivedInfos) {
          for (const hz in fm.receivedInfos[id]) {
            const received = fm.receivedInfos[id][hz];
            renderOneNote(id, hz, received.startTime, received.endTime);
          }
        }
        for (const [id, hz, startTime, endTime] of fm.preReceiveds) {
          renderOneNote(id, hz, startTime, endTime);
        }
      },
      renderAmplitude(ctx, w, h) {
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = strokeColor;
        ctx.beginPath();
        ctx.moveTo(0, h * 0.5);
        let isZero = true;
        const dataLen = Math.min(fm.oneTimeData.length, 512);
        for (let i = 0; i < dataLen; i++) {
          const val = fm.oneTimeData[i];
          const x = w * i / dataLen;
          const y = h * (val + 0.5);
          if (val !== 0) isZero = false;
          ctx.lineTo(x, y);
        }
        if (!isZero) ctx.stroke();
      },
    }
  };
}
