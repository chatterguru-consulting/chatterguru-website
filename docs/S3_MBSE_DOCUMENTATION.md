# S³ website documentation review guide

The [systems engineering page](../s3-mbse.html) presents the exported digital thread. The [engineering reference](../s3-engineering-reference.html) is the public reading guide for the architecture, equations, examples, and documentation gaps. The [Studio gallery](../s3-studio.html) is where visitors open the demonstrations.

## Source and presentation

| Material | Public location | Review basis |
| --- | --- | --- |
| ConOps and candidate requirements | [Operating concept](../s3-mbse.html#conops), [requirements tree](../s3-mbse.html#multilevel-reqs), [trace matrix](../s3-mbse.html#rtm-section) | Use the versioned ConOps, requirements hierarchy, and audited trace matrix together. Keep the source revision and candidate status visible. |
| SysML-style diagrams | [Architecture explorer](../s3-mbse.html#sysml-explorer), [view guide](../s3-engineering-reference.html#architecture) | Check each block, interface, and constraint against its owned inputs and outputs. Identify proposals and assumptions in the view where they appear. |
| Sensor and processing theory | [Model records](../s3-mbse.html#archipelago), [worked references](../s3-engineering-reference.html#rdm) | Check the equation against the model contract, including dimensions, units, coordinate and sign conventions, scaling, assumptions, and invalid-input cases. |
| Verification, validation, and acceptance | [Executed evidence](../s3-mbse.html#evidence), [owner sign-off](../s3-mbse.html#readiness) | Match every claim to its evidence source and revision. Record test execution, independent validation, and approval as distinct results. |
| Remaining coverage | [Public documentation catalog](../s3-engineering-reference.html#coverage) | Documentation and integration have separate coverage. Keep a gap visible until the public material and its evidence are available. |

The Radar repository is private. Use original public summaries and reviewed synthetic examples on this site. The existing [MBSE data export](../assets/s3-mbse-data.json) carries the approved publication fields for the site. Run the Radar repository's MBSE exporter to prepare a revision update, then review the generated data and site wording together in a website PR.

## Checklist for model documentation

- Explain the question the model answers and where it enters the data flow.
- State inputs, outputs, units, coordinate frame, time reference, and validity rules.
- Write the governing equation and define its symbols. Add one worked example and identify the assumptions behind it.
- Describe a useful failure case, negative control, or comparison and identify the evidence visitors can inspect.
- Check that the equations match the cited implementation and that the example is clearly marked when it illustrates theory only.
- Review any new public material for proprietary, customer, employer, or controlled data and preserve source attribution for public inputs.

## Website checks

Run `python -B -m unittest discover -s tools` from the website checkout. In a desktop and a phone-sized browser, open the reference from Studio, follow a diagram link and a model-equation link, and check the intended destination. Exercise the trace filter and confirm that the displayed source revision agrees with the data export.
