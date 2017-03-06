
export default class AmplitudeView {
  get noteNum() { return 20; }
  constructor(fm) {
    this.fm = fm;
    this.canvas = document.getElementById('amplitude');
    if (!this.isOK()) return false;
    this.ctx = this.canvas.getContext('2d');
    [this.w, this.h] = [this.canvas.width, this.canvas.height];
    this.begin();
  }
  isOK() { return this.canvas && this.canvas.getContext; }
  renderBackGround() {
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = '#3be';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.h * 0.5);
    for (let i = 0; i < this.fm.oneTimeData.length / 2; i++) {
      const val = this.fm.oneTimeData[i];
      const x = this.w * i / this.fm.oneTimeData.length * 2;
      const y = this.h * (val + 0.5);
      this.ctx.lineTo(x, y);
    }
    this.ctx.stroke();
  }
  begin() {
    if (!this.isOK()) return;
    const renderLoop = () => {
      this.ctx.clearRect(0, 0, this.w, this.h);
      this.renderBackGround();
      requestAnimationFrame(renderLoop);
    };
    renderLoop();
  }
}
