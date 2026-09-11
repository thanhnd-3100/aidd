# Phase A2 — Track A: Composer modal presentational UI

**Track:** A (`momorph-ui-implementer`, screen mode) · **Depends on:** T-RED

## MoMorph refs
- Composer modal: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2
- Clarifications: plans/260908-1654-sun-kudos-board/clarifications.md
- testPolicy: e2e-red-first

## Goal
Modal with recipient autocomplete, plain `<textarea>` content, free-text hashtag chip input,
"Hủy"/"Gửi" footer. Callback-driven only — no Supabase calls, no submit logic.

## Owned files
`src/components/kudos/composer/**`

## Out of scope
Real recipient search/submit mutation (I1 wires B1's server actions); image upload, rich-text
toolbar, @mention, "send anonymously" (not in scope — clarifications.md); open/close trigger
(owned by board's pill click, wired in I1).

## Integration contract
`KudosComposer({ open, onClose, recipientOptions, onSearchRecipient, onSubmit, submitting,
submitError })`. Recipient: search-as-type, required single select. Content: required non-empty
textarea. Hashtags: Enter/comma adds chip, 'x' removes, min 1/max 5 client-enforced. "Gửi" disabled
until all three filled, shows loading state while `submitting`. "Hủy" discards + closes.

## Test policy
`e2e-red-first`. `testRunner: playwright`; redTestFiles/redCommand/redExitCode/redFailure/
redEvidence passed from T-RED, read-only.
