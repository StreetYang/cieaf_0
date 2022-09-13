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
CIEAF();        // 返回配置

// (boolean) => undefined
CIEAF(ture);    // 开启调试
CIEAF(false);   // 关闭调试

// (object, ?boolean) => object
CIEAF({ appId: 'APP000' });         // 追加配置
CIEAF({ appId: 'APP000' }, true);   // 替换配置
CIEAF({ appId: 'APP000' }, false);  // 追加配置

CIEAF.config.mode = 'prod';     // 修改默认版本 'prod|uat|dev'
CIEAF.config.root = '/';        // 修改默认服务地址
CIEAF.config.rootMap.def = 'https://a.com/';        // 修改服务映射
CIEAF.config.error = pack => console.warn(pack);    // 自定义全局错误处理

// (string) => PromiseWithPacks<PackResult>
CIEAF('marked');            // 载入marked
CIEAF('marked#prod');       // 载入prod版本的marked
CIEAF('marked@def');        // 载入def服务下的marked
CIEAF('marked@https://a.com/);       // 载入https://a.com/服务下的marked
CIEAF('marked#prod@def');   // 载入prod版本,def服务下的marked
CIEAF`marked`;              // 命令方式载入marked

// 载入marked，并执行里面的show('hello')
CIEAF('marked', ps => ps.show('hello'));    // (string, Function<PackResult>:any) => PromiseWithPack<markedResult>
CIEAF('marked', ['show', 'hello']);         // (string, Array<any>) => Promise<showResult>
CIEAF`marked show ${'hello'}`;
CIEAF`marked show hello`;
CIEAF('marked').then(ps=>ps.show('hello'));
let ps=await CIEAF('marked'); ps.show('hello');

// 批量载入(执行)
CIEAF(['marked', 'demo']);                  // (Array<string>) => PromiseWithPacks<ArrResult>
CIEAF(['marked', 'demo'], pss => pss[0].show('hello'));             // (Array<string>, Function<PackResult>:any) => PromiseWithPacks<ArrResult>
CIEAF(['marked', 'demo']).then(pss => pss[0].show('hello'));
let pss = await CIEAF(['marked', 'demo']); pss[0].show('hello');

// 错误和替换
CIEAF('name1', null, pack=>{console.warn(pack)})    // 参数3可自定义错误方法
CIEAF('name2', ps=>ps.show(1), {show(x){alert(x)}}) // 参数3非undefined时做为替换对象，如果是方法执行后判定。

// 构建部件
CIEAF(pack => console.log(pack));
```