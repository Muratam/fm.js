'use strict'
// TODO: スライド <=> ヘルプページ(fx推奨)
//       edge /  最大同時鳴数 をタイムアウトまでに変更
// 全然いい感じの(無料の)FM音源サイトがない…！
// http://www.hikari-ongaku.com/study/fm.html
// http://www.geocities.jp/brotherasazuke/sakekanworks/fm/16.htm
// http://qiita.com/fukuroder/items/e1c2708222bbb51c7634
// https://synth-voice.sakura.ne.jp/synth-voice/html5/voice-lab00.html
// 時差もある edgeだとずれる...
// all webpack :
// {OK:[Mac(Fx,Ch,Sf),Win(Fx,Ed),Ubuntu(Fx)],Bad:[Win(Ch),Ubuntu(Ch(マシ))]}
// @core script :
// {OK:[Mac(Fx,▼Ch,Sf),Win(Fx),Ubuntu(Fx)],Bad:[Win(Ed(別スクリプトを読めない?,Ch),Ubuntu(Ch))]}
// => Firefox推奨 (動作確認済み:Safari,Edge)(Chrome)


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
