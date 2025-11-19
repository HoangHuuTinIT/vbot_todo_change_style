import App from './App'
import * as Pinia from 'pinia'
import { createI18n } from 'vue-i18n'
import messages from './locale/index'
// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
export function createApp() {
  const app = createSSRApp(App)
  app.use(Pinia.createPinia())
  const i18n = createI18n({
      locale: 'vi', // Ngôn ngữ mặc định
      messages,
      legacy: false, // Dùng Composition API
      globalInjection: true, // Cho phép dùng $t
    })
    app.use(i18n)
  return {
    app,
	Pinia,
	i18n
  }
}
import en from './en.json'
import vi from './vi.json'
export default { en, vi }
// #endif