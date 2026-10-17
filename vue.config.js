const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,

  // 배포 시 /SJ/ 경로 하위에서 정적 자원들을 올바르게 로드하도록 설정[cite: 14]
  publicPath: process.env.NODE_ENV === 'production' ? '/U/' : '/',

  pluginOptions: {
    vuetify: {}
  },

  devServer: {
    port: 9090
  }
});