'use strict'
// TODO: Safari のkeycode
// 全然いい感じの(無料の)FM音源サイトがない…！
// http://www.hikari-ongaku.com/study/fm.html
// http://www.geocities.jp/brotherasazuke/sakekanworks/fm/16.htm
// http://qiita.com/fukuroder/items/e1c2708222bbb51c7634
// https://synth-voice.sakura.ne.jp/synth-voice/html5/voice-lab00.html

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';

import './tw_share';
import FM from './fm';
import AmplitudeView from './amplitude-view';
import FMSliderView from './fm-slider-view';
import PianoView from './piano-view';
let fm = new FM();
new PianoView(fm);
new FMSliderView(fm);
new AmplitudeView(fm);
import Vue from 'vue';
new Vue({el: '#app'});
import './css/style.less';
