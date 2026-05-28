# Whitepaper translation workflow

This directory holds the La Tanda whitepaper in multiple languages for the international community.

## Files

- **`es.md`** — Source in Spanish (canonical). Mirrors the published whitepaper at <https://latanda.online/whitepaper.html>. **Do not edit** unless syncing from the canonical HTML.
- **`pt-br.md`** — Brazilian Portuguese translation completed by @Josmar-J (PR #297, merged 2026-05-28; 800 LTD bounty paid on-chain, tx 12C15843ACC3554A48BF187E649E580FEE4CF0EE49A5CA9DD2CE102D99C1D740).
- **Future:** `en.md`, `fr.md`, etc. — open to contributors.

## Workflow for translators

1. Fork `INDIGOAZUL/la-tanda-web` and check out branch `i18n/whitepaper-pt-br` (or open a new `i18n/whitepaper-<locale>` branch for other languages).
2. Edit only your target locale file (e.g., `pt-br.md`). Do not modify `es.md`.
3. Open a PR against `main` referencing this README and the bounty tracking issue.
4. Review process:
   - 1 native speaker of the target language validates linguistic quality.
   - 1 maintainer reviews structure parity with `es.md`.

## Translation guidelines

- **Preserve markdown structure 1:1** — `#`/`##`/`###` headings, tables, code blocks, and lists must match `es.md` exactly. If a section moves or is renumbered, flag it in the PR.
- **Technical glossary** — translate the term once, then keep the original Spanish/English in parentheses on first use within each section. Examples:
  - `tanda` → keep as `tanda` (rotating savings circle / círculo de poupança rotativo)
  - `staking` → keep as `staking` (não traduzir; termo técnico universal)
  - `validator` → `validador`
  - `governance` → `governança`
- **Numbers, units, currency:** keep formatting as in source (200M LTD, $500B+, etc.).
- **Brand names:** never translate (`La Tanda`, `LTD`, `Ray-Banks LLC`, `MIA`).

## Compensation

This translation is part of the **Community Tier** of the La Tanda contributor program (`/home/ebanksnigel/recruitment-plan.md`).

- **Range:** 500–1,500 LTD depending on final quality + completeness.
- **Vesting:** per recruitment plan — 6 month cliff + 24 month linear.
- Payment is in LTD on La Tanda Chain testnet (mainnet conversion 1:1 at TGE).

## Estimated timeline

- **First draft:** 2–4 weeks from claim.
- **Review + revisions:** 1–2 weeks.

## Questions

Open an issue in `INDIGOAZUL/la-tanda-web` with the `i18n` label, or ping the contributor team in Discord (`discord.gg/Ve9M2ZSYC2`).
