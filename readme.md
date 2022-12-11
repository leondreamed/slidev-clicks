# slidev-clicks

`slidev-clicks` adds some utility click functions for [Sli.dev](https://sli.dev) that makes it easier to process and handle click events.

## Usage

First, install `slidev-clicks` using your favorite package manager:

```sh
npm install slidev-clicks
```

Then, create a `vite.config.js` file in the root of your Sli.dev project and add the Vite plugin for `slidev-clicks` into the "plugins" array:

```typescript
import { defineConfig } from 'vite'
import slidevClicks from 'slidev-clicks/vite-plugin'

export default defineConfig({
  plugins: [
    slidevClicks()
  ]
})
```

> `slidev-clicks` needs a corresponding Vite plugin because it injects a global `Promise` patch in order to support stopping asynchronous clicks when a subsequent click event is activated. See the "Internals" section for more information.

Then, in your Vue components, you can import the utilities from `slidev-clicks`:

```vue
<script setup lang='ts'>
import { noopStep, refClickStep, useSlidevClicks } from 'slidev-clicks'
import { ref } from 'vue'

const showNumFreeMeetings = ref(false)
const showNumPaidMeetings = ref(false)
const showSuccessRate = ref(false)
const showAverageMeetingLength = ref(false)
const showRevenue = ref(false)

useSlidevClicks([
  noopStep(),
  refClickStep(showNumFreeMeetings),
  refClickStep(showNumPaidMeetings),
  refClickStep(showSuccessRate),
  refClickStep(showAverageMeetingLength),
  refClickStep(showRevenue)
])
</script>

<template>
  <div class="flex flex-col">
    <slide-title title="Since our launch..." />
    <div
      class="flex-1 flex flex-col gap-10 pt-10 px-24 items-stretch justify-between items-center justify-center justify-items-center"
    >
      <div class="flex flex-row justify-between">
        <div v-show='showNumFreeMeetings'>
          Free Meetings
        </div>
        <div v-show='showNumPaidMeetings'>
          Paid Meetings
        </div>
        <div v-show="showSuccessRate">
          Success Rate
        </div>
      </div>
      <div class="flex flex-row">
        <div class="flex-1"></div>
        <div v-show='showAverageMeetingLength'>
          Average Meeting Length
        </div>
        <div class="flex-1"></div>
        <div v-show='showRevenue'>
          Revenue
        </div>
        <div class="flex-1"></div>
      </div>
    </div>
  </div>
</template>
```

## API

### `useSlidevClicks(steps: SlidevClickStep[])`

A Vue composable function (should be called either in a `setup` function or at the top level of `<script setup>`) that takes an array of `SlidevClickStep`s where the step index represents the active state/actions that correspond with that click (e.g. the step at index 1 represents the state/actions after 1 click).

These steps are always executed in order, so if you load the slide page on click 2, `useSlidevClicks` will execute step 0 to step 2 in order.

### `interface SlidevClickStep`

```typescript
interface SlidevClickStep {
  setActive(): void
  setInactive(): void
  onEnter?(): Promisable<void>
  onLeave?(): Promisable<void>
}
```

#### `setActive`

A synchronous function that will get called whenever the active click becomes greater or equal to the step index.

#### `setInactive`

A synchronous function that will get called whenever the active click is less than the step index.

#### `onEnter`

An function that gets called when the click equals the current step index moving forward (i.e. when the user clicks the slide).

#### `onLeave`

An function that gets called when the click equals the current step index moving backwards (i.e. when the user moves one slide back).

### Internals

TODO: Write an explanation about the `Promise` patch.
