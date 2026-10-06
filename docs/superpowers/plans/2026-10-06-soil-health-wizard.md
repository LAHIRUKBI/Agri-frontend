# Soil Health Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing farmer Soil Health form into a four-step guided wizard without changing backend contracts or ML behavior.

**Architecture:** Add a small client-side wizard state layer in the existing `page.tsx`, retaining the current form state and submit handlers. Render current controls in step-specific sections, then provide a review step that calls the pre-existing quick-check or sensor-request actions.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind utility classes, Node built-in test runner.

**Spec:** `docs/superpowers/specs/2026-10-06-soil-health-wizard-design.md`

## Global Constraints

- Do not alter backend routes, payload names, model-inference calls, or persisted schemas.
- Preserve quick image check and sensor-visit behavior.
- Keep existing Soil Health visual language and mobile responsiveness.
- Use the existing farmer Soil Health page and map data.

## Review Focus

- A user changing district must not retain an invalid field location.
- The final quick-check action must use the unchanged existing handler.
- The final sensor-visit action must use the unchanged existing handler.
- Browser refresh behavior and image validation errors must remain safe.
- Mobile users must be able to reach Back, Continue, and final submission controls.

### Task 1: Add wizard state and UI contract test

**Files:**
- Create: `tests/soil-health-wizard.test.ts`
- Modify: `app/dashboard/farmer/soil-health/page.tsx`

**Interfaces:**
- Produces: a `wizardStep` state with four named step labels and navigation guards.
- Consumes: current `requestDraft`, image selection state, `runQuickCheck`, and sensor request submit handler.

- [ ] **Step 1: Write the failing test**

Assert that the page source declares `wizardStep`, provides the four step labels, has Back/Continue controls, and preserves quick-check/sensor submit handler references.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test tests/soil-health-wizard.test.ts`

Expected: FAIL because the wizard source markers are absent.

- [ ] **Step 3: Implement wizard navigation and step sections**

Add guarded forward/back navigation in `app/dashboard/farmer/soil-health/page.tsx`; reuse current state and handler functions.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test tests/soil-health-wizard.test.ts`

Expected: PASS.

### Task 2: Verify integration quality

**Files:**
- Modify: `app/dashboard/farmer/soil-health/page.tsx`
- Test: `tests/soil-health-wizard.test.ts`

**Interfaces:**
- Consumes: Task 1 wizard state.
- Produces: a usable wizard that retains current form behavior.

- [ ] **Step 1: Run focused wizard test and existing Node tests**

Run: `npx tsx --test tests/soil-health-wizard.test.ts tests/*.test.ts`

Expected: PASS.

- [ ] **Step 2: Run lint and production build**

Run: `npm run lint` then `npm run build`

Expected: PASS.
