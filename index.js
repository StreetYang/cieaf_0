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
        rootMap: { def: ROOT }
    };

    // 递增数
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

    // 低版本浏览器木有Array.prototype.at
    function at(src, index) {
        if (src instanceof Array)
            return src[index];
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

            // 就绪状态
            t.ready = false;

            // 包就绪队列
            t.queue = [];

            // 包的资源
            t.src = undefined;

            let url;
            switch (mode) {
                case 'prod':
                    // 生产环境
                    url = `${root}${name}/`;
                    break;

                case 'uat':
                    // 用户测试环境
                    url = `${root}${name}/uat/`;
                    break;

                case 'dev':
                    // 开发环境
                    url = `${root}`;
                    break;

                default:
                    throw 'mode needs prod|uat|dev';
            }

            url += `index.js?_v=${Date.now().toString(36)}`;
            log('load', name, url, t);

            document.head.appendChild(Object.assign(
                document.createElement('script'),
                {
                    src: url,
                    type: mode === 'dev' ? 'module' : 'text/javascript',
                    async: 'async',
                    onload() {
                        t.src = initers.shift().call(null, t) || {};
                        t.ready = true;

                        log('onload', name, t.src);
                        t.run();
                    },
                    onerror(e) {
                        log('onerror', name, e);

                        // 执行自定义错误处理方法，如果有返回值，用返回替换结果，值继续执行
                        if (typeof fail === 'function') {
                            const r = t.src = fail(t);
                            log('fail.src', name, r);
                            if (r) {
                                t.ready = true;
                                t.run();
                            }
                        }
                    }
                }
            ));
        }

        add(fn, runId) {
            if (runId)
                fn.runId = runId;
            this.queue.push(fn);
            this.ready && this.run();
        }

        run() {
            const { queue, src } = this;
            while (queue.length) {
                const f = queue.shift();
                const r = f.call(null, src);
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
        const argArr = [...arguments];

        // 查看全局配置
        if (type === 'undefined') {
            return config;
        }

        // 加载包
        if (type === 'string') {
            let args = null;

            // 语句转化为命令
            const mch = exp.match(/([\S]+)\s+(\w+)(.+)?/);
            if (mch) {
                exp = mch[1];
                success = mch[2];
                const arg = mch[3]?.trim();
                args = arg ? [arg] : argArr.slice(1);
            }

            const name = at(exp.match(/^\w+/), 0);
            const pack = packs[name] = packs[name] || new Pack(exp, fail);
            const type2 = typeof success;

            // 执行方法
            if (type2 === 'function') {
                pack.add(success);
            }

            // 执行命令
            if (type2 === 'string') {
                const runId = ++newId;
                return new Promise(next => {
                    pack.on(`run${runId}`, e => next(e));
                    if (!args)
                        args = argArr.slice(2)
                    pack.add(ps => ps[success](...args), runId);
                });
            }

            return pack;
        }

        // 初始化包（包内调用）
        if (type === 'function') {
            initers.push(exp);
            return;
        }

        // 批量加载包
        if (exp instanceof Array) {

            // 标签字符串语法，转换为指令模式
            if (exp.raw) {
                return main(exp[0], ...(argArr.slice(1)));
            }

            const r = [];

            let len = exp.length;
            const fn = (typeof success === 'function')
                ? () => {
                    if (--len) return;
                    success.call(null, exp.map(n => packs[n].src));
                } : null;

            exp.forEach(n => {
                const name = at(exp.match(/^\w+/), 0);
                const pack = packs[name] = packs[name] || new Pack(n, fail);
                fn && pack.add(fn);
                r.push(pack);
            });

            return r;
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
        version: '0.1.4',
        config,
        packs,
        useLog,
        log,
        Pack,
        Event,
        load(exp) {
            return new Promise((success, fail) => {
                main(exp, src => success(src), pack => fail(pack));
            })
        },
        token() {
            return btoa(`${config.appid}-${config.uCode}`);
        },
    })
})('CIEAF');

export default window.CIEAF;
