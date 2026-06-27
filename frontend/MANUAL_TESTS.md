# Manual Test Plan — Mutual NDA Creator

Run `npm run dev` and open http://localhost:3000 before executing these tests.

---

## 1. Page Layout

| # | Steps | Expected |
|---|-------|----------|
| 1.1 | Load the page | Header shows "Mutual NDA Creator" on the left; "Download PDF" button on the right |
| 1.2 | Inspect the viewport | Left panel (≈5/12 width) is the form; right panel (≈7/12 width) is the live NDA document |
| 1.3 | Make the browser window narrow (< 768 px) | Form and document stack or remain side by side without horizontal scroll overflow |
| 1.4 | Scroll the form down past the Parties section | Document panel stays in place (independent scroll) |
| 1.5 | Scroll the document past section 11 | Form panel stays in place |

---

## 2. Agreement Details — Purpose

| # | Steps | Expected |
|---|-------|----------|
| 2.1 | Load page — check the Purpose textarea | Pre-filled with "Evaluating whether to enter into a business relationship with the other party." |
| 2.2 | Clear the textarea; type "Exploring a joint venture" | Document preview immediately shows the new text in: the Cover Page Purpose field, section 1, and section 2 |
| 2.3 | Delete all text from the textarea | Document shows an empty string (no crash, no placeholder artefact) |

---

## 3. Effective Date

| # | Steps | Expected |
|---|-------|----------|
| 3.1 | Load page — note the Effective Date field | Defaults to today's date |
| 3.2 | Clear the date and leave it blank | Document Cover Page and section 5 show "[Date]" |
| 3.3 | Enter 2026-07-04 | Document shows "July 4, 2026" |
| 3.4 | Enter 2024-02-29 (leap day) | Document shows "February 29, 2024" |
| 3.5 | Enter 2027-01-01 | Document shows "January 1, 2027" |

---

## 4. MNDA Term

| # | Steps | Expected |
|---|-------|----------|
| 4.1 | Default state | "Expires" radio is selected; year input shows 1; input is enabled |
| 4.2 | Change the year input to 5 | Cover page shows "Expires 5 year(s) from Effective Date." |
| 4.3 | Select "Continues until terminated" | Year input becomes disabled (greyed out); cover page shows "Continues until terminated in accordance with the terms of the MNDA." |
| 4.4 | Select "Expires" again | Year input re-enables with its previous value |
| 4.5 | Enter 0 in the year input | Observe behaviour (no defined minimum enforcement in UI beyond browser min=1 attribute) |

---

## 5. Term of Confidentiality

| # | Steps | Expected |
|---|-------|----------|
| 5.1 | Default state | Years radio selected, year = 1, input enabled |
| 5.2 | Change year to 7 | Cover page shows "7 year(s) from Effective Date, but in the case of trade secrets…" |
| 5.3 | Select "In perpetuity" | Year input is disabled; cover page shows "In perpetuity." |
| 5.4 | Switch back to years radio | Input re-enables; retained value shown |

---

## 6. Governing Law & Jurisdiction

| # | Steps | Expected |
|---|-------|----------|
| 6.1 | Default state | Both fields are blank; document section 9 shows "[State]" and "[Jurisdiction]" |
| 6.2 | Type "Delaware" into Governing Law | All "[State]" placeholders in section 9 replace with "Delaware" |
| 6.3 | Type "Wilmington, DE" into Jurisdiction | All "[Jurisdiction]" placeholders in section 9 replace with "Wilmington, DE" |

---

## 7. Parties

| # | Steps | Expected |
|---|-------|----------|
| 7.1 | Default state — signature table | Column headers show "PARTY 1" and "PARTY 2" |
| 7.2 | Type "Acme Corp" in Party 1 Company | Signature table header switches from "PARTY 1" to "Acme Corp" immediately |
| 7.3 | Type "Beta LLC" in Party 2 Company | Signature table header switches from "PARTY 2" to "Beta LLC" |
| 7.4 | Fill all fields for Party 1 (Name, Title, Company, Address) | Verify Print Name, Title, Company, Notice Address rows in signature table match |
| 7.5 | Fill all fields for Party 2 | Same as 7.4 for Party 2 column |

---

## 8. Standard Terms

| # | Steps | Expected |
|---|-------|----------|
| 8.1 | Scroll through the document | Sections 1 through 11 are present and readable |
| 8.2 | Verify section 5 uses inline values | Purpose, formatted date, MNDA term, and confidentiality term text are highlighted in blue with dotted underline |
| 8.3 | Footer | "Common Paper Mutual Non-Disclosure Agreement Version 1.0 free to use under CC BY 4.0." appears at the bottom |

---

## 9. Download PDF

| # | Steps | Expected |
|---|-------|----------|
| 9.1 | Click "Download PDF" | Browser print dialog opens |
| 9.2 | In the print dialog, set destination to "Save as PDF" | PDF preview shows only the NDA document — no header bar or form panel |
| 9.3 | In the print dialog, inspect page breaks | Document fits naturally; signature table is not cut in half across pages |
| 9.4 | Save the PDF | File downloads; open it and verify all filled-in values (company names, dates, purpose) are correct |

---

## 10. Cross-browser

| # | Browser | Steps | Expected |
|---|---------|-------|----------|
| 10.1 | Chrome | Run tests 1–9 above | All pass |
| 10.2 | Firefox | Run tests 1–9 above | All pass |
| 10.3 | Safari (Mac) | Run tests 1–9 above | All pass |

---

## 11. Accessibility Smoke Test

| # | Steps | Expected |
|---|-------|----------|
| 11.1 | Tab through the form | All inputs receive focus in logical order |
| 11.2 | Use keyboard to select a radio button (arrow keys) | Radio groups respond to arrow key navigation |
| 11.3 | Use a screen reader (VoiceOver / NVDA) | Form labels are announced with their inputs |
