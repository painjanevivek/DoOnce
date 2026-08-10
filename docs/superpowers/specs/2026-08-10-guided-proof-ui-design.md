# DoOnce Guided Proof UI Design

**Approved:** 2026-08-10

**Scope:** Complete frontend visual rebuild

**Primary conversion:** Install the Chrome extension

## Product and audience

DoOnce turns one demonstration, text description, or video of a recurring browser task into an editable WorkflowSpec. Published workflows run deterministically and count as successful only when their declared outcome is verified.

The interface is designed first for operations, finance, reporting, recruiting, and administrative users who repeat measurable browser tasks at least weekly. These users understand the cost of repetitive work but may not understand automation terminology. The experience must explain the product through a concrete sequence rather than through infrastructure claims.

The primary public action is **Install the Chrome extension**. Account creation, controlled-beta enrollment, documentation, privacy, and terms support that action without competing with it.

All public install actions first open `/install`. That page explains browser compatibility, permissions, the review-before-publish boundary, and the three-step setup. `NEXT_PUBLIC_EXTENSION_INSTALL_URL` supplies the external Chrome Web Store or approved beta-distribution destination. Production deployment requires that value. In development or an unconfigured preview, the page must state that distribution is unavailable and offer sign-up without pretending an installation occurred.

## Design direction

The approved direction is **Guided Proof**: a cinematic product narrative that demonstrates evidence before asking for installation. The style combines deep ink, warm bone, and restrained electric-chartreuse accents with self-hosted Satoshi typography. Product UI compositions provide the main imagery; decorative photography may only provide atmosphere and must never imply nonexistent customer proof.

The deterministic `gpt-taste` selection is:

```text
seed = 256
hero = Artistic Asymmetry
typography = Satoshi
components = Feedback Carousel, Horizontal Accordions, Infinite Marquee
motion = Scrubbing Text Reveals, Image Scale and Fade
```

No fake partner logos, fabricated testimonials, inflated performance statistics, decorative badges, or generic section-number labels are allowed.

## Experience architecture

### Shared foundation

The rebuild introduces a shared design-token layer for color, type, spacing, radii, borders, shadows, motion, and focus states. Public and authenticated pages share the same logo, navigation behavior, button hierarchy, field styling, status language, and responsive breakpoints.

The existing API contracts, route structure, authentication behavior, WorkflowSpec editor state, and extension execution logic remain unchanged. UI components may be reorganized, but business logic must stay behind current typed interfaces.

### Public homepage

The homepage follows AIDA:

1. **Navigation:** minimal split navigation with product links, sign-in state, and a persistent high-contrast extension-install action linking to `/install`.
2. **Attention:** an asymmetric hero with a two-line promise on the left and a browser-to-workflow composition entering from the lower right. The title uses `.hero-title--wide`, `max-width: 78rem`, and `font-size: clamp(3.5rem, 7.4vw, 8rem)`.
3. **Interest:** a gapless 12-column, two-row bento. Recording occupies `7 × 2`; compilation and verification each occupy `5 × 1`. All 24 cells are occupied and `grid-auto-flow: dense` is required.
4. **Desire:** a scrubbed text narrative explains demonstrate, review, publish, run, and verify. Product compositions scale from `0.8` to `1` and fade as they leave the viewport.
5. **Action:** installation requirements, a privacy reassurance, a final extension CTA, and restrained legal navigation. External install destinations open with safe cross-origin link attributes.

An infinite marquee shows representative task types such as report downloads, candidate updates, invoice collection, reconciliation, and recurring portal checks. These are examples, not customer claims.

### Authoring explanation

A three-slice horizontal accordion explains the interchangeable authoring paths:

- Record the task in Chrome.
- Describe the task in plain language.
- Upload a short demonstration video.

Each slice expands with keyboard focus or pointer hover, contains a short explanation and product image, and collapses without hiding essential content from screen readers.

### Scenario carousel

The carousel presents clearly labelled example personas rather than testimonials. Each scenario includes role, recurring task, authoring path, required verification, and expected delivered artifact. It never attributes a quote or result to a real customer unless approved beta evidence exists.

### Authentication and legal pages

The install page uses a focused two-column composition: setup requirements and a visual permission-to-workflow explanation. Sign-up uses the same structure with concise value proof and the existing account form. Privacy, terms, not-found, and error pages use the shared typography and navigation but avoid marketing motion. Errors state what happened, what was preserved, and the next safe action.

### Workflow product

The workflow library becomes a progressive workspace rather than a long control room. The first view contains workflow status, latest verified outcome, next action, and creation entry points. Advanced evidence, audit, schedule, repair, beta, and support controls remain collapsed until requested.

The workflow studio uses a stable three-region layout:

- left: workflow outline and version state;
- center: editable step canvas and current task;
- right: contextual inspector, validation, and evidence.

On narrow screens the three regions become a single ordered flow with an accessible tab switcher. Existing authoring, editor, run, version, repair, scheduling, video, and beta components retain their typed data contracts.

## Motion and interaction

GSAP and `@gsap/react` provide only the two selected motion systems: scrubbed text reveals and image scale/fade. Motion is isolated in client components and cleaned up through GSAP context. `prefers-reduced-motion: reduce` disables scrubbing and renders all content in its final state.

Clickable media uses restrained scale transitions inside clipped containers. Buttons, fields, accordions, carousels, tabs, and disclosure controls expose visible hover, focus, active, disabled, loading, success, and error states. The page shell prevents horizontal overflow.

## Content and trust

Language remains concrete: demonstrate, review, test, publish, run, verify. Claims explain product behavior rather than promising universal automation. Installation messaging states browser requirements and makes clear that generated workflows are reviewed before publishing.

Sensitive values, selectors, page content, credentials, or private run evidence must not appear in decorative UI. Existing role boundaries and server capability controls remain visible when an action is unavailable.

## Error handling and progressive rendering

Each data-driven surface renders skeleton, empty, ready, degraded, and error states independently. Failure in audit history or beta evidence must not block the workflow list. Optimistic actions are avoided for publish, disable, repair, and run operations. Server errors use existing stable messages and retain user input where safe.

## Verification

Implementation is complete only when:

- existing contract, editor, extension, controlled-run, and production-build checks pass;
- homepage, sign-up, workflow library, and workflow studio pass desktop and mobile visual review;
- no heading exceeds three lines at supported widths;
- the bento contains no empty grid cell;
- buttons retain compliant contrast and keyboard focus;
- reduced-motion rendering contains all information;
- no horizontal overflow, hydration error, console error, or inaccessible disclosure is present;
- installation remains the dominant public CTA without obscuring sign-in or legal access.
- configured install links reach the approved distribution destination, while missing configuration produces an honest non-installable state.
