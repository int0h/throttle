export default function throttle(fn: Function, pause: number): Function {
	let lastRunTime = -1;
    let lastThis: any;
    let lastArgs: any[];
    let hasTimeout = false;

	function run(context: any, args: any[]) {
		lastRunTime = Date.now();
		fn.apply(context, args);
	}

	return function(...args: any[]) {
		const timePassed = Date.now() - lastRunTime;
        if (timePassed > pause) {
            run(this, args);
            return;
        }

        lastArgs = args;
        lastThis = this;
        if (!hasTimeout) {
            hasTimeout = true;
            const delay = pause - timePassed;
            setTimeout(() => {
                hasTimeout = false;
                run(lastThis, lastArgs);
            }, delay);
        }
	};
}
