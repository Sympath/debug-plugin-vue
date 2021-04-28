export default {
  methods: {
    setVmInstance(key=""){
      // 只在本地开发的时候生效，避免污染线上
      let isLocal = location.host.indexOf(8082) != -1;
      if(isLocal){
        window[`$vm${key}`] = this;
      }
    }

  }
}