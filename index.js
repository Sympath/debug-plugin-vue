import vmPluginFn from './main.js';
vmPluginFn({
    getMappWinodow(vmMap,$vm){
        // 如果存在且只存在微前端控制面板  且 子应用存在 则返回
        if(vmMap.friday && Object.keys(vmMap).length == 1 && $vm.app){
            return $vm.app.sandbox.proxy;
        }
    }
})