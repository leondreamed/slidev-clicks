import type { Ref } from 'vue'

import type { MotionState } from '~/types/motion.js'
import type { SlidevClickStep } from '~/types/step.js'

export function refClickStep(ref: Ref): SlidevClickStep {
	return {
		setActive() {
			ref.value = true
		},
		setInactive() {
			ref.value = false
		},
	}
}

export function motionStateStep(ref: Ref<MotionState>): SlidevClickStep {
	return {
		setActive() {
			ref.value = 'active'
		},
		setInactive() {
			ref.value = 'inactive'
		},
		onEnter() {
			ref.value = 'enter'
		},
		onLeave() {
			ref.value = 'leave'
		},
	}
}

export function noopStep(): SlidevClickStep {
	return {
		onEnter() {
			/* noop */
		},
		setActive() {
			/* noop */
		},
		setInactive() {
			/* noop */
		},
		onLeave() {
			/* noop */
		},
	}
}

export class StepCancelledError extends Error {
	constructor() {
		super('Step cancelled')
		this.name = 'StepCancelledError'
	}
}
