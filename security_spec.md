# Security Specification: New Volley Academy CMS

This document outlines the security architecture, data invariants, and access control policies for the New Volley Academy administrative panel, implemented via Firebase Authentication and Firestore Security Rules.

## 1. Data Invariants & Access Control Policy

- **Super Admin**:
  - Full access (read, write, delete) across all collections.
  - Exclusively allowed to create/delete team documents (`rose_squadre`), edit institutional details (`societa_info`), manage templates (`modulistica`), and create/edit admin user accounts (`admin_users`).
  - Determined solely by the document in `admin_users/$(request.auth.uid)` with `ruolo == "Super Admin"` (no hardcoded emails).

- **Collaboratore/Allenatore**:
  - Can only create and edit articles in `news_blog` that are either unassigned or assigned to a team within their `squadre_assegnate` list.
  - Can update (but NOT delete or create) roster documents (`rose_squadre`) only for team IDs in their `squadre_assegnate` list (e.g., updating stats, match results, uploading a squad cover photo).
  - Strictly forbidden from creating new teams, deleting teams, managing other users, editing institutional settings, or managing administrative templates.

- **Unauthenticated / General Users**:
  - Read-only access to public collections: `societa_info`, `giocatori`, `news_blog` (excluding drafts), `rose_squadre`, `sponsor`, `eventi_tornei`, and `modulistica` (only active modules).
  - Strictly no write/delete access anywhere.

---

## 2. The "Dirty Dozen" Attack Payloads

The following attack vectors are explicitly blocked by the rules:

1. **Self-Elevated Privilege Attack**: An authenticated user attempting to create or update their own `admin_users` document to set `ruolo: "Super Admin"`.
2. **Orphaned News Team Hijack**: A Coach attempting to create or edit a news article with `squadra_associata_id` set to a team they are not assigned to.
3. **Roster Creation Bypass**: A Coach attempting to create a new team document in `rose_squadre`.
4. **Roster Hijack/Poisoning**: A Coach attempting to edit details for a team they do not manage (not in their `squadre_assegnate`).
5. **Roster Deletion Attack**: A Coach attempting to delete a team document.
6. **Global Settings Poisoning**: A Coach attempting to overwrite `societa_info/generale`.
7. **Document ID Path Variable Poisoning**: An attacker injecting a 1.5KB string as an ID for a player or a team.
8. **Invisible Draft Scraping**: An unauthenticated user attempting to list or read modulistica documents where `attivo` is false or `stato_pubblicazione` is `'bozza'`.
9. **Administrative User Leak**: An unauthenticated user attempting to read the `admin_users` collection.
10. **Sponsor Modification Injection**: A Coach attempting to modify, add, or delete commercial partner sponsors in `/sponsor`.
11. **Collaborator Management Hijack**: A Coach attempting to edit or create other users' accounts in `admin_users`.
12. **Immortality Field Bypass**: A Coach or Super Admin attempting to alter `createdAt` timestamps to falsified historical dates (violating server-side time verification).

---

## 3. Firestore Rules Structure

The final rules in `firestore.rules` will enforce these assertions through standard ABAC constraints using the relational `get()` primitive and input schema validators.
