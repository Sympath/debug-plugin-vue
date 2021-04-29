# debug-plugin

### 前言

##### 面向问题

Vue项目（如我司）经常会出现VueDevTool崩溃从而无法查看组件属性值的情况（其实个人感觉VueDevTool如果没有设置过滤公共组件，层级会很深很深，也挺麻烦），而一直打一个log看一下页面也确实挺烦，就尝试看能不能优化下这个问题，也会有缺陷，但进步是一步接一步嘛。

##### 解决后结果

1. 在控制台可以直接用`$vm`查看当前页面的vue实例从而查看数据（顺带解决了VueDevTool层级很深很深的麻烦）
2. 可以使用`setVm`切换`$vm`的指向，从而查看页面上指定的组件
3. 兼容了微前端的场景，同样可以处理，只是子应用的挂载的变量是`$fVm`而已

### 使用

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


### 待优化

-  后期应该改为【API转发工具】的能力，点击按钮进行切换，将`setVm`这种内部API隐藏起来更友好。
-  代码层采用mixin 统一使用name作为key，这样就可以直接Vue.mixin中的mounted方法去执行`setVmInstance`了，代码侵入性更低。

