import test from 'ava';
import throttle from '..';

function fn(cb: Function) {
    cb();
}

class Timeline {
    last: number;
    calls: number[] = [];

    push = () => {
        if (this.last) {
            this.calls.push(Date.now() - this.last);
        }
        this.last = Date.now();
    }

    getAvgPause() {
        return this.calls.reduce((acc, cur) => acc + cur) / this.calls.length;
    }

    isAround(pause: number, deviation: number = 5) {
        return this.calls.every(i => Math.abs(i - pause) < deviation);
    }

    inRange(from: number = 0, to: number = Infinity) {
        return this.calls.every(i => from < i && i < to);
    }
}

test('returns a function', t => {
    const throttled = throttle(fn, 10);
    t.is(typeof throttled, 'function');
});

test.cb('result function eventualy called', t => {
    const throttled = throttle(fn, 10);
    throttled(() => {
        t.end();
    });
});

test.cb('first call is immediate', t => {
    const start = Date.now();
    const throttled = throttle(fn, 100);
    throttled(() => {
        t.true(Date.now() - start < 5);
        t.end();
    });
});

test.cb('first call is sync', t => {
    const start = Date.now();
    const throttled = throttle(fn, 100);
    let after = false;
    throttled(() => {
        t.false(after);
        t.end();
    });
    after = true;
});

test.cb('second call is throttled', t => {
    const throttled = throttle(fn, 100);
    throttled(() => {});
    const start = Date.now();
    throttled(() => {
        t.true(Date.now() - start >= 100);
        t.end();
    });
});

test.cb('limited amount of calls', t => {
    t.plan(2);
    const throttled = throttle(fn, 100);
    for (let i = 0; i < 100; i++) {
        throttled(() => {
            t.pass();
        })
    };
    const start = Date.now();
    throttled(() => {
        t.pass();
        t.end();
    });
});

test.cb('recursive calls', t => {
    t.plan(2);
    const throttled = throttle(fn, 100);
    const tl = new Timeline();

    throttled(() => {
        t.pass();
        tl.push();
        throttled(() => {
            tl.push();
            t.true(tl.isAround(100));
            t.end();
        });
    });
});

test.cb('interval calls', t => {
    t.plan(10);
    const throttled = throttle(fn, 50);
    const tl = new Timeline();

    const timer = setInterval(() => {
        throttled(() => {
            tl.push();
            t.true(tl.isAround(50));
        })
    }, 3);

    setTimeout(() => {
        clearInterval(timer);
        t.end();
    }, 500);
});

test.cb('promise then', t => {
    const throttled = throttle((cb: Function) => {
        tl.push();
        t.pass();
        fn(cb);
    }, 50);

    const tl = new Timeline();

    const promiseLike = () => new Promise(res => {
        throttled(() => res());
    });

    t.plan(7);

    promiseLike()
        .then(() => promiseLike())
        .then(() => promiseLike())
        .then(() => promiseLike())
        .then(() => promiseLike())
        .then(() => promiseLike())
        .then(() => {
            t.true(tl.isAround(50));
            t.end();
        });
});
