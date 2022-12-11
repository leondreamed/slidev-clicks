/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

;(window as any).currentlyExecutingStep = undefined // undefined means not in a step
;(window as any).stepSupposedToBeExecuting = undefined

const originalThen = Promise.prototype.then
// eslint-disable-next-line unicorn/no-thenable, @typescript-eslint/promise-function-async -- We're overriding the `.then` function
;(Promise.prototype as any).then = function then(
	onfulfilled?: (value: any) => void,
	onrejected?: (value: any) => void
) {
	const thisStep = (window as any).currentlyExecutingStep

	return originalThen.call(
		this,
		(data) => {
			if (
				thisStep !== undefined &&
				thisStep !== (window as any).stepSupposedToBeExecuting
			) {
				return null
			}

			return onfulfilled?.(data)
		},
		onrejected
	)
}

// Making the Promise constructor return a Proxy makes `.then` calls execute when the
// Promise is created instead of grouped beforehand (I have no idea why)
;(globalThis as any)._Promise = globalThis.Promise
;(globalThis.Promise as any) = async function Promise(cb: () => void) {
	const promise = new (globalThis as any)._Promise(cb)
	const promiseProxy = new Proxy(promise, {
		get(target, key) {
			return target[key].bind(promise)
		},
	})

	return promiseProxy
}

// Making the global Promise object contain all the expected Promise methods
for (const property of Object.getOwnPropertyNames(
	(globalThis as any)._Promise
)) {
	if (property !== 'length' && property !== 'name') {
		;(globalThis.Promise as any)[property] = (globalThis as any)._Promise[
			property
		]
	}
}

export {}
