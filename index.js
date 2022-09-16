/*!
 * CIEAF 0.4.0
 * Released under MIT License
 */

const __DEFINE__ = {
    ROOT: '//cieaf.bba/cieaf-plugin/',
    DOC: 'https://cieaf.bba/cieaf-plugin/'
};

(NS => {
    'use strict'

    if (window[NS]) return;

    const ROOT = __DEFINE__.ROOT;
    const DOC = __DEFINE__.DOC;

    const RGX_NAME = /^(.+?)(#|@|\s|$)/;
    const RGX_MODE = /\#(\w+)/;
    const RGX_ROOT = /\@(.+)$/;
    const RGX_SPACE = /\s+/;

    // global config
    let config = {
        rootMap: { def: ROOT },
        error(pack) {
            console.error(`>>> ${NS}`, `load [${pack.name}] fail`);
            console.log(pack);
        }
    };

    // a no repeat key
    let newId = 0;

    // packs loaded
    const packs = {};

    // init functions queue
    const initers = [];

    // inner log
    let useLog = false;
    function log(...arg) {
        useLog && console.log(`>>> ${NS}`, ...arg);
    }

    // get packname / packmode / packroot
    const at = (src, i) => (src instanceof Array) ? src[i] : undefined;
    const getName = exp => at(exp.match(RGX_NAME), 1);
    const getMode = exp => at(exp.match(RGX_MODE), 1);
    const getRoot = exp => at(exp.match(RGX_ROOT), 1);

    // convert tag function arguments
    // args: [['packname packname args ...', ' ', ...], arg1, ...]
    function makeArgs(args) {
        const tpl = [...args.shift()];      // ['packname packname args ...', ' ', ...] is readonly
        const cmd = tpl.shift().trim();     // 'packname packname args ...'
        const arr = cmd.split(RGX_SPACE);   // ['packname', 'packname', 'args', ...]
        while (args.length) {
            arr.push(args.shift());         // + arg1
            const c = tpl.shift().trim();   // + tepmlate split
            if (c) {
                arr.push(...c.split(RGX_SPACE));
            }
        }
        return arr;
    }

    // simple event
    class Evt {
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

    // source package
    class Pack extends Evt {
        constructor(exp, fail) {
            super();
            const t = this;

            // packname
            const name = t.name = getName(exp);

            // source status => -1:fail, 0:init, 1:parsing, 2:done, 3:done by fixed source
            t.status = 0;

            // run function after status done
            t.queue = [];

            // pack source
            t.source = undefined;

            // preset source mode
            if (fail === true) return;

            // pack mode => prod / uat / dev
            const mode = t.mode = getMode(exp) || config.mode || 'prod';

            // pack root
            let root = t.root = getRoot(exp) || config.root || 'def';
            root = config.rootMap[root] || root;

            // make url
            let url, v;
            switch (mode) {
                case 'prod':
                    // product env
                    url = `${root}${name}/`;
                    v = parseInt(Date.now() / 36e5).toString(36);
                    break;

                case 'uat':
                    // user-test env
                    url = `${root}${name}/uat/`;
                    v = parseInt(Date.now() / 6e4).toString(36);
                    break;

                case 'dev':
                    // development env
                    url = `${root}`;
                    v = parseInt(Date.now() / 1e3).toString(36);
                    break;

                default:
                    throw 'mode needs prod|uat|dev';
            }

            t.url = url += `index.js?_=${v}`;
            log('load', name, url, t);

            const el = document.createElement('script');
            Object.assign(el, {
                src: url,
                type: mode === 'dev' ? 'module' : 'text/javascript',
                async: 'async',
                onload() {
                    t.status = 1;
                    const initer = initers.shift();
                    if (initer)
                        t.source = initer.call(null, t);
                    t.status = 2;

                    log('onload', name, t.source);
                    t.run();
                    el.remove();
                },
                onerror() {
                    (typeof config.error === 'function') && config.error(t);

                    t.status = -1;

                    // user fail
                    const type3 = typeof fail;
                    if (type3 === 'function')
                        fail = fail(t);

                    // when have fixed source, run like success
                    if (fail !== undefined) {
                        log('fail.source', name, fail);
                        t.source = fail;
                        t.status = 3;
                        t.run();
                    }

                    // if fail, clear function queue 
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

            // if has runId, emit a event when it run
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

    const main = window[NS] = function (exp, success, fail) {
        const type = typeof exp;

        // show global config
        if (type === 'undefined') {
            return config;
        }

        // load a pack
        if (type === 'string') {
            exp = exp.trim();

            // if exp has any space, transfor to: packname, [fname, p1, ...]
            if (exp.includes(' ')) {
                const arr = exp.split(RGX_SPACE);
                exp = arr.shift();

                let i = 0;
                success = arr.map(n => {
                    if (n !== '?') return n;
                    return arguments[++i];
                });
            }

            const name = getName(exp);
            const pack = packs[name] = packs[name] || new Pack(exp, fail);
            const type2 = typeof success;

            // default mode: load and run function
            if (type2 === 'function') {
                pack.add(success);
            }

            // command mode: load and run one/none function build with array
            if (type2 === 'string')
                success = success.split(RGX_SPACE);
            if (success instanceof Array) {
                const fname = success.shift();
                if (fname) {
                    return new Promise(next => {
                        pack.on(`run${++newId}`, e => next(e));
                        pack.add(ps => ps[fname](...success), newId);
                    });
                }
            }

            const pm = new Promise(next => {
                pack.add(ps => next(ps));
            });
            pm.pack = pack;

            return pm;
        }

        // load pack array
        if (exp instanceof Array) {

            // tag-string mode to command mode
            if (exp.raw) {
                const arr = makeArgs([...arguments]);
                const pname = arr.shift();
                if (pname)
                    return main.call(null, pname, arr);
                else
                    return main();
            }

            // load array
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

        // init pack
        if (type === 'function') {
            initers.push(exp);

            // preset pack
            if (typeof success === 'string') {
                const name = getName(success);
                const pack = packs[name] = new Pack(success, true);
                pack.status = 1;

                const initer = initers.shift();
                if (initer)
                    pack.source = initer.call(null, pack);

                pack.status = 2;
                pack.run();
            }

            return;
        }

        // set global config
        if (type === 'object') {
            return success
                ? (config = exp)
                : Object.assign(config, exp)
        }

        // open / close log
        if (type === 'boolean') {
            useLog = exp;
            console.dir(main);
            log(`Document: ${DOC}`);
        }
    }

    Object.assign(main, {
        version: '0.4.1',
        config,
        packs,
        log,
    })
})('CIEAF'); 