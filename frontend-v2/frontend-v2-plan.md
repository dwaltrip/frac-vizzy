# Web App Specification

### Background

  - app that displays some visualiztaions based off certain params
  - user can change params through the UI
  - expensive comptuations are needed to prepare the data for the visualizations
  - whenever the user does an action, this changes the "target params" that we now need to compute + render from.
  - we will do expensive calcuations in the background using a worker pool

### Abstractions / ideas

  - each calcluation is uniquely determined by a simple `CalcInfo` object
  - we can dervie a `CalcId` from `CalcInfo`, which can be used as a cache key as well
  - the calcuations results are `CalcResults`

### Assume the following exist

- Interaction Manager that implements the event handling and update the "target params"
- `function performCalcluation(info: CalcInfo): CalcResult`
- `function determineNeededCalcs(params: RenderParams):  CalcInfo[]`
- `function renderCalcResults(results: CalcResult[], params: RenderParams): void`
- `function calcInfoToId(info: CalcInfo): CalcId`


### Setup 

  - setup ui event listeners
  - setup render loop using `requestAnimationResult`.
  - setup work queue / data structure that background workers will pull from
  - setup render queue that the render loop will use to render latest results
  - setup cache for calcution results
  - setup background workers so they are ready to do work and constantly checking the queue for new work

### Event flow

  1. user does an action
  2. target params change based off user input (now different from current params)
  3. determine the `targetCalcInfos` for the target param using `determineNeededCalcs`
  4. check which of the `targetCalcInfos` are not cached
  5. add missing `CalcInfo` to the work queue
  6. add targetCalcInfos to the render queue 
  7. workers, one-by-one, perform the calculations and send `CalcResult` to the main thread
  8. when a worker is done, in main thread `CalcResult` is added the result cache
  9. on next render loop tick, pull items off render queue and render them, respecting the `targetParams`

---

I'm trying to spec out my web app. Above are the notes I have so far.

Can you help me refine them / remove ambiguities so I can proceed confidently with the implementation?

I'm mainly concerned with building a nice generic structure for managing workers, work queue, calc results, and so on.

IMPORTANT: There a number of aspects that I've marked as things we can assume exist. Let's avoid worrying about the details of those pieces whenever possible and focus on everything else.

Okay! Let's start with a few easy ones. Please suggest a few items for us to clear up first.
