# vue-debug-plugin | 让你的vue数据了如指掌

### 前言

上个月入职了新公司，开始新的造梦（填坑）之旅，开发过程中遇到了VueDevTool无法使用的情况，概括而言即因项目过大导致VueDevTool崩溃的情况，`console`了几天顶不住了，遂开发自实现的vue插件，效果如下，纯原创绝不是重复造轮子，瓜包熟，走过路过别错过。

如果VueDevTool用得很快乐，也建议看看，本菜在实现插件过程中遇到很多问题，最后发现解决或优化方案居然大多来自于之前学习vue源码时的积累，也更加深了之前的理解，不由得感觉持续学习的重要性,也希望能给些许小伙伴们坚持学习的动力，在这里暂举两个个人觉得比较有代表性的问题及解决

- 我希望拿到页面所有已挂载的局部组件实例，思路是根据组件树，由页面组件（根）深度递归从而动态进行后代组件收集，很自然想到`beforeRouteEnter，那`beforeRouteEnter`在什么时机执行？该怎么拿到组件实例？如何区分全局组件和局部组件？如果有子路由，我想拿最深一层的页面组件实例又该怎么拿？

  ```
  # 关键点
  next Or 洋葱模型
  路由守卫在父子组件中的生命周期钩子执行顺序
  ```

- 后代组件实例及其dom如何获取？（希望无侵入，所以不能用refs）在数据变化导致后代组件装载卸载时，如`v-if`，我该如何监听到变化的后代组件、并且重新构建插件？如果触发了多次组件装、卸载，我只希望重建一次，如何实现？

  ```
  # 关键点
  $children
  父组件mounted一定在子组件mounted后
  nextTick实现原理
  ```

最重要的是：每日一冰，干活卖命，明年老板换新车

![640-1](https://tva1.sinaimg.cn/large/008i3skNly1gq1prq92w7g307s06i47h.gif)



### 先看效果

##### 无父子路由情况

![](http://cdn.sympathy.icu/2021-05-04%2019.14.11.gif)

##### 存在父子路由情况

![2021-05-09 20.06.32](https://tva1.sinaimg.cn/large/008i3skNly1gqcfld3bqqg31ro0tqe81.gif)

补充一下，当切换到【中药预览页】时（这里的切换是用过`v-if`控制的，），加载了两个组件，于是会触发两次构建的订阅（构建具体含义后文会详细说的），但只发布了一次，这里就是用到了`nextTick`的思路

### 面向问题

主要面向的其实是VueDevTool这个谷歌插件，实现的功能也和其相似（少侠休走，存在如快速切换定位组件、直接操作组件状态一定程度节省更改代码时间等优化）；

先说我们熟悉的VueDevTool

![image-20210430134147910](https://tva1.sinaimg.cn/large/008i3skNly1gq1pv6oncoj30ax05kq3z.jpg)

即时查看组件数据和一定程度修改组件数据的功能一度让我爱不释手，但有些问题也让我咬牙切齿，主要是下面三点

- VueDevTool如果没有设置过滤公共组件，层级会很深很深，点点点之后如果刷新了页面又得重新点点点

![image-20210508163612982](https://tva1.sinaimg.cn/large/008i3skNly1gqb3v67g3lj30q00b7abm.jpg)

- 属性修改麻烦，尤其引用类型，还不如改代码热更新，但改代码又挺麻烦。

![image-20210508163722130](https://tva1.sinaimg.cn/large/008i3skNly1gqb3wc1hfoj30jx05wjrs.jpg)

- 最关键一点，Vue项目（如我司）如果体积庞大，经常会出现VueDevTool崩溃从而无法查看组件属性值的情况



最后一点至为关键，毕竟感受过了美好，谁还想回到刀耕火种？一直打一个log看一下页面确实烦恼，就尝试看能不能优化下这个问题，也会有缺陷，但进步是一步接一步嘛。

![v2-9c6182a96443f811e00edd8774d5cc4b_720w](https://tva1.sinaimg.cn/large/008i3skNly1gq1q21ctl2j3028028dfl.jpg)

### 解决思路

现在来思考下我们要解决的问题：

##### 只考虑匹配一个路由的情况：如何获取到页面组件对应的所有*已挂载*后代组件，从而完成组件初始化（注册）

路由组件本身可以通过`beforeRouteEnter`钩子获取；获取后代组件，主要在于获取组件挂载名（key）和组件实例（val），而本身就是一颗组件树，问题就转变为了由根节点递归一棵树，查阅源码后，知道了在vue中主要利用两个属性：

- 组件实例：$children`

- 组件名：`$options.__file`

要注意两点：

1. 注册逻辑要发生在页面根组件的mounted中，这样才能保证所有子组件挂载完成（参见【前置条件】中生命周期顺序）
2. 数据变化导致后代组件装载卸载时，我们可以进行“dom diff”（幼稚园版，别笑啦），在组件挂载的mounted中判断其父组件的`uid`在不在当前已经收集到的组件列表中（用一个数组ids存储所有挂载组件的id），在则进行局部注册，不在则直接不管（说明其父组件是全局组件）

递归函数如下

```js
function _registerComp(rootCompInstance,rootCompName){
  		// 注册当前组件
      setVmInstance.call(rootCompInstance,rootCompName)
  		// 收集当前已注册组件的id，用以实现后面v-if导致的组件装、卸载情况
      ids.push(rootCompInstance._uid);
  		// 获取所有已挂载子组件
      let compsInstance = rootCompInstance.$children;
      compsInstance.forEach(comp => {
          let {err,result} = getVal(comp,'$options._componentTag');
          let compName;
          if(err){
            // // console.log('获取失败',rootCompInstance,comp);
              // compName = '获取失败'
          }else {
              compName = tf(result);
              // 递归加载 组件中的内容  w-todo 待添加引用关系 父子孙组件
              let filePathInfo = getVal(comp,`$options.__file`);
              // 如果找不到__file 说明是全局UI组件 忽略掉
              if(filePathInfo.err){ 

              }else {
                _registerComp(comp,compName)
              }
          }
          
      })
    }
```

##### 匹配多个路由的情况：注册逻辑可复用，关键是如何获取到所有匹配的路由对应组件

这道题，enenen，会者不难难者不会，有两个方案：一是借助洋葱模型，不断的在beforeRouteEnter的next中收集匹配到的实例；二是$route.matched，我也是很偶然的问了下坐旁边的大神同事才知道可以通过`$route.matched`获取。其返回的是一个数组，存储元素的数据结构中有两个属性`components.default.__file`和`instances.default`，分别可以获取组件名和组件实例，剩下的，直接复用上面的注册逻辑就好啦。

##### 扩展-洋葱模型：next实现原理

此处做一个扩展，有个需求：给定一堆函数，希望按顺序调用时，上一个函数控制下一个函数的执行时机，比如上一个函数执行时符合一个条件才继续执行下面的函数，不符合则中止调用，如何实现？

这其实就是我们常见的next的写法，不过分扩展，附上实现next的代码以供理解（此处假定数组中存入的是对象，其属性`handler`是给定函数），只说两句

1. 递归+手动控制索引idx控制函数数组的执行；
2. 装饰者，用一个函数去包裹真正要执行的函数，深度递归并将之传递给上一个函数以决定是否继续递归

```js
function compass(arr){
  let idx = 0;
  let next = () => { 
    if (idx === arr.length) {
      return out()
    }
    let layer = arr[idx++];
    // 这个match就是上层函数判断是不是需要继续执行下一个函数的逻辑
    if (layer.match(pathname)) {
      layer.handler(req,res,next);
    }else {
      next();
    }
  }
  next();
}
```

（其实支持多级路由的思考也是大神同事给的，果然idea才是区分码农和大神的分水岭，在此感谢）

![image-20210510090951831](https://tva1.sinaimg.cn/large/008i3skNly1gqd27bqhcjj30bl0bkgty.jpg)

##### 根据收集到的数据渲染页面

在`.vue`文件中，这是个很简单的问题，但在插件中，却牵扯了很多海面下的陈年往事，主要是：**jsx**、**h（creatElement）**、**render**和**vnode**的前世今生；如上面效果图，我想渲染的是一个`tabs`效果，其对应的代码是下面这样的。

```js
function generateTabs(opt,target,targetKey) {
        let {key,props = {}, style = {} , events = [],children = []} = opt;
        function _genPane(list) {
            return list.map(item=>{
                let {props={},content} = item;
                return h('el-tab-pane',{
                    props: {
                        ...props,
                        key: props.name
                    }
                },[content])
            })
        }
        return h('el-tabs',{
            props: {
                ...props,
                value: target[targetKey]
            },
            style,
            on: {
                ...events,
                'tab-click':(item)=>{
                    target[targetKey] = item.name
                }
            }
        },_genPane(children))      
    }
```

其中我们常见的`v-model`对应在jsx属性中`value`和事件`tab-click`；从中我们也能真正理解之前背的八股文了：v-model是change和value的语法糖。

至于几个关键词的关系，限于篇幅只能在下一篇文章中详细解释，只说一句话：真实dom根据虚拟dom即vnode生成，而render就是返回虚拟dom的函数，h函数是creatElement函数的别名，用于根据配置项生成vnode。

##### 前置条件

- 考虑无侵入，采用vue的插件机制；

- 考虑是debug插件，对外暴露`isDev`的配置项（具体阅读【配置项】），如果是测试环境才接入插件

- 路由守卫在父子组件中的生命周期钩子执行顺序

  ```
  父beforeRouteEnter - 父beforeMount - 子beforeMount  - 父beforeRouteEnter-next - 子mounted - 父mounted
  ```

- beforeRouteEnter中支持如下写法获取组件实例，假设三级父子路由嵌套，此钩子会匹配三次，而根据洋葱模型原则，我们可以持有一个变量用于存储路由匹配到的组件，最后一次next函数的赋值就是我们要的最深的路由匹配组件

  ```js
   beforeRouteEnter (to, from, next) {
            next(vm => {
              // console.log('beforeRouteEnter==',vm.$options.name); 
              // 最后一个被路由匹配上的就是页面组件
              pageVm = vm;
            })
          },
  ```

  ![image-20210508173227578](https://tva1.sinaimg.cn/large/008i3skNly1gqb5hnjmh6j30a901tt8l.jpg)

### 具体实现

##### 获取组件实例

分两种情况：
- 第一次页面初始化 ：在最外层页面组件的mounted才进行插件的初始化，这样就可以避免重复注册的性能浪费
- v-if导致页面中组件的装载卸载 ：如果其组件的父组件在当前收集中心中，就根据当前页面实例重置收集中心列表（w-todo：待优化比对过程）
  - 假设多个组件挂载, 就会触发多次重置, 此处借助nextTick实现原理,进行一层优化,采用微任务进行注册，且使用防抖。

###### 部分具体实现相关代码如下

```js
mounted(){
  let ids = getCurrentIds()
  if( this.$parent && ids.indexOf(this.$parent._uid) !== -1){
    emitInitVmDebuPlugin()
  }
  if(currentPageVm && currentPageVm._uid == this._uid){
    emitInitVmDebuPlugin()
  }
}
// 触发初始化插件逻辑 根据所有页面组件进行收集中心初始化
export function emitInitVmDebuPlugin(){
    //  // console.log('开始注册逻辑 订阅');
    // 根据页面组件获取其对应的收集中心 （考虑都要支持多级路由 此处为将所有PageVmHandler进行收集中心的初始化）
    function initVmDebuPlugin(){
      // // console.log('开始注册逻辑 发布')
    	// 初始化逻辑
    }
    // 避免重复调用
    nextTick(initVmDebuPlugin)
}
```

##### 扩展-nextTick：延迟执行原理

此处做一个扩展，有个需求，异步数据使得vue数据改变导致页面变更，希望能拿到dom。很自然的我们会想到`this.$nextTick`，那他是怎么做到的呢？还有，我们多次改变属性值时，页面其实只刷新了一次，又是怎么实现的？

同样言简意赅的说，事件环微任务+防抖且去重，大家程度不一，本菜尽可能快速科普一下。

###### 事件环机制

事件环机制对客户端而言，可以简单理解为存在两个队列，分别存放宏任务（setTimeout、setInterval、Promise的构造函数是同步的、setImmediate、I/O、UIrendering）和微任务（Promise的回调(then)、process.nextTick）

1. js文本在进行解析后，会将文件中的任务进行分配为：主线程队列，微任务队列和宏任务队列
2. 主线程队列会依次从队列中pop到调用栈中执行，在执行中如果内部包含微任务/宏任务则会再次推入微任务队列/宏任务队列
3. 主任务队列执行完毕后，会查看微任务队列&宏任务队列中是否有需要执行的任务，拥有的话，将其推入到主任务队列。
4. 循环上述操作，形成js的执行环

根据这种机制，Vue中会将函数放在微任务中，比如`Promise.resolve()`，这样就能等到页面dom已经挂载上再去获取了。

防抖且去重，这没啥，设个开关和定时器就好；去重可以用Set`[...new Set(list)]`，废话不多说，`show me code`

```js
let callbacks = [];
let waiting = false;
function flushCallbacks(...params) {
  callbacks = [...new Set(callbacks)]
  for (let i = 0; i < callbacks.length; i++) {
      let callback = callbacks[i];
      callback(...params);
  }
  waiting = false;
  callbacks = [];
}

export function nextTick(cb,...params) {
  callbacks.push(cb); // 默认的cb 是渲染逻辑 用户的逻辑放到渲染逻辑之后即可
  if (!waiting) {
      waiting = true;
      // 1.promise先看支持不支持 
      // 2.mutationObserver
      // 3.setImmdiate
      // 4.setTimeout  Vue3 next-tick就直接用了promise
      Promise.resolve().then(()=>{
        flushCallbacks(...params)
      }); // 多次调用nextTick 只会开启一个promise
  }
}
```

nextTick的兼容判断我在自己的插件里没用这么复杂，对这个有兴趣的同学可以自行了解下，核心源码如下

```js
if (typeof Promise !== 'undefined' && isNative(Promise)) {
  const p = Promise.resolve()
  timerFunc = () => {
    p.then(flushCallbacks)
    // In problematic UIWebViews, Promise.then doesn't completely break, but
    // it can get stuck in a weird state where callbacks are pushed into the
    // microtask queue but the queue isn't being flushed, until the browser
    // needs to do some other work, e.g. handle a timer. Therefore we can
    // "force" the microtask queue to be flushed by adding an empty timer.
    if (isIOS) setTimeout(noop)
  }
  isUsingMicroTask = true
} else if (!isIE && typeof MutationObserver !== 'undefined' && (
  isNative(MutationObserver) ||
  // PhantomJS and iOS 7.x
  MutationObserver.toString() === '[object MutationObserverConstructor]'
)) {
  // Use MutationObserver where native Promise is not available,
  // e.g. PhantomJS, iOS7, Android 4.4
  // (#6466 MutationObserver is unreliable in IE11)
  let counter = 1
  const observer = new MutationObserver(flushCallbacks)
  const textNode = document.createTextNode(String(counter))
  observer.observe(textNode, {
    characterData: true
  })
  timerFunc = () => {
    counter = (counter + 1) % 2
    textNode.data = String(counter)
  }
  isUsingMicroTask = true
} else if (typeof setImmediate !== 'undefined' && isNative(setImmediate)) {
  // Fallback to setImmediate.
  // Technically it leverages the (macro) task queue,
  // but it is still a better choice than setTimeout.
  timerFunc = () => {
    setImmediate(flushCallbacks)
  }
} else {
  // Fallback to setTimeout.
  timerFunc = () => {
    setTimeout(flushCallbacks, 0)
  }
}
```

##### 解决持有实例导致内存泄漏问题

我们知道，一个对象如果存在引用，就会干扰js的垃圾回收，假设我们进行了页面跳转，收集中心仍保持旧页面实例，就会出现这个问题，这里我们可以采用路由守卫进行清空收集中心的处理。

这里只能点到为止，具体建议阅读【迭代优化】模块，是所有修复问题的心路历程。

###### 部分实现相关代码如下

```js
// 在页面跳转时清空插件
beforeRouteLeave(to, from, next){
  //  清空插件 考虑都要支持多级路由 调用所有的PageVmHandler的重置方法
  resetVmDebuPlugin()
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

其实核心思路也讲的差不多了，一句话：以页面为单元，收集当前已渲染的组件实例，用户可以自行切换（如目前的点击切换）当前查看变量指向哪个组件实例，至此，我们就可以快乐的抛弃`// console.log`啦（至少别那么常见zzz）。

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

###### 此时获取组件实例的思路

采用订阅发布模式，在插件的作用域中维系一个对象，key为`setVmInstance`传入的key，值为组件实例，

维护一个map数据结构（这样可以保证插入顺序和渲染顺序一致，下文代指收集中心），此为订阅；定义`setVm`函数，传入`key`则会在map上取出对应的实例，并将`$vm`指向此实例，此为发布；（重点思路，单页应用，也就意味着应用的单元为“页面”，也就是说我们研究的是页面组件及其对应的后台组件）

- 前置：`mixin中定义setVmInstance，在生命周期中其`this`就是指向当前渲染的组件实例，调用setVmInstance存入`vmMap`实现组件的订阅
- 订阅：首先在`beforeRouteEnter`获得页面组件实例，进行深度递归注册，其中核心点是根据`$children`属性获取子组件
- 发布：组件的切换就是通过key从`vmMap`中获取对应组件然后切换效果图里的`$vm`指向即可。

##### 重构：支持多级路由及动态装卸载组件

这是目前最新一版，思路在正文中，就不赘述啦

- 存在问题
  - 强依赖`elementUi`待扩展为可以动态支持UI库，提升扩展性（最近公司太忙了，下次一定，下次一定~）
- 解决问题
  - 支持多级路由
  - 支持`v-if`导致的组件装卸载

##### 解决路由跳转的问题 钩子不触发的问题
/**
    * 收集每级路由对应页面收集中心 
    * 在子跳父级别页面跳转时，不会触发beforeRouteEnter钩子，这也意味着初始化插件逻辑不会被执行，所以我们需要在beforeRouteLeave中一个类似domdiff的处理
    *     1. 判断将要去的路由和当前路由匹配的组件有多少是相同的，如果没有，说明是无关页面跳转，之前逻辑ok
    *     2. 如果当前路由全包裹去路由，说明是子跳父，beforeRouteEnter钩子不执行，所以我们要利用beforeRouteLeave钩子splice当前的组件列表，保留重复项
    *     3. 如果是去路由全包裹当前路由，说明是父跳子，复用splice的数组，然后在进行去重即可
    *     4. 如果局部相同，说明是兄弟跳转，看匹配到哪个组件没有uid，即停止比对（因为兄弟跳转代表有组件是未挂载状态）
    * */

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