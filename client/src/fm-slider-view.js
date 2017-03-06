import FM from './fm';
import Vue from 'vue';
import $ from 'jquery';
import 'bootstrap-slider/dist/css/bootstrap-slider.min.css';
import './lib/roundslider.min.css';
import 'bootstrap-slider';
import './lib/roundslider.min';

export default class FMSliderView {
  constructor(fm, name = 'fm-sliders') {
    function getProperty(x, y) {
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
        drag: (e) => { fm.setSliderVal(x, y, e.value); },
        change: (e) => { fm.setSliderVal(x, y, e.value); }
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
      return property;
    }
    const slider = {
      props: ['x', 'y'],
      template: `<div class="slider"></div>`,
      mounted() {
        const property = getProperty(this.x, this.y);
        if (this.y <= FM.operatorNum) this.$el.classList.add('tuner');
        $(this.$el).roundSlider(property);
        if (this.y !== FM.operatorNum + 1)
          $(this.$el).find('.edit').removeClass('edit');
        fm.setSliderVal(this.x, this.y, property.value);
      }
    };
    // a,d,r in [0,2] |s in [0,1]
    const defaultADSR = [0.2, 0.05, 0.9, 0.2];
    Vue.component(name, {
      template: `
      <div class="fm-sliders">
        <div>
          <fm-h-container v-for="x in ${FM.operatorNum}" :x="x-1"></fm-h-container>
        </div>
        <fm-adsr-slider v-for="index in ${defaultADSR.length}" :index="index-1">
        </fm-adsr-slider>
      </div>
      `,
      components: {
        'fm-adsr-slider': {
          template: `
            <div class="adsr" data-slider-min="0" data-slider-max="1"
                 data-slider-step="0.001" data-slider-value="0.8"
                 data-slider-orientation="vertical" >
            </div>`,
          props: ['index'],
          data() { return {value: defaultADSR[this.index]}; },
          mounted() {
            $(this.$el)
                .slider({reversed: true, tooltip: 'always', value: this.value})
                .on('change', (e) => {
                  this.value = e.value.newValue;
                  fm.setADSR(this.index, this.value);
                });
            fm.setADSR(this.index, this.value);
          }
        },
        'fm-h-container': {
          props: ['x'],
          template: `
            <div class="slider-container">
              <slider v-for="y in ${FM.operatorNum + 2}" :x=x :y=y-1></slider>
            </div>`,
          components: {slider: slider}
        },
      }
    });
  }
}