import FM from './fm';

export default class FMSliderView {
  constructor(fm) {
    this.fm = fm;
    this.createFMSliders();
    this.createADSRSldiers();
  }
  createFMSliders() {
    const fmsliders = $('#fmsliders')[0];
    for (let x = 0; x < FM.operatorNum; x++) {
      const sliderContainer = $('<div class="slider-container"></div>')[0];
      for (let y = 0; y < FM.operatorNum + 2; y++) {
        const slider = $('<div class="slider"></div>');
        ((x, y) => {
          let property = {
            radius: 22,
            width: 5,
            handleSize: '+11',
            handleShape: 'dot',
            circleShape: 'pie',
            sliderType: 'min-range',
            value: 0,
            min: 0,
            max: 200,
            startAngle: -45,
            drag: (e) => { this.fm.setSliderVal(x, y, e.value); },
            change: (e) => { this.fm.setSliderVal(x, y, e.value); }
          };
          if (y === FM.operatorNum) {
            property.max = 100;
            property.width = 11;
          } else if (y === FM.operatorNum + 1) {
            property.max = 11.0;
            property.min = 0.0125;
            property.value = 1;
            property.tooltipFormat = (a) => 'x' + a.value;
            property.step = 0.0001;
          } else if (y === FM.operatorNum + 2) {
            property.max = 400;
            property.min = 0;
            property.value = 0;
            property.step = 2;
          } else {
            property.tooltipFormat = (a) => a.value + '';
          }
          if (x === 0 && y === FM.operatorNum) {
            property.value = property.max;
          }
          if (y <= FM.operatorNum) slider[0].classList.add('tuner');
          slider.roundSlider(property);
          this.fm.setSliderVal(x, y, property.value);
        })(x, y);
        sliderContainer.appendChild(slider[0]);
      }
      fmsliders.appendChild(sliderContainer);
    }
    //$('.tuner .edit').removeClass('edit');
    $('.edit').removeClass('edit');
  }
  createADSRSldiers() {
    const fmsliderAdsr = $('#fmslider-adsr')[0];
    const defaultADSR = [0.2, 0.05, 0.9, 0.2];  // a,d,r in [0,2] |s in [0,1]
    for (let i = 0; i < 4; i++) {
      const slider = $(
          `<div id="adsr${i}" class="adsr" data-slider-min="0" data-slider-max="1" data-slider-step="0.001" data-slider-value="0.8" data-slider-orientation= "vertical" > </div>`);
      fmsliderAdsr.appendChild(slider[0]);
      $('#adsr' +
        i).slider({reversed: true, tooltip: 'always', value: defaultADSR[i]});
    }
  }
}
