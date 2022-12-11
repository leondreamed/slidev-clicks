import type { Promisable } from 'type-fest'
import type { ComponentInternalInstance } from 'vue'
import { onMounted } from 'vue'

export function whenMounted(
	instance: ComponentInternalInstance,
	cb: () => Promisable<void>
) {
	if (instance.isMounted) {
		Promise.resolve(cb()).catch((error: unknown) => {
			console.error(`Error in \`whenMounted\`:`, error)
		})
	} else {
		onMounted(async () => {
			await cb()
		})
	}
}
