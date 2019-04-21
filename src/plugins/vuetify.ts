import Vue from 'vue';
import Vuetify from 'vuetify/lib';
import 'vuetify/src/stylus/app.styl';
import pl from 'vuetify/src/locale/pl';

Vue.use(Vuetify, {
  iconfont: 'md',
  lang: {
    locales: { pl },
    current: 'pl',
  },
});
