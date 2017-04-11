'use strict'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
import './css/style.less';

import './tw_share';
import FM from './fm';
import AmplitudeView from './amplitude-view';
import PianoView from './piano-view';
import FMSliderView from './fm-slider-view';
let fm = new FM();
import Vue from 'vue';
new Vue({
  el: '#app',
  components: {
    'fm-slider-view': FMSliderView(fm),
    'piano-view': PianoView(fm),
    'amplitude-view': AmplitudeView(fm)
  }
});
