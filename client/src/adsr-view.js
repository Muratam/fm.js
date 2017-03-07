import Vue from 'vue';
import {strokeColor, lineWidth} from './amplitude-view';

Vue.component('adsr-view', {
  template: `<canvas style="width:100%;height:20px" ></canvas>`,
  props: ['A', 'D', 'S', 'R'],
  mounted() {
    const renderLoop = () => {
      this.renderBackGround();
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
  },
  methods: {
    renderBackGround() {
      const STime = 1.0;
      let allTime = this.A + this.D + STime + this.R;
      let canvas = this.$el;
      let ctx = canvas.getContext('2d');
      let [w, h] = [canvas.width, canvas.height];
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = lineWidth * 3;
      ctx.strokeStyle = strokeColor;
      ctx.beginPath();
      ctx.moveTo(0, h);
      const wResolution = 50;
      for (let i = 0; i < wResolution; i++) {
        let val = 0;
        if (i < wResolution * this.A / allTime) {
          val = i * allTime / this.A / wResolution;
        } else if (i < wResolution * (this.A + this.D) / allTime) {
          let i2 = (i - wResolution * this.A / allTime);
          val = this.S +
              (1 - this.S) * (1 - i2 * allTime / (this.D) / wResolution);
        } else if (i < wResolution * (this.A + STime + this.D) / allTime) {
          val = this.S;
        } else {
          let i3 = (i - wResolution * (this.A + this.D + STime) / allTime);
          val = this.S * (1 - i3 * allTime / this.R / wResolution);
        }
        val = 1 - val;
        const x = w * i / wResolution;
        const y = h * val;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.stroke();
    },
  }
});