import FM from './fm';
import Vue from 'vue';
import $ from 'jquery';
import 'bootstrap-slider/dist/css/bootstrap-slider.min.css';
import './lib/roundslider.min.css';
import 'bootstrap-slider';
import './lib/roundslider.min';
import './adsr-view'

const sliderSize = 44;
const tableRowHeadWidth = sliderSize / 2;


export default class FMSliderView {
  constructor(fm, name = 'fm-sliders') {
    const currentHistory = FM.getCurrentHistory();
    function getProperty(x, y) {
      let property = {
        radius: 22,
        width: 11,
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
      if (x === FM.operatorNum) {
        property.max = 100;
        property.width = 5;
      } else if (x === FM.operatorNum + 1) {
        property.max = 11.0;
        property.min = 0.0125;
        property.value = 1;
        property.tooltipFormat = (a) => 'x' + a.value;
        property.step = 0.0001;
      } else if (x === FM.operatorNum + 2) {
        property.max = 400;
        property.min = 0;
        property.value = 0;
        property.step = 2;
      } else {
        property.tooltipFormat = (a) => a.value + '';
      }
      if (y === 0 && x === FM.operatorNum) {
        property.value = property.max;
      }
      if (currentHistory['mat'] !== undefined) {
        property.value = currentHistory['mat'][x][y];
      }
      return property;
    }
    const slider = {
      props: ['x', 'y'],
      template: `
       <td :class="{
              evens: ((x<${FM.operatorNum}?x:1)*y+1) % 2 === 0,
              odds:  ((x<${FM.operatorNum}?x:1)*y+1) % 2 === 1 ,
              lighter: ((x+1) * (y +1) ) % 2 === 1 && x < ${FM.operatorNum},
            }">
         <div class="slider"></div>
       </td>`,
      mounted() {
        const property = getProperty(this.x, this.y);
        $(this.$el).find('.slider').roundSlider(property);
        $(this.$el).find('.edit').removeClass('edit');
        fm.setSliderVal(this.x, this.y, property.value, false);
      }
    };
    const defaultADSR = currentHistory['adsr'] === undefined ?
        [0.2, 0.05, 0.9, 0.2] :
        currentHistory['adsr'];

    Vue.component(name, {
      template: `
      <div class="fm-sliders">
        <table>
          <tr class="slider-container">
            <td style="width:${tableRowHeadWidth}px;"></td>
            <td v-for="x in ${FM.operatorNum + 2}"
                style="width: ${sliderSize}px;"
                :class="{
                  evens: x % 2 === 0 && x <= ${FM.operatorNum},
                  odds:  x % 2 === 1 && x <= ${FM.operatorNum}}">
                {{x <= ${FM.operatorNum}
                  ? x : x % 2 === 1 ? "Volume": "Ratio"}}
            </td>
          </tr>
          <fm-h-container v-for="y in ${FM.operatorNum}" :y="y-1"></fm-h-container>
        </table>
        <div>
          <adsr-view :A=A :D=D :S=S :R=R ></adsr-view>
          <div class="adsr-sliders">
            <fm-adsr-slider v-for="index in ${defaultADSR.length}" :index="index-1"
            @adsr-value-changed="adsrchanged">
            </fm-adsr-slider>
          </div>
        </div>
      </div>
      `,
      data() {
        return {
          A: defaultADSR[0], D: defaultADSR[1], S: defaultADSR[2],
              R: defaultADSR[3]
        }
      },
      methods: {
        adsrchanged(index, value) {
          this[['A', 'D', 'S', 'R'][index]] = value;
        }
      },
      components: {
        'fm-adsr-slider': {
          template: `
            <div>
              <div class="adsr" data-slider-min="0" data-slider-max="1"
                  data-slider-step="0.001" data-slider-value="0.8"
                  data-slider-orientation="vertical" >{{index}}
              </div>
              <div style="width:36px;"
                :class="{ 'adsr-font': index %2 === 0 } "
                > {{name}}<br>{{value.toFixed(2)}}
              </div>
            </div>
            `,
          props: ['index'], data() { return {value: defaultADSR[this.index]}; },
          computed: {name() {
            return ['A', 'D', 'S', 'R'][this.index];
          }},
          mounted() {
            $(this.$el)
                .children('.adsr')
                .slider({
                  reversed: true,
                  tooltip: 'show',
                  value: this.value,
                  tooltip_position: 'left'
                })
                .on('change', (e) => {
                  this.value = e.value.newValue;
                  this.$emit('adsr-value-changed', this.index, this.value);
                  fm.setADSR(this.index, this.value);
                });
            fm.setADSR(this.index, this.value, false);
          }
        },
        'fm-h-container': {
          props: ['y'],
          template: `
            <tr class="slider-container">
              <td class="center-item"
                  style="width:${tableRowHeadWidth}px;height:${sliderSize};"
                  :class="{ evens: (y+1) % 2 === 0,odds:(y+1)%2 === 1}">
                  {{y + 1}}
              </td>
              <slider v-for="x in ${FM.operatorNum + 2}" :x=x-1 :y=y></slider>
            </tr>`,
          components: {slider: slider}
        },
      }
    });
  }
}