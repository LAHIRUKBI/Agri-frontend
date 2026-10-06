# Soil Health Wizard Design

## Goal

Make the farmer Soil Health interaction easier to complete by presenting the existing quick image check and sensor-visit form as a guided four-step wizard.

## Scope

- Preserve all current API contracts, model inference behavior, saved-history behavior, sensor request behavior, and the existing green soil-health visual language.
- Show a clear progress indicator and only the controls relevant to the current step.
- Keep both modes: Quick Image Check and Request Sensor Visit.

## Four-step journey

1. **Farm location**: district map / quick district selection, field location, land size.
2. **Crop and season**: visual crop cards and season selection.
3. **Soil photo**: upload a photo and show client-side preview metrics.
4. **Review and submit**: display the entered data and submit the existing quick-check or sensor-visit request.

## Interaction rules

- Users cannot continue until the current step has the required data.
- Back keeps all entered data.
- Changing district clears an invalid field location.
- The final action reuses the current `runQuickCheck` and sensor-request submit logic.
- Image validation and all backend error popups remain unchanged.

## Validation and testing

- Add source-level Node tests that verify the wizard labels, steps, navigation controls, and preservation of the existing submit handlers.
- Run the focused test, the existing Node test suite, lint, and a production build.
