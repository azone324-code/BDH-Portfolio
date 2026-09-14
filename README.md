# BANGLA DUB HUB (BDH) Portfolio v4

GitHub Pages-ready portfolio with Supabase Authentication, global website data, admin profiles, member profiles, works, and image storage.

## What changed
- Black + BDH red visual identity using the supplied BDH logo.
- Admin cards are clickable and open an admin profile with Facebook + Instagram.
- Admin Panel is protected by Supabase email/password authentication.
- First-time setup appears ONLY while the `admins` table is empty. The first account becomes the first BDH Admin through the SQL trigger.
- After the first admin exists, visitors see **Admin Login**, not **Set Password**.
- Website/member/work changes are stored in Supabase and are visible to every visitor.
- Logo, admin photos and member photos can be uploaded to Supabase Storage from the Admin Panel.
- Visitor Preview is represented by the same public page; closing the dashboard shows exactly what visitors see.

## IMPORTANT SECURITY NOTE
Do NOT put a Supabase `service_role` key in this project. Only the Supabase project URL and the public `anon` key belong in `supabase-config.js`.

The first-admin setup is intended to be completed BEFORE you publish/share the GitHub Pages URL. Once an admin row exists, the public UI no longer exposes account creation. The included database trigger also ensures later sign-ups are not automatically made admins.

## Setup — one time

1. Create a Supabase project.
2. Open Supabase Dashboard → SQL Editor.
3. Paste and run **supabase.sql**.
4. Open Supabase Dashboard → Project Settings → API.
5. Copy the Project URL and the **anon/public** key into `supabase-config.js`:
   - `window.BDH_SUPABASE_URL`
   - `window.BDH_SUPABASE_ANON_KEY`
6. In Supabase → Authentication → Providers → Email, for the easiest first setup you can temporarily turn **Confirm email** off.
7. Open `index.html` locally or publish to GitHub Pages.
8. Click **Admin Panel**. Because no admin exists yet, the first-time setup screen appears.
9. Create YOUR admin email + password.
10. Log in and add/edit your BDH data.
11. If you temporarily disabled email confirmation, turn it back on after the first admin account is created if you want email confirmation for future accounts.

## GitHub Pages

Upload the contents of this folder to your repository root (including `supabase-config.js`, `supabase.sql`, `assets/`, `index.html`, `script.js`, and `style.css`). Enable GitHub Pages from the repository's Pages settings.

If your repository is a project site, the site can be under a path such as `https://USERNAME.github.io/REPOSITORY/`; all local asset links in this version are relative and work with that structure.

## Supabase URL configuration

If you use Supabase Auth email confirmation or password reset emails later, add your GitHub Pages URL under:
Authentication → URL Configuration → Site URL / Redirect URLs.

## Admin account management

The website dashboard manages the public Admin profile (name, role, bio, photo, Facebook, Instagram). It does NOT delete the underlying Supabase Auth user when an admin profile is deleted. Manage Auth users from Supabase Dashboard → Authentication → Users.

## Limits of the current version

- This is a static GitHub Pages frontend with Supabase as the backend.
- Supabase Storage bucket `bdh-assets` is public for public portfolio images. Do not upload private documents there.
- The Supabase anon key is safe to expose in a browser when Row Level Security is correctly configured. Never expose a service_role/secret key.
