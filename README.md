### 前言

介绍文章：https://juejin.cn/post/6960482093788823583#comment

- [NPM包](https://www.npmjs.com/package/vue-debug-plugin)
- [Github](https://github.com/Sympath/debug-plugin-vue)
- vue-debug-plugin对应的[DEMO仓库](https://gitee.com/zzmwzy/vue-debug-plugin-demo)

### 使用方法指南

本插件面向两个问题

- 定位（路由）组件对应文件困难
- 页面状态的修改在本地热更新耗时、线上脏数据问题难以定位

我们来逐一了解，本插件在使用层面上是如何解决这个问题的

##### 定位（路由）组件对应文件困难

 		我们在页面上找到`$vm`这个悬浮按钮，点击后会出现一个弹窗，弹窗面板上

- 左侧是当前匹配到的路由，可能存在父子路由情况，所以左侧可能有多个路由

- 右侧是当前路由对应的所有组件，面板上的key为文件名转驼峰

  当悬浮时组件对应渲染dom区域会高亮，组件文件地址也会出现在`toolTip`上，这样就解决了路由定位的问题

![image-20211216091140504](https://tva1.sinaimg.cn/large/008i3skNly1gxfel0cjvdj31f10kf412.jpg)

对应原理大致如下图，具体可以看前言中的介绍文章：https://juejin.cn/post/6960482093788823583#comment

![image-20211216091120113](https://tva1.sinaimg.cn/large/008i3skNly1gxfel5opinj30vq0fwwgt.jpg)

##### 页面状态控制

​		细化而言，页面状态的修改在本地热更新耗时、线上脏数据问题难以定位，这里我们需要转换一个思路，前端组件化是目前的大势所趋，我们在处理页面时，规模再划分细一点，其实就是在处理组件，而组件说到底就是个实例对象，只不过它是个Vue组件实例对象而已。

​		本地改页面状态麻烦在于要做三步：

1. 找到区域对应组件文件
2. 更改代码
3. 等待页面热更新	

这还不包括如果我们只是尝试，还得将这块代码删掉。

​		线上页面状态控制的麻烦更多同学会感同身受，要么脏数据排查问题，明明本地是好的，线上这条数据就是出不来；要么改了个小东西，本地有，测试环境就是不生效；要么运营要求测试走单，希望放开限制，结果我们又得开发构建部署、还得在他们测试再改回去。

​		其实无论是本地改页面状态，还是线上页面状态问题，都在于我们能不能在内存层面直接控制组件实例，因为我们一改内存里组件状态，根据数据劫持，页面ast树就会重新`render`。

​		先看用法：在开发、测试环境插件默认开启，在window上挂载了一个变量`$vm`，默认指向路由组件实例；当点击的时候会切换为指向点击的组件实例，这样我们就能直接操作`$vm`做很多事情了。

​		举例而言，默认输入框禁用，测试可以手动开启

![2021-12-16 10.30.32](https://tva1.sinaimg.cn/large/008i3skNly1gxfgyufxoig31d60q87th.gif)



更甚者，可以使用代码执行，这样测试都可以不用熟悉这个插件的使用方法，如下

```
控制台执行：_vmDebugger.setVm('kdInsuranceDialog',true).readCardDisabled = false @测试同学
```

其中`_vmDebugger`是插件控制对象，有很多实用的方法，在下文详细描述

![2021-12-16 10.36.26](https://tva1.sinaimg.cn/large/008i3skNly1gxfh2uxlqpg31g00l6u0x.gif)



### 接入插件示例

##### 安装依赖

```
npm i vue-debug-plugin
```

##### 引入并配置

```js
import vueDebugPluginFn from 'vue-debug-plugin';
```

这里会暴露一个高级函数，作为配置参数的传递入口，接收一个配置对象，返回插件实例本身，配置对象属性在后文详细描述，下面是一个示例

补充，这里会用到判断当前环境是开发、测试、正式环境的方法，可以参考如下实现

```js
import { isDevForBoth, isLocal } from './utils/tools';
# /utils/tools
/**
 * 包括测试环境和本地开发环境，数据层面是不隔离的
 * @returns
 */
export function isDevForBoth () {
  // 数据层面 测试环境和本地是不隔离的
  return isDev() || isLocal();
}

/**
 * // 判断是否为测试环境
 * @returns
 */
export function isDev () {
  return process.env.VUE_APP_CURRENTMODE === 'test';
}

/**
 * // 判断是否为本地开发环境
 * @returns
 */
export function isLocal () {
  return process.env.VUE_APP_CURRENTMODE === 'development';
}
```

在main.js中引入

```js
const vueDebugPlugin = vueDebugPluginFn({
  msgboxWidth: '',
  msgboxHeight: 356,
  ignoreCompsPrefix: ['el'], // 忽略的组件前缀
  ignoreComps: ['tableBody', 'tableHeader', 'vitIcon', 'transition'], // 忽略的组件
  // 是否展示未查询到文件地址的组件，是本地就过滤 是测试环境或线上就打开
  filterDepends: !!isLocal(),
  isDev: isDevForBoth,
  hasElementUI: true // 项目是否接入了elementUi
  // isMapp: true 如果是子应用 需要设置为true  无微应用可以忽略
});
```

##### 启动插件

```javascript
Vue.use(vueDebugPlugin);
```

##### 完整示例

```js
import vueDebugPluginFn from 'vue-debug-plugin';
import { isDevForBoth, isLocal } from './utils/tools';
// 支持传递配置对象，对象属性及默认值如下
const vueDebugPlugin = vueDebugPluginFn();
```



### 属性查阅表
配置对象默认值
```js
{
  msgboxWidth: '',
  msgboxHeight: 356,
  ignoreCompsPrefix: ['el'], // 忽略的组件前缀
  ignoreComps: ['tableBody', 'tableHeader', 'vitIcon', 'transition'], // 忽略的组件
  // 是否展示未查询到文件地址的组件，是本地就过滤 是测试环境或线上就打开
  filterDepends: !!isLocal(),
  isDev: isDevForBoth,
  hasElementUI: true // 项目是否接入了elementUi
  // isMapp: true 如果是子应用 需要设置为true  无微应用可以忽略
}
```
##### 配置对象属性

| 配置项            | 类型                | 作用                                                         | 是否必填 | 默认值 |
| ----------------- | ------------------- | ------------------------------------------------------------ | -------- | ------ |
| isDev             | Function \| Boolean | 判断是否是开发环境 如果函数返回为true才接入插件（传入true也行）；默认参数会传递当前页面路径（window.location） | 是       | false  |
| filterDepends     | Boolean             | 是否展示未查询到文件地址的组件，一般处理为是本地就过滤 是测试环境或线上就打开 | 是       | false  |
| hasElementUI      | Boolean             | 项目是否接入了elementUi ，如果接入了则采用其进行优化         | 否       | false  |
| msgboxWidth       | Number              | 弹窗面板宽度                                                 | 否       | --     |
| msgboxHeight      | Number              | 弹窗面板高度                                                 | 否       | --     |
| ignoreCompsPrefix | Array               | 忽略的组件前缀，用于忽略一些类似公共组件之类不需要考虑的组件 | 否       | []     |
| ignoreComps       | Array               | 忽略的组件，用于精准排除某些插件                             | 否       | []     |
| getMappWinodow    | Function            | 获取子应用的全局变量 （如果不需要承接微应用可以不传递）；默认参数会传递路由对象和当前页面组件实例 | 否       | ()=>{} |
| isMapp            | Boolean             | 微应用场景下，子应用也需要引入此插件，如果是子应用 需要将此值设置为true | 否       | False  |



##### 插件控制对象常用方法

```
 /** setVm
   * 代码层面切换当前指向的组件实例
   * @param {*} value 匹配索引 可以是索引 也可以是对象key
   * @param {*} isKey 是否是对象key模式
   * @returns 切换的组件实例对象
   */
```



```
 /** setRouteVm
   * 切换当前路由，默认会将$vm指向新路由对应的组件
   * @param {*} index 匹配索引 可以是索引 也可以是对象key
   * @param {*} ...setVmParams  可以传递多个参数，将会传递给setVm用以切换指向的组件实例
   * @returns 切换的组件实例对象
   */
```


