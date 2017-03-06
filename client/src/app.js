import Vue from 'vue';
export default class App {
  constructor(fm, name = 'vue-that') {
    Vue.component(name, {
      components: {
        hoge: {
          props: ['msg'],
          template: `<div>{{msg}}</div>`,
        }
      },
      data() { return {msg: 'Welcome to Your Vue.js App'}; },
      methods: {
        log() {
          this.msg += 'h ';
          console.log(fm);
        }
      },
      template: `
  <div class="vue" @click="log">
    <h1>{{msg}}</h1>
    <hoge :msg=msg></hoge>
    <li><a href="https://vuejs.org" target="_blank">props</a></li>
  </div>`,
    });
  }
};
