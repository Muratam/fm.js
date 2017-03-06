import Vue from 'vue';
export const strokeColor = '#555';
export const lineWidth = 1;

export default class AmplitudeView {
  get noteNum() { return 20; }
  constructor(fm, name = 'amplitude') {
    Vue.component(name, {
      template: `<canvas class="amplitude"></canvas>`,
      mounted() {
        const renderLoop = () => {
          this.renderBackGround();
          requestAnimationFrame(renderLoop);
        };
        renderLoop();
      },
      methods: {
        renderBackGround() {
          let canvas = this.$el;
          let ctx = canvas.getContext('2d');
          let [w, h] = [canvas.width, canvas.height];
          ctx.clearRect(0, 0, w, h);
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = strokeColor;
          ctx.beginPath();
          ctx.moveTo(0, h * 0.5);
          let isZero = true;
          for (let i = 0; i < fm.oneTimeData.length / 2; i++) {
            const val = fm.oneTimeData[i];
            const x = w * i / fm.oneTimeData.length * 2;
            const y = h * (val + 0.5);
            if (val !== 0) isZero = false;
            ctx.lineTo(x, y);
          }
          if (!isZero) ctx.stroke();
        },
      }
    });
  }
}
