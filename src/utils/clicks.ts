/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-await-in-loop, max-depth -- We want to execute click handlers sequentially, and the handling is necessarily complex */

import {
	injectionRoute,
	injectionSlidevContext,
	// @ts-expect-error: Slidev doesn't export this type
} from '@slidev/client/constants?ts-ignore'
import { nanoid } from 'nanoid'
import invariant from 'tiny-invariant'
import type { ComputedRef, DeepReadonly } from 'vue'
import { computed, getCurrentInstance, inject, watch } from 'vue'

import type { Slidev } from '~/types/slidev.js'
import type { SlidevClickStep } from '~/types/step.js'
import { whenMounted } from '~/utils/lifecycle.js'
import { StepCancelledError } from '~/utils/step.js'

type UseSlidevClicksSteps = [
	Omit<SlidevClickStep, 'setInactive' | 'onLeave'>,
	...SlidevClickStep[]
]

interface ClickForwardArgs {
	steps: UseSlidevClicksSteps
	currentRouteState: RouteState
	previousRouteState: RouteState | undefined
	isReadThrough: boolean
}

async function clickForward({
	steps,
	currentRouteState,
	previousRouteState,
	isReadThrough,
}: ClickForwardArgs) {
	const isSamePage = currentRouteState.page === previousRouteState?.page
	if (isSamePage) {
		steps[previousRouteState.numClicks]?.setActive()
	}

	if (!isSamePage && isReadThrough) {
		return
	}

	for (
		let clickIndex = isSamePage ? currentRouteState.numClicks : 0;
		clickIndex <= currentRouteState.numClicks;
		clickIndex += 1
	) {
		const clickStep = steps[clickIndex]
		if (clickStep === undefined) return

		if (clickIndex === currentRouteState.numClicks) {
			if (
				// If the user navigated to this slide from the one after,
				// don't trigger "onEnter" callbacks
				previousRouteState?.page === currentRouteState.page + 1 ||
				clickStep.onEnter === undefined
			) {
				clickStep.setActive()
			} else {
				try {
					;(window as any).currentlyExecutingStep = (
						clickStep as any
					).onEnterName
					;(window as any).stepSupposedToBeExecuting = (
						clickStep as any
					).onEnterName

					try {
						await clickStep.onEnter()
					} finally {
						;(window as any).currentlyExecutingStep = undefined
					}
				} catch (error: unknown) {
					if (error instanceof StepCancelledError) {
						console.info('Step cancelled.')
					} else {
						throw error
					}
				}
			}
		} else {
			clickStep.setActive()
		}
	}
}

interface ClickBackwardArgs {
	currentRouteState: RouteState
	previousRouteState: RouteState
	steps: UseSlidevClicksSteps
}
async function clickBackward({
	currentRouteState,
	previousRouteState,
	steps,
}: ClickBackwardArgs) {
	const prevNumClicks = previousRouteState.numClicks
	const { numClicks } = currentRouteState

	for (
		let clickIndex = prevNumClicks;
		clickIndex > numClicks;
		clickIndex -= 1
	) {
		const clickStep = steps[clickIndex]
		if (clickStep === undefined) return

		// The zeroth step doesn't have `onLeave` nor `setInactive`
		if (!('onLeave' in clickStep) && !('setInactive' in clickStep)) {
			continue
		}

		if (clickIndex === numClicks) {
			if (clickStep.onLeave === undefined) {
				clickStep.setInactive()
				;(window as any).stepSupposedToBeExecuting = undefined
				;(window as any).currentlyExecutingStep = undefined
			} else {
				try {
					;(window as any).currentlyExecutingStep = (
						clickStep as any
					).onLeaveName
					;(window as any).stepSupposedToBeExecuting = (
						clickStep as any
					).onLeaveName
					try {
						await clickStep.onLeave()
					} finally {
						;(window as any).currentlyExecutingStep = undefined
					}
				} catch (error: unknown) {
					if (!(error instanceof StepCancelledError)) {
						throw error
					}
				}
			}
		} else {
			clickStep.setInactive()
			;(window as any).stepSupposedToBeExecuting = undefined
			;(window as any).currentlyExecutingStep = undefined
		}
	}

	const currentStep = steps[numClicks]
	invariant(currentStep, '`currentStep` should not be undefined')
	currentStep.setActive()
}

interface RouteState {
	numClicks: number
	page: number
}

interface HandleClickChangeArgs {
	currentRouteState: RouteState
	previousRouteState: RouteState | undefined
	steps: UseSlidevClicksSteps
	isReadThrough: boolean
}
async function handleClickChange({
	steps,
	currentRouteState,
	previousRouteState,
	isReadThrough,
}: HandleClickChangeArgs) {
	const isSamePage = previousRouteState?.page === currentRouteState.page
	if (
		isSamePage &&
		previousRouteState.numClicks > currentRouteState.numClicks
	) {
		await clickBackward({
			currentRouteState,
			previousRouteState,
			steps,
		})
	} else {
		await clickForward({
			currentRouteState,
			previousRouteState,
			steps,
			isReadThrough,
		})
	}
}

/**
	@example ```ts
		useSlidevClicks([
			{
				setActive() {
					myRef.value = true;
				},
				onLeave() {
					myRef.value = false
				}
			}
		])
	```
*/
export function useSlidevClicks(steps: UseSlidevClicksSteps): void
export function useSlidevClicks(
	steps: () => { steps: DeepReadonly<UseSlidevClicksSteps> } | undefined
): void
export function useSlidevClicks(
	steps:
		| UseSlidevClicksSteps
		| (() => { steps: DeepReadonly<UseSlidevClicksSteps> } | undefined)
) {
	const isReadThrough = useIsReadThrough()
	const instance = getCurrentInstance()
	const $slidev = inject<Slidev>(injectionSlidevContext)
	invariant($slidev, '`$slidev` should not be undefined')
	const $route = inject<{ path: string }>(injectionRoute)
	invariant($route, '`$route` should not be undefined')
	const numClicks = useNumClicks(steps as any)

	const stepsHandler = (steps: UseSlidevClicksSteps) => {
		for (const step of steps) {
			if (step.onEnter !== undefined) {
				;(step as any).onEnterName = nanoid()
			}

			if ('onLeave' in step) {
				;(step as any).onLeaveName = nanoid()
			}
		}

		if (instance !== null) {
			whenMounted(instance, () => {
				watch(
					() => ({
						numClicks: numClicks.value,
						page: $slidev.nav.currentPage,
					}),
					async (currentRouteState, previousRouteState) => {
						if ($slidev.nav.currentPage === Number($route.path)) {
							await handleClickChange({
								currentRouteState,
								previousRouteState,
								steps,
								isReadThrough: isReadThrough.value,
							})
						}
					},
					{ immediate: true }
				)
			})

			whenMounted(instance, () => {
				watch(
					() => $slidev.nav.currentPage,
					(currentPage) => {
						if (currentPage === Number($route.path) && isReadThrough.value) {
							for (const step of steps.slice(0, numClicks.value + 1)) {
								step.setActive()
							}
						}
					},
					{ immediate: true }
				)
			})
		}
	}

	if (typeof steps === 'function') {
		const computedSteps = computed(steps)
		watch(
			computedSteps,
			(stepsData) => {
				if (stepsData !== undefined) {
					// @ts-expect-error: Correct type
					stepsHandler(stepsData.steps)
				}
			},
			{ immediate: true }
		)
	} else {
		stepsHandler(steps)
	}
}

export function useIsReadThrough() {
	const instance = getCurrentInstance()
	return computed(() => instance?.attrs['read-through'] !== undefined)
}

export function useNumClicks(
	steps: UseSlidevClicksSteps | (() => UseSlidevClicksSteps | undefined)
): ComputedRef<number> {
	const instance = getCurrentInstance()
	const isReadThrough = useIsReadThrough()
	const $slidev = inject<Slidev>(injectionSlidevContext)
	invariant($slidev, '`$slidev` should not be undefined')
	const computedSteps =
		typeof steps === 'function' ? computed(steps) : computed(() => steps)
	return computed(() => {
		if (computedSteps.value === undefined) {
			return 0
		}

		if (instance?.attrs.click !== undefined) {
			return Number(instance.attrs.click)
		}

		if (isReadThrough.value) {
			return computedSteps.value.length - 1
		}

		return $slidev.nav.clicks
	})
}
