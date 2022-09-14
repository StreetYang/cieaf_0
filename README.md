# cieaf_0
a js web widget loader

# 安装
```
> npm i cieaf_0

// js file
import 'cieaf_0'
CIEAF(...)
```

# 使用
```
// (undefined) => object
CIEAF()         // 返回配置

// (boolean) => undefined
CIEAF(ture)     // 开启调试
CIEAF(false)    // 关闭调试

// (object, ?boolean) => object
CIEAF({ appId: 'APP000' })          // 追加配置
CIEAF({ appId: 'APP000' }, true)    // 替换配置
CIEAF({ appId: 'APP000' }, false)   // 追加配置

// 配置
CIEAF.config.mode = 'prod'                          // 修改默认版本 'prod|uat|dev'
CIEAF.config.root = '/'                             // 修改默认服务地址
CIEAF.config.rootMap.def = 'https://a.com/'         // 修改服务映射
CIEAF.config.error = pack => console.warn(pack)     // 自定义全局错误处理

// (string) => PromiseWithPacks<PackResult>
CIEAF('marked')                     // 载入marked
CIEAF('marked#prod')                // 载入prod版本的marked prod|uat|dev
CIEAF('marked@def')                 // 载入def服务下的marked
CIEAF('marked@https://a.com/)       // 载入https://a.com/服务下的marked
CIEAF('marked#prod@def')            // 载入prod版本,def服务下的marked
CIEAF`marked`                       // 命令模式

// 载入marked，并执行里面的show('hello')
CIEAF('marked', ps => ps.show('hello'))             // (string, Function<PackResult>:any) => PromiseWithPack<markedResult>
CIEAF('marked', 'show')                             // (string, string) => Promise<showResult>
CIEAF('marked', ['show', 'hello'])                  // (string, Array<any>) => Promise<showResult>
CIEAF('marked show hello')                          // 命令模式
CIEAF('marked show ?', 'hello')                     // 命令模式：插值任意类型参数
CIEAF`marked show hello`                            // 命令模式：模板字符串
CIEAF`marked show ${'hello'}`                       // 命令模式：模板字符串，插值任意类型参数
CIEAF('marked').then(ps => ps.show('hello'))        // Promise模式
let ps = await CIEAF('marked'); ps.show('hello')    // await语法糖

// 批量载入(执行)
CIEAF(['marked', 'demo'])                                       // (Array<string>) => PromiseWithPacks<ArrResult>
CIEAF(['marked', 'demo'], pss => pss[0].show('hello'))          // (Array<string>, Function<PackResult>:any) => PromiseWithPacks<ArrResult>
CIEAF(['marked', 'demo']).then(pss => pss[0].show('hello'))     // Promise模式
let pss = await CIEAF(['marked', 'demo']); pss[0].show('hello') // await语法糖

// 参数3：错误处理和资源替换 object|function
CIEAF('name1', null, pack => { console.warn(pack) })            // 参数3可自定义错误方法
CIEAF('name2', ps => ps.show(1), { show(x) { alert(x) } })      // 参数3非undefined时做为替换对象，如果是方法执行后判定。

// 构建和预置部件
CIEAF(pack => ({ show(p) { alert(x) } }))                   // 构建部件
CIEAF(pack => ({ show(p) { alert(x) } }), 'packname')       // 预置部件并预置到packname下

// 其他
CIEAF.version   // 查看版本
CIEAF.packs     // 查看已经加载的包
CIEAF.config    // 查看配置
CIEAF.log(...)  // 使用内置log，只在CIEAF(true)时打印
```