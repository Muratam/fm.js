import Vue from 'vue';
import {strokeColor, lineWidth} from './amplitude-view';

export default function() {
  return {
    template: `<canvas style="width:100%;height:20px" ></canvas>`,
    props: ['A', 'D', 'S', 'R'], data() { return {dirty: true}; },
    watch: {
      A() { this.dirty = true; },
      D() { this.dirty = true; },
      S() { this.dirty = true; },
      R() { this.dirty = true; },
    },
    mounted() {
      const renderLoop = () => {
        this.renderBackGround();
        requestAnimationFrame(renderLoop);
      };
      renderLoop();
    },
    methods: {
      renderBackGround() {
        if (!this.dirty) return;
        this.dirty = false;
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
        const a = this.A / allTime;
        ctx.lineTo(w * a, 0);
        const d = (this.A + this.D) / allTime;
        ctx.lineTo(w * d, h - (h * this.S));
        const s = (this.A + this.D + STime) / allTime;
        ctx.lineTo(w * s, h - (h * this.S));
        ctx.lineTo(w, h);
        ctx.stroke();
      },
    }
  };
}