const __DEFINE__ = {
    ROOT: '//cieaf.bba/cieaf-plugin/',
    DOC: 'https://cieaf.bba/cieaf-plugin/'
};

(NS => {
    'use strict'

    const ROOT = __DEFINE__.ROOT;
    const DOC = __DEFINE__.DOC;

    // 避免重复加载
    if (window[NS]) return;

    // 全局配置
    let config = {
        rootMap: { def: ROOT },
        error(pack) {
            console.error('>>> ' + NS, `load [${pack.name}] fail`);
            console.log(pack);
        }
    };

    // 不重复的标识
    let newId = 0;

    // 已加载的包
    const packs = {};

    // 包初始化队列
    const initers = [];

    // 日志
    let useLog = false;
    function log(...arg) {
        useLog && console.log('>>> ' + NS, ...arg);
    }

    // Array.prototype.at
    function at(target, index) {
        if (target instanceof Array)
            return target[index];
    }

    // 标签转命令，制作参数 args:[['packname packname args ...', ' ', ...], arg1, ...]
    function makeArgs(args) {
        const tpl = [...args.shift()];      // 模板数组只读，需要转成新数组
        const cmd = tpl.shift().trim();
        const arr = cmd.split(/\s+/);
        while (args.length) {
            arr.push(args.shift());
            const c = tpl.shift().trim();
            if (c) {
                arr.push(...c.split(/\s+/));
            }
        }
        return arr;
    }

    // 事件
    class Event {
        constructor() {
            this.event = {};
        }

        on(type, fn) {
            (this.event[type] = this.event[type] || []).push(fn);
        }

        off(type, fn) {
            type || (this.event = {});
            fn || (delete this.event[type]);

            let arr = this.event[type];
            if (!arr) return;

            this.event[type] = arr.filter(n => n !== fn);

            arr.length || (delete this.event[type]);
        }

        emit(type, para) {
            const arr = this.event[type];
            arr && arr.forEach(n => n.call(null, para));
        }
    }

    // 资源包
    class Pack extends Event {
        constructor(exp, fail) {
            super();
            const t = this;

            // 名称
            const name = t.name = at(exp.match(/^\w+/), 0);

            // 模式
            const mode = t.mode = at(exp.match(/\#(\w+)/), 1) || config.mode || 'prod';

            // 来源
            let root = t.root = at(exp.match(/\@(.+)$/), 1) || config.root || 'def';
            if (config.rootMap) {
                root = config.rootMap[root] || root;
            }

            /** 状态 0:初始化 1:解析中 2:完成 3:错误替换 -1:失败 */
            t.status = 0;

            // 包就绪队列
            t.queue = [];

            // 包的资源
            t.source = undefined;

            let url, v;
            switch (mode) {
                case 'prod':
                    // 生产环境
                    url = `${root}${name}/`;
                    v = parseInt(Date.now() / 36e5).toString(36);
                    break;

                case 'uat':
                    // 用户测试环境
                    url = `${root}${name}/uat/`;
                    v = parseInt(Date.now() / 6e4).toString(36);
                    break;

                case 'dev':
                    // 开发环境
                    url = `${root}`;
                    v = parseInt(Date.now() / 1e3).toString(36);
                    break;

                default:
                    throw 'mode needs prod|uat|dev';
            }

            url += `index.js?_=` + v;

            t.url = url;
            log('load', name, url, t);

            const el = document.createElement('script');
            Object.assign(el, {
                src: url,
                type: mode === 'dev' ? 'module' : 'text/javascript',
                async: 'async',
                onload() {
                    t.status = 1;
                    t.source = initers.shift().call(null, t) || {};
                    t.status = 2;

                    log('onload', name, t.source);
                    t.run();
                    el.remove();
                },
                onerror() {
                    (typeof config.error === 'function') && config.error(t);

                    t.status = -1;

                    // 执行自定义错误处理方法，如果有返回值，用返回替换结果，值继续执行
                    const type3 = typeof fail;
                    if (type3 === 'function')
                        fail = fail(t);
                    if (fail !== undefined) {
                        log('fail.source', name, fail);
                        t.source = fail;
                        t.status = 3;
                        t.run();
                    }

                    if (t.status === -1)
                        t.queue = undefined;

                    el.remove();
                }
            })
            document.head.appendChild(el);
        }

        add(fn, runId) {
            const status = this.status;
            if (status < 0) {
                (typeof config.error === 'function') && config.error(this);
                return;
            }

            if (runId)
                fn.runId = runId;
            this.queue.push(fn);
            (status > 1) && this.run();
        }

        run() {
            const { queue, source } = this;
            while (queue.length) {
                const f = queue.shift();
                const r = f.call(null, source);
                if (f.runId) {
                    const type = `run${f.runId}`;
                    this.emit(type, r);
                    this.off(type);
                }
            }
        }
    }

    // 主要方法
    const main = window[NS] = function (exp, success, fail) {
        const type = typeof exp;

        // 查看全局配置
        if (type === 'undefined') {
            return config;
        }

        // 加载包
        if (type === 'string') {
            const name = at(exp.match(/^\w+/), 0);
            const pack = packs[name] = packs[name] || new Pack(exp, fail);
            const type2 = typeof success;

            // 标准载入
            if (type2 === 'function') {
                pack.add(success);
            }

            // 载入后执行
            if (type2 === 'string')
                success = success.split(/\s+/);
            if (success instanceof Array) {
                const fname = success.shift();
                if (fname) {
                    const runId = ++newId;
                    return new Promise(next => {
                        pack.on(`run${runId}`, e => next(e));
                        pack.add(ps => ps[fname](...success), runId);
                    });
                }
            }

            const pm = new Promise(next => {
                pack.add(ps => next(ps));
            });
            pm.pack = pack;

            return pm;
        }

        // 批量加载包
        if (exp instanceof Array) {

            // 标签字符串语法，转换为指令模式
            if (exp.raw) {
                const arr = makeArgs([...arguments]);
                const pname = arr.shift();
                if (pname)
                    return main.call(null, pname, arr);
                else
                    return main();
            }

            // 批量载入
            const pms = exp.map(n => main(n));
            const pm = new Promise(next => {
                Promise.all(pms).then(r => {
                    if (typeof success === 'function')
                        success(r);
                    next(r)
                })
            })
            pm.packs = pms.map(n => n.pack);

            return pm;
        }

        // 初始化包（包内调用）
        if (type === 'function') {
            initers.push(exp);
            return;
        }

        // 全局配置
        if (type === 'object') {
            return success
                ? (config = exp)
                : Object.assign(config, exp)
        }

        // 打开/关闭日志
        if (type === 'boolean') {
            useLog = exp;
            console.dir(main);
            log(`Document: ${DOC}`);
        }
    }

    Object.assign(main, {
        version: '0.2.2',
        config,
        packs,
    })
})('CIEAF');
