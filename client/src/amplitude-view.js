import Vue from 'vue';

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
          ctx.lineWidth = 1;
          ctx.strokeStyle = '#3be';
          ctx.beginPath();
          ctx.moveTo(0, h * 0.5);
          for (let i = 0; i < fm.oneTimeData.length / 2; i++) {
            const val = fm.oneTimeData[i];
            const x = w * i / fm.oneTimeData.length * 2;
            const y = h * (val + 0.5);
            ctx.lineTo(x, y);
          }
          ctx.stroke();
        },
      }
    });
  }
}
