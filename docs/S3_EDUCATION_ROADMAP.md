# Chatterguru sensor physics lessons

The [learning page](../s3-learn.html) gives visitors a short experiment and a roadmap. The [engineering reference](../s3-engineering-reference.html) is the companion for equations, assumptions, and model limits. The [Studio gallery](../s3-studio.html) is where viewers apply those ideas to a scene.

## What the current material covers

| Topic | Existing engineering material | Public lesson still needed |
| --- | --- | --- |
| Waveforms | The common registry covers rectangular pulses, linear FM, and Barker BPSK. The sampled and stepped SAR references cover additional cases under separate acquisition contracts. The public page explains pulse compression and sampling. | Show the sample clock, spectrum, and matched response together. Compare up/down LFM, NLFM, phase codes, and stepped LFM. State exactly which source, processor, and recording combination each example exercises. |
| Tracking | The public model record covers scan Kalman prediction and update. The engineering references also describe gating, deterministic association, and track lifecycle. Maneuver and probabilistic association material uses its own reference scope. | Use two crossing objects to explain assignment and covariance, then show what happens when one observation is missing. |
| Resource management | The engineering material distinguishes a batch scheduler, timeline placement, and synthetic closed-loop execution. | Give viewers a finite fictional survey budget and show the effect of a deadline, a priority change, and deferral. Use a timeline and a hand-worked budget. |
| Interference and receiver resilience | Engineering references cover noise, structured interference and laboratory comparisons. The public reference introduces clutter and the signal chain. | Explain the vocabulary and demonstrate a controlled coexistence experiment with an unchanged recorded input. Identify the signal, interference, and measurement tradeoffs using a fictional receiver. |
| Scene, RF, and clutter | Public geometry and SAR examples are available. Engineering references cover target geometry, signatures, scattering approximations, environment returns, and statistical and terrain-derived clutter. | Follow the same synthetic point and extended surface from pose through range, visibility, reflectivity, phase, and receiver samples. Show what changes when modeling assumptions change. |
| Atmosphere and optical/IR | The public thermal model explains band radiance, transmission and emissivity. Engineering references describe RF loss and several weather and optical assumptions. | Compare two separate signal paths through the same stylized weather state. Label dB, transmission, radiance, wavelength, band, and exposure. Explain which effects are calculated and which use reference estimates. |
| Imaging, fusion, and scoring | The public reference covers flat and terrain SAR, introductory fusion theory and replay metrics. | Use retained synthetic examples for each claimed integration. Show validity masks, resolution and uncertainty along the relevant axes. |

Engineering scope and test support vary by workflow. The lesson should point readers to the exact public recording or model card that supports its teaching claim.

## Lesson format

1. **Predict.** Open with a 20-second visual question. Invite the viewer to choose an outcome before changing a control.
2. **Show.** Use a five- to eight-minute YouTube explainer with one controlled comparison and a visible result. Introduce mathematical notation after the viewer sees what changes.
3. **Derive.** Add an optional written derivation with definitions, dimensions, assumptions, and a numerical example.
4. **Try.** Link an interactive exercise or a reproducible replay. Give one variation and its expected result.
5. **Listen.** Use the approved script, figure descriptions, and checked numerical examples as a source packet for a conversational audio companion. Give listeners a short description of what each figure shows.

Preserve Chatterguru’s own narration and visual identity. Use captioned original scenes, charts, and diagrams. Link the transcript, public model reference, settings, and evidence near the episode. Have a technical reviewer check units, formulas, source boundaries, and any AI-generated media before release.

## Teaching references

- 3Blue1Brown develops an intuition through moving visuals and then introduces the Fourier integral. [Fourier transform lesson](https://www.3blue1brown.com/lessons/fourier-transforms/)
- Robert M. O’Donnell’s introductory radar lectures are the likely MIT Lincoln Laboratory series. The course provides a sequence from radar equations and propagation to detection and tracking. [MIT Lincoln Laboratory introductory course](https://www.ll.mit.edu/outreach/web-based-course-radar-introduction-radar-systems)
- Rohde & Schwarz shows how to teach measurement by setting up a controlled test and looking at a real display. [Radar educational videos](https://www.rohde-schwarz.com/us/applications/radar-educational-videos_230850-54272.html)
- NASA ARSET shows a civilian SAR lesson sequence grounded in Earth-observation interpretation. [Introduction to SAR and its applications](https://appliedsciences.nasa.gov/sites/default/files/2024-10/SAR_2024_Part1_Final.pdf)

## First production pilot

**Can smaller pixels make SAR sharper?** The runnable [lesson](../s3-learn.html#sar-lab) changes pixel spacing and bandwidth independently. The [production packet](S3_LESSON_SAR_RESOLUTION.md) contains the on-screen sequence, narration, equation, expected observations, and source prompt for the audio companion. Keep this conceptual lesson alongside the separate first-time Workbench walkthrough.
