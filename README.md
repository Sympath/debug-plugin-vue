# vue-debug-plugin | 快速查看你的vue数据状态吧

### 前言

上个月入职了新公司，开始新的造梦（填坑）之旅，开发过程中遇到了VueDevTool无法使用的情况，概括而言即因项目过大导致VueDevTool崩溃的情况，`console`了几天顶不住了，遂开发自实现的vue插件，效果如下，纯原创绝不是重复造轮子，瓜包熟，走过路过别错过。

最重要的是：每日一冰，干活卖命，明年老板换新车

![640-1](https://tva1.sinaimg.cn/large/008i3skNly1gq1prq92w7g307s06i47h.gif)



### 先看效果

![](http://cdn.sympathy.icu/2021-05-04%2019.14.11.gif)

### 面向问题

主要面向的其实是VueDevTool这个谷歌插件，实现的功能也和其相似（少侠休走，存在如快速切换定位组件、直接操作组件状态一定程度节省更改代码时间等优化）；

先说我们熟悉的VueDevTool

![image-20210430134147910](https://tva1.sinaimg.cn/large/008i3skNly1gq1pv6oncoj30ax05kq3z.jpg)

即时查看组件数据和一定程度修改组件数据的功能一度让我爱不释手，但有些问题也让我咬牙切齿，主要是下面三点

- VueDevTool如果没有设置过滤公共组件，层级会很深很深，点点点之后如果刷新了页面又得重新点点点
- 属性修改麻烦，尤其引用类型，还不如改代码热更新，但改代码又挺麻烦。
- 最关键一点，Vue项目（如我司）如果体积庞大，经常会出现VueDevTool崩溃从而无法查看组件属性值的情况

最后一点至为关键，毕竟感受过了美好，谁还想回到刀耕火种？一直打一个log看一下页面确实烦恼，就尝试看能不能优化下这个问题，也会有缺陷，但进步是一步接一步嘛。

![v2-9c6182a96443f811e00edd8774d5cc4b_720w](https://tva1.sinaimg.cn/large/008i3skNly1gq1q21ctl2j3028028dfl.jpg)

### 解决思路

就`VueDevTool`而言，去看下github就会发现，其实就是拿当前渲染的vue组件，然后进行数据等信息的获取，最后通过数据画页面就是我们前端的拿手活了；所以关键点就是如何拿到当前渲染的vue组件；

关键词：当前、组件实例；

##### 前置条件

- 考虑无侵入，采用vue的插件机制；
- 考虑是debug插件，对外暴露`isDev`的配置项（具体阅读【配置项】），如果是测试环境才接入插件

##### 获取组件实例

采用订阅发布模式，在插件的作用域中维系一个对象，key为`setVmInstance`传入的key，值为组件实例，

维护一个map数据结构（这样可以保证插入顺序和渲染顺序一致，下文代指收集中心），此为订阅；定义`setVm`函数，传入`key`则会在map上取出对应的实例，并将`$vm`指向此实例，此为发布；（重点思路，单页应用，也就意味着应用的单元为“页面”，也就是说我们研究的是页面组件及其对应的后台组件）

- 前置：`mixin中定义setVmInstance，在生命周期中其`this`就是指向当前渲染的组件实例，调用setVmInstance存入`vmMap`实现组件的订阅
- 订阅：首先在`beforeRouteEnter`获得页面组件实例，进行深度递归注册，其中核心点是根据`$children`属性获取子组件
- 发布：组件的切换就是通过key从`vmMap`中获取对应组件然后切换效果图里的`$vm`指向即可。

###### 部分具体实现相关代码如下

如下方法通过Vue.mixin混入，从而所有组件实例都可以执行

```javascript
let vmMap = {}; // 实现$vm调试模式 用以保存vue实例的map
let setVm; // 切换实例的方法
/**
     * 在window上持有当前的vm实例从而方便调试 $vm 默认指向当前页面
     * @param {*} vmKey 唯一key
     * @param {*} isPage 是否为当前页面   从而实现  $vm默认指向当前页面
 */  
setVmInstance (vmKey = '',isPage = false) {
 
    vmMap[vmKey] = this;
    // 考虑到多个组件都可能注册了这个调试功能，假设是父子组件 根据生命周期就会导致$vm的指向出现问题 解决思路如下
    // 1. 注册时传递一个key 作为当前vm的唯一标识
    // 2. 在控制台先setVm并传递key值 这样就可以实时保证$vm的指向了，甚至可以一个页面多组件的调试（这个思路其实是类似解决微应用中子应用调试的）
    // 3. 后期应该改为类似API转发工具的能力，代码层采用mixin 统一使用name；注入层，表单输入key 点击确认就可以调用setVm挂载$vm
   	setVm = function (vmKey = '') {
      window.$vm = vmMap[`$vm${vmKey}`];
    };
    // 是当前页面 则默认执行一次挂载 将$vm指向当前页面的vue实例  可以调用setVm从而改为指向页面中组件的实例
    isPage && setVm(vmKey);
}
```

路由守卫

```js
beforeRouteEnter (to, from, next) {
  next(vm => {
    // 在进行递归加载当前页所用到的组件及其对应组件
    initVmMap(to,vm);
  })
},
```

##### 解决持有实例导致内存泄漏问题

我们知道，一个对象如果存在引用，就会干扰js的垃圾回收，假设我们进行了页面跳转，收集中心仍保持旧页面实例，就会出现这个问题，这里我们可以采用路由守卫进行清空收集中心的处理。

这里只能点到为止，具体建议阅读【迭代优化】模块，是所有修复问题的心路历程。

###### 部分实现相关代码如下

```js
// 在页面跳转时清空插件
beforeRouteLeave(to, from, next){
  vmMap = {};
  if(window.$vm) window.$vm = {};
  next()
},
```

##### 涉及到微前端

因我司有微前端体系，所以有做兼容，稍微复杂点，不过也差不多，如果不了解微前端的小伙伴，打个广告，可以看下我的微前端系列文章：[微前端之singleSPA实战｜技术点评](https://juejin.cn/post/6938012612257021960)，最关键点只有一个：在主应用中可以获取到子应用的全局变量，所以兼容思路如下

1. 插件支持配置项`isMapp`和`getMappWinodow`，前者用以判断是子应用还是主应用，后者用于在主应用中获取子应用的全局变量
2. 切换到子应用时，将收集中心切换到子应用的收集中心，后续逻辑复用

这样，我们就实现了子应用的兼容啦

```js
if(callFn(isDev,window.location)){
    // 如果是子应用 则加载子应用的插件
    if(isMapp){
      return mappPluginFn(options)
    }
    // 否则 加载主应用的插件
    else{
      return vmPluginFn(options)
    }
  }
```

##### 解决思路小结

其实核心思路也讲的差不多了，一句话：以页面为单元，收集当前已渲染的组件实例，用户可以自行切换（如目前的点击切换）当前查看变量指向哪个组件实例，至此，我们就可以快乐的抛弃`console.log`啦（至少别那么常见zzz）。

（很简单，但小伙伴们说挺实用的，大佬们别嫌弃哈，如果可以，烦劳贵手帮南方本小菜[点个star](https://github.com/Sympath/debug-plugin-vue)鼓励一下吧）

![v2-6bb953c88d6fac3d523b8d7aedcd0535_720w](https://tva1.sinaimg.cn/large/008i3skNly1gq1r7sayt7j304805hweb.jpg)

### 解决后结果

1. 可以直接操作vue实例从而查看和修改数据（顺带解决了VueDevTool层级很深很深的麻烦）
2. 可以任意切换当前页面已挂载的组件，查看和控制数据（这就意味着在测试环境我们可以直接看更改vue组件数据看效果了，一定程度简化修复bug的成本）
3. 兼容了微前端的场景，一定程度解决了微前端项目中子应用难以调试的问题

### 如何使用

##### 安装npm包

```
npm i vue-debug-plugin -D
```

###### Main.js中引入

```js
import vueDebugPluginFn from 'vue-debug-plugin';
let vueDebugPlugin = vueDebugPluginFn({
  	 /** 无微应用可以忽略
     * @param {*} to 路由对象 详情可见vue-router官网
     * @param {*} pageVm 当前页面组件实例
     * @returns 
     */
    getMappWinodow(to,pageVm){
        // 如果存在且只存在微前端控制面板  且 子应用存在 则返回
        if(to.fullPath == '/'){
            return pageVm.app.sandbox.proxy;
        }
    },
    isDev(location){   // 默认为false 不传插件会直接不加载
        let localIdentifyings = ['8082','test'];
        let isDev = localIdentifyings.some(id => location.href.indexOf(id) !== -1)
        return isDev
    },
    hasElementUI: true  // 项目是否接入了elementUi 
    // isMapp: true 如果是子应用 需要设置为true  无微应用可以忽略
})
Vue.use(vueDebugPlugin)
```

##### 配置项

| 配置项         | 类型                | 作用                                                         | 是否必填 |
| -------------- | ------------------- | ------------------------------------------------------------ | -------- |
| getMappWinodow | Function            | 获取子应用的全局变量 （如果不需要承接微应用可以不传递）；默认参数会传递路由对象和当前页面组件实例 | 否       |
| isDev          | Function \| Boolean | 判断是否是开发环境 如果函数返回为true才接入插件（传入true也行）；默认参数会传递当前页面路径（window.location） | 是       |
| hasElementUI   | Boolean             | 项目是否接入了elementUi ，如果接入了则采用其进行优化         | 否       |
| isMapp         | Boolean             | 微应用场景下，子应用也需要引入此插件，如果是子应用 需要将此值设置为true | 否       |

### 举例（[DEMO仓库](https://gitee.com/zzmwzy/vue-debug-plugin-demo)）

运行效果见文首

##### 页面代码

###### Home

```vue
<template>
  <div class="home">
     <h1>{{name}}</h1>
     <w-dialog/>
  </div>
</template>

<script>
import wDialog from '../components/w-dialog';
export default {
  name: 'Home',
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
  <div v-show="show" class="wrapper">
      {{dianame}}
  </div>
</template>

<script>
export default {
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
    data(){
      return {
        name: '清哥新婚快乐！！'
      }
    }
}
</script>
```

### 迭代记录及对应思路整理

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
  - 代码污染问题：需要在需要调试的组件里加`d_name`
- 半解决问题
  - 样式太丑了（zzz，太忙了，有时间再优化，暂时支持elementUi，后期有时间自己去优化下，支持任意的组件库）
- 解决问题
  - vue实例无法被垃圾回收

##### 实现去除手动注册d_name逻辑

搞了五一三天放假的改进，注册方式不再放在mixin的mounted中，而是采用`beforeRouteEnter`，通过当前页面组件深度递归后代组件进行组件注册

- 存在问题
  - 样式太丑了（zzz，太忙了，有时间再优化，暂时支持elementUi，后期有时间自己去优化下，支持任意的组件库）
  - 后代组件如果在最开始没有加载（如v-if），则不会被加载，需后期添加动态加载的功能

- 解决问题
  - 代码污染问题：需要在需要调试的组件里加`d_name`

### 个人感触

​	最近感触颇多，在上周一的日记看到这样一段话

```
脑子里突然想到另一句诗“念天地之悠悠，独仓然而涕下”，换我现在，一天12个小时+的学或写代码，应该改成“念代码之悠悠”吧，但好像很搞笑的样子。
```

​	因为业务的庞大，第一次就独立承接一个比较大的需求时难免疲于奔命，忙忙碌碌，但还是想写，想去优化，五一解决了需要在组件中注册的问题，说不出的开心，搞笑的是昨晚做梦居然都是同事用我的插件加载不出来然后我去排查的场景，有种看什么东西长大的感觉。

​	每晚很晚走，但不是一个人，还有一个实习生，也是我室友，每次晚上看我都会说：“哎呀志远，太卷了太卷了，别学了”，但每次都会和我一起学到很晚。回去的时间大多是深夜和凌晨的交接线，两个人走在空无一人的大街上，月明星稀，会很肆无忌惮的打打闹闹，偶尔一两辆小吃车，百无聊赖的老板看到有人路过会很快的精神一下，发现不是顾客又会很快的百无聊赖，后来见得次数多了，抬头低头百无聊赖的状态无缝衔接，但还是几乎每晚都能见到。

​	老板的坚持出摊，室友的坚持学习，我们都在坚持着一些东西，无关辛苦，只是愿意，记得高中的时候老师让我们学鲁迅刻字，写座右铭，当时写的是：一念既定，万山无阻。不是当初想像中的自己，或好或坏，但最起码在一定程度上做到了些什么。

### 尾声

没啥说的了，若使诸君稍有启发，不枉此文心力^-^；

哦对了，还有一件事：八年室友结婚啦，新婚快乐！！！（小伙伴方便的话，star可以不点，帮小菜去[掘金]()留个言【少清新婚快乐】吧~~~）

哦对了，还有一件事：微医招聘，地标杭州，团队大、大佬多、好看小姐姐多，速来（大佬们留言，我去捞人）

哦对了，还有一件事：可以的话，轻点小手帮小弟点个[star](https://github.com/Sympath/debug-plugin-vue)呗

哦对了，还有一件事：我们家冰冰真好看

![thread_214569626974086_20201111224348_s_363620_o_w_224_h_155_96920](https://tva1.sinaimg.cn/large/008i3skNly1gq1s2zcuo9g306804b483.gif)

### 相关链接

- [NPM包](https://www.npmjs.com/package/vue-debug-plugin)
- [Github](https://github.com/Sympath/debug-plugin-vue)
- vue-debug-plugin对应的[DEMO仓库](https://gitee.com/zzmwzy/vue-debug-plugin-demo)