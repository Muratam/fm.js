'use strict'
// TODO: Safari のkeycode
// 全然いい感じの(無料の)FM音源サイトがない…！
// http://www.hikari-ongaku.com/study/fm.html
// http://www.geocities.jp/brotherasazuke/sakekanworks/fm/16.htm
// http://qiita.com/fukuroder/items/e1c2708222bbb51c7634
//   https://synth-voice.sakura.ne.jp/synth-voice/html5/voice-lab00.html

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-slider/dist/css/bootstrap-slider.min.css';
import './lib/roundslider.min.css';
import './css/style.less';
import './tw_share';
import 'bootstrap';
import 'bootstrap-slider';
import './lib/roundslider.min';

import FM from './fm';
import PianoView from './piano-view';
import AmplitudeView from './amplitude-view';
import FMSliderView from './fm-slider-view';
import VPianoView from './vpiano-view';
let fm = new FM();
new VPianoView(fm);
new PianoView(fm);
new FMSliderView(fm);
new AmplitudeView(fm);

import Vue from 'vue';
// import App from './App.vue'; new Vue({el: '#app', render: h => h(App)});
import App from './app';
new App(fm);
new Vue({el: '#app'});