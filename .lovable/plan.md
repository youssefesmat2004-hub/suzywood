I’ll fix this by targeting the admin WhatsApp order modal specifically:

1. Confirm the admin Orders route is the only source for the “Add WhatsApp Order” modal.
2. Update the modal so its visible labels, auto-calculation, and preview breakdown are forced to 75% deposit / 25% remaining.
3. Clear any stale generated/dev cache if needed so the preview cannot keep serving the previous 70% version.
4. Verify by searching the project again for any remaining `70%` / `30%` references that could appear in the admin WhatsApp order form.