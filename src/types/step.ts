import type { Promisable } from 'type-fest'

export interface SlidevClickStep {
	onEnter?(): Promisable<void>
	setActive(): void
	setInactive(): void
	onLeave?(): Promisable<void>
}
