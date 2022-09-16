# cieaf_0
a js source loader

# 安装
```
> npm i cieaf_0
```

# 使用
```
import 'cieaf_0'
CIEAF(...)
```

# API
```
// 使用配置 (undefined) => object
CIEAF()                                 // 返回配置
        
// 进行配置 (object, ?boolean) => object
CIEAF({ appId: 'APP000' })              // 追加配置
CIEAF({ appId: 'APP000' }, false)       // 追加配置
CIEAF({ appId: 'APP000' }, true)        // 替换配置，慎用

// 配置
CIEAF.config.mode = 'prod'                          // 修改默认版本 'prod|uat|dev'
CIEAF.config.host = './'                            // 修改资源包主机路径/主机名
CIEAF.config.hosts.dev = './'                       // 修改资源包主机映射
CIEAF.config.error = pack => console.warn(pack)     // 自定义全局错误处理

// 载入资源 (string) => PromiseWithPacks<PackResult>
CIEAF('pack1')                                      // 载入pack1
CIEAF('pack1#prod')                                 // 载入prod版本的pack1 prod|uat|dev
CIEAF('pack1@dev')                                  // 载入dev主机下的pack1
CIEAF('pack1@./)                                    // 载入"./"主机下的pack1
CIEAF('pack1#prod@dev')                             // 载入prod版本,dev服务下的pack1
CIEAF`pack1`                                        // 命令模式

// 载入资源，执行方法
CIEAF('pack1', ps => ps.show('hello'))              // (string, Function<PackResult>:any) => PromiseWithPack<pack1Result>
CIEAF('pack1', 'show')                              // (string, string) => Promise<showResult>
CIEAF('pack1', ['show', 'hello'])                   // (string, Array<any>) => Promise<showResult>
CIEAF('pack1 show hello')                           // 命令模式
CIEAF('pack1 show ?', 'hello')                      // 命令模式：插值任意类型参数
CIEAF`pack1 show hello`                             // 命令模式：模板字符串
CIEAF`pack1 show ${'hello'}`                        // 命令模式：模板字符串，插值任意类型参数
CIEAF('pack1').then(ps => ps.show('hello'))         // Promise模式
(await CIEAF('pack1')).show('hello')                // await语法糖

// 批量载入，都成功后执行
CIEAF(['pack1', 'pack2'])                                       // (Array<string>) => PromiseWithPacks<ArrResult>
CIEAF(['pack1', 'pack2'], pss => pss[0].show('hello'))          // (Array<string>, Function<PackResult>:any) => PromiseWithPacks<ArrResult>
CIEAF(['pack1', 'pack2']).then(pss => pss[0].show('hello'))     // Promise模式
(await CIEAF(['pack1', 'pack2']))[0].show('hello')              // await语法糖

// 参数3：错误处理和资源替换 object|function
CIEAF('pack8', null, pack => { console.warn(pack) })            // 自定义错误方法
CIEAF('pack9', ps => ps.show(1), { show(x) { alert(x) } })      // 返回非undefined时，做为替换对象，如果是方法执行后判定

// 构建和预置资源
CIEAF(pack => ({ show(p) { alert(x) } }))                       // 构建资源
CIEAF(pack => ({ show(p) { alert(x) } }), 'pack3')              // 构建资源并预置到pack3下

// 其他
CIEAF.version           // 查看版本
CIEAF.config            // 查看配置
CIEAF.packs             // 查看已经加载的包
CIEAF(true)             // 开启调试
CIEAF(false)            // 关闭调试
CIEAF.log(...)          // 使用内置log，只在CIEAF(true)时打印
```
