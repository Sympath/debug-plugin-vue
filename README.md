# debug-plugin

### 前言

##### 面向问题

Vue项目（如我司）经常会出现VueDevTool崩溃从而无法查看组件属性值的情况（其实个人感觉VueDevTool如果没有设置过滤公共组件，层级会很深很深，也挺麻烦），而一直打一个log看一下页面也确实挺烦，就尝试看能不能优化下这个问题，也会有缺陷，但进步是一步接一步嘛。

##### 解决后结果

1. 在控制台可以直接用`$vm`查看当前页面的vue实例从而查看数据（顺带解决了VueDevTool层级很深很深的麻烦）
2. 可以任意切换当前页面已挂载的组件，查看和控制数据（这就意味着在测试环境我们可以直接看更改vue组件数据看效果了，避免本地改的情况）
3. 兼容了微前端的场景

### 使用

- options ： 配置项
  - getMappWinodow 获取子应用的全局变量 （如果不需要承接微应用可以不传递）
  - isDev  判断是否是开发环境 如果函数返回为true才接入插件（传入true也行）
  - hasElementUI   项目是否接入了elementUi 

##### 举例（[例子仓库](https://gitee.com/zzmwzy/vue-debug-plugin-demo)）

###### 引入

```js
import vueDebugPluginFn from 'vue-debug-plugin';
let vueDebugPlugin = vueDebugPluginFn({
    getMappWinodow(vmMap){
        // 如果存在且只存在微前端控制面板  且 子应用存在 则返回
        if(vmMap.friday && Object.keys(vmMap).length == 1 && vmMap.friday.app){
            return vmMap.friday.app.sandbox.proxy;
        }
    },
    isDev(location){
        let localIdentifyings = ['8082','test'];
        let isDev = localIdentifyings.some(id => location.href.indexOf(id) !== -1)
        return isDev
    },
    hasElementUI: true  // 项目是否接入了elementUi 
    // isMapp: true 如果是子应用 需要设置为true
})
Vue.use(vueDebugPlugin)
```
###### 页面代码

Home

```vue
<template>
  <div class="home">
     <h1>{{name}}</h1>
     <w-dialog/>
  </div>
</template>

<script>
// @ is an alias to /src

import wDialog from '../components/w-dialog';
export default {
  name: 'Home',
  d_name: 'p_home',
  components: {
    wDialog
  },
  data(){
    return {
      name: '老妈身体健康'
    }
  }
}
</script>

```

其中组件代码

```vue
<template>
  <div v-if="show" class="wrapper">
      {{dianame}}
  </div>
</template>

<script>
export default {
  d_name: 'dialog',
  components: {},
  props: {},
  data() {
    return {
      dianame: '我是弹窗数据-小侄女越来越可爱',
      show: false
    };
  }
};
</script>
<style scoped>
.wrapper{}
</style>
```

###### About

```vue
<template>
  <div class="about">
    <h1>{{name}}</h1>
  </div>
</template>
<script>
export default {
    d_name: 'p_about',
    data(){
      return {
        name: '清哥新婚快乐！！'
      }
    }
}
</script>
```

###### 使用效果

<video src="/Users/wzyan/Library/Containers/FN2V63AD2J.com.tencent.ScreenCapture2/Data/Downloads/QQ20210430-005315-HD.mp4"></video>





### 实现逻辑大致讲解

##### 不涉及到微前端

1. 在需要查看数据的组件的`mounted`生命周期中执行注入方法，传递一个特定的key（如果不需要查看页面中的组件数据不传也可以）

```
  this.setVmInstance('friday');  // 举个例子
```

2. 在控制台中用`$vm`就可以查看数据了（支持通过调用setVm传递不同key查看不同组件的数据）

##### 涉及到微前端

稍微复杂点，不过也差不多

1. 在子仓库需要查看数据的组件的`mounted`生命周期中执行注入方法，传递一个特定的key（如果不需要查看页面中的组件数据不传也可以）

```
  this.setVmInstance('friday');  // 举个例子
```

2. 在控制台调用下`$vm.setFVm(key)`，key就是上面的那个key，这一步是给`$fVm`赋值的
3. 在控制台中用`$fVm`就可以查看子应用的数据了（并且同样支持通过调用setFVm传递不同key查看不同组件的数据）

### 原理

##### 不涉及到微前端

这个场景下是比较好理解的，分两步来处理

1. 不考虑查看子组件数据：那`setVmInstance`就是直接粗暴的`window.$vm = this`就可以了

2. 考虑切换查看挂载的子组件数据的功能

   改写`setVmInstance`方法，在全局持有一个map，用以保存多个vue组件实例（页面其实也可以看作是组件），每次调用相当于一次存入；

   - 订阅：我们暴露一个方法`setVm`，用于通过唯一字符串，将`$vm`指向map[key]对应的vue实例；然后在需要的组件的`mounted`中`this.setVmInstance(key) `，就实现了存入。

   - 发布：当我们需要查看另一个组件数据时，控制台调用`setVm(key)`传入指定key就可以了。

3. 考虑多个组件都可能注册了这个调试功能，假设是父子组件 根据生命周期就会导致$vm的默认指向不是当前页面的情况，通过第二个参数`isPage`进行处理，如果是页面才进行默认挂载，由于一个路由必然只有一个页面和n个组件，所以处理方案可行。

 考虑到多个组件都可能注册了这个调试功能，假设是父子组件 根据生命周期就会导致$vm的指向出现问题 解决思路如下

（注：后期应该改为类似API转发工具的能力，代码层采用mixin 统一使用name；注入层，表单输入key 点击确认就可以调用setVm挂载$vm）

###### 具体实现代码如下

如下方法通过Vue.mixin混入，从而所有组件实例都可以执行

```javascript
let vmMap = {}; // 实现$vm调试模式 用以保存vue实例的map
/**
     * 在window上持有当前的vm实例从而方便调试 $vm 默认指向当前页面
     * @param {*} vmKey 唯一key
     * @param {*} isPage 是否为当前页面   从而实现  $vm默认指向当前页面
 */  
setVmInstance (vmKey = '',isPage = false) {
  // 只在本地开发的时候生效，避免污染线上
  let isLocal = location.host.indexOf(8082) !== -1;
  if (isLocal) {
    vmMap[`$vm${vmKey}`] = this;
    // 考虑到多个组件都可能注册了这个调试功能，假设是父子组件 根据生命周期就会导致$vm的指向出现问题 解决思路如下
    // 1. 注册时传递一个key 作为当前vm的唯一标识
    // 2. 在控制台先setVm并传递key值 这样就可以实时保证$vm的指向了，甚至可以一个页面多组件的调试（这个思路其实是类似解决微应用中子应用调试的）
    // 3. 后期应该改为类似API转发工具的能力，代码层采用mixin 统一使用name；注入层，表单输入key 点击确认就可以调用setVm挂载$vm
    window.setVm = function (vmKey = '') {
      window.$vm = vmMap[`$vm${vmKey}`];
    };
    // 是当前页面 则默认执行一次挂载 将$vm指向当前页面的vue实例  可以调用setVm从而改为指向页面中组件的实例
    isPage && setVm(vmKey);
  }
}
```

##### 涉及到微前端

而如果出现加载页是微前端，就需要考虑如何去获取微前端中的vue实例了，因为在微前端中的window是被代理过的，挂载的逻辑还是同上，但获取略微麻烦了点（可能是因为我对微前端还不太熟悉，目前贼忙，不想优化了，下次一定）。

梳理下目标：1. 让微前端也具有挂载的能力  2. 让页面的原生window可以获取到这个子应用的$vm，我们可以把它约定为`$fVm`，意为friday带来的微前端vue实例。

1. 挂载子应用$vm：在微前端的mixin中同样混入上面的方法，这样就具备了设置$vm的能力了
2. 找到子应用的$vm：我们加载微应用其实是通过`FridayParcel`这个组件，这就需要先去了解[云His项目微前端开发指南]()了，子应用中的代理window会存在`.app.sandbox.proxy`属性上（别问我咋知道的，一直找找出来的，所以有风险，但还是那句话，目前贼忙，不想优化了，下次一定）
3. 获得子应用的$vm：这时逻辑就简单了，改写云His中的`setVmInstance`，我们只需要在每次setVm方法中，对$vm挂载一个方法`setFVm`用以将`$fVm`指向`window.$vm.app.sandbox.proxy.$vm;`即可
4. 支持切换$fVm：如果`setFVm`调用时传递了key，则去调用一个子应用中的setVm即可（setVm逻辑见上面👆🏻）

改写后的`setVmInstance`

```javascript
 setVmInstance (vmKey = '',isPage = false) {
      // 只在本地开发的时候生效，避免污染线上
      let isLocal = location.host.indexOf(8082) !== -1;
      if (isLocal) {
        vmMap[`$vm${vmKey}`] = this;
        // 考虑到多个组件都可能注册了这个调试功能，假设是父子组件 根据生命周期就会导致$vm的指向出现问题 解决思路如下
        // 1. 注册时传递一个key 作为当前vm的唯一标识
        // 2. 在控制台先setVm并传递key值 这样就可以实时保证$vm的指向了，甚至可以一个页面多组件的调试（这个思路其实是类似解决微应用中子应用调试的）
        // 3. 后期应该改为类似API转发工具的能力，代码层采用mixin 统一使用name；注入层，表单输入key 点击确认就可以调用setVm挂载$vm
        window.setVm = function (vmKey = '') {
          window.$vm = vmMap[`$vm${vmKey}`];
          // ********* 其实就是新增了这个方法
          // 子应用的vue实例  如果是在微应用里 则1. 在微应用对应页面的mounted中调用setVmInstance 2. 在控制台调用下这个方法 就可以在$fVm上取值了
          window.$vm.setFVm = function (key = '') {
            key && window.$vm.app.sandbox.proxy.setVm(key); // 传递了key则是更改子应用中的$vm指向 不传则默认走子应用中的页面vue实例
            window.$fVm = window.$vm.app.sandbox.proxy.$vm;
          };
        };
        // 是当前页面 则默认执行一次挂载 将$vm指向当前页面的vue实例  可以调用setVm从而改为指向页面中组件的实例
        isPage && setVm(vmKey);
      }
    }
```

至此，我们就可以快乐的抛弃`console.log`啦（至少别那么常见zzz）

### 迭代
##### 在mixin中定义setVmInstance 实现组件的订阅
在需要调试的组件中调用`setVmInstance`，传入key，在window上会挂载`$vm${key}`的变量，指向当前组件的实例
- 存在问题
  - 每次要调用 代码侵入性太强、不便后人理解，而且麻烦
  - window上全局变量太多
  - vue实例无法被垃圾回收
  - 需要记忆很多key
  - mixin中代码污染
###### mixin中定义setVm 实现在控制台中进行组件的切换 setVmInstance用于订阅 实现保存组件实例
维护一个map数据结构，key为`setVmInstance`传入的key，值为组件实例，此为订阅；定义`setVm`函数，传入`key`则会在map上取出对应的实例，并将`$vm`指向此实例，此为发布；
- 存在问题
  - 每次要调用 代码侵入性太强、不便后人理解，而且麻烦
  - vue实例无法被垃圾回收
  - 需要记忆很多key
  - mixin中代码污染

- 解决问题
  - window上全局变量太多  此时window只存在了两个变量，`setVm`和`$vm`

##### 采用d_name进行setVmInstance的调用 从而避免暴露setVmInstance这个对内的接口;改写成插件形式,解耦合
改写为插件形式，进行解耦合；在生命周期中进行判断，如果实例上有定义`d_name`，则进行订阅（调用setVmInstance），从而减少对外接口的显示调用
- 存在问题
  - 每次要调用 代码侵入性太强、不便后人理解，而且麻烦
  - vue实例无法被垃圾回收
  - 需要记忆很多key

- 解决问题
  - mixin中代码污染
  - setVmInstance的对外暴露

##### 采用渲染面板的形式,点击切换组件实例,从而避免暴露setVm这个对内的接口
渲染一个按钮，点击显示渲染面板，将所有订阅的key渲染在面板上，所有的key包裹节点监听点击事件，调用`setVm`从而切换组件
- 存在问题
  - vue实例无法被垃圾回收
  - 无法承接微前端场景（因为子应用中的window是被封装过的）
  - 样式太丑了（zzz，太忙了，有时间再优化）

- 解决问题
  - 需要记忆很多key
  - 每次要调用 代码侵入性太强、不便后人理解，而且麻烦
  - setVm的对外暴露

##### 提供getMappWinodow接口 承接微前端场景
考虑微前端场景，将插件分场景判断，如果是主应用，正常渲染；如果是子应用，在子应用的window（被代理）上挂载vmMap变量，不佳渲染逻辑（使用主应用的），用户传递一个函数getMappWinodow，用户判断和获取子应用的window，如果有返回值，则在主应用中进行vmMap的切换，从而达到承接子应用的效果
- 存在问题
  - vue实例无法被垃圾回收
  - 样式太丑了（zzz，太忙了，有时间再优化）
  - 应该避免污染生产环境

- 解决问题
  - 无法承接微前端场景（因为子应用中的window是被封装过的）

##### 暴露配置项：解决生产环境区分问题和承接子应用问题
分离主应用和子应用插件功能,暴露配置项isMapp用于判断是否为子应用;
暴露配置项getMappWinodow用于主应用获取子应用的全局变量;
暴露isDev用于判断需不需要加载插件;

- 存在问题
  - vue实例无法被垃圾回收
  - 样式太丑了（zzz，太忙了，有时间再优化）

- 解决问题
  - 避免污染生产环境

##### 暴露配置项：支持ElementUI 美化样式
暴露hasElementUI用于判断项目是否接入了elementUI 如果接入了则使用jsx渲染其组件;

- 存在问题
  - 代码污染问题，需要在需要调试的组件里加`d_name`

- 解决问题
  - vue实例无法被垃圾回收
  - 样式太丑了（zzz，太忙了，有时间再优化，暂时支持elementUi，后期有时间自己去优化下，支持任意的组件库）

