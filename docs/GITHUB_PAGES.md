# GitHub Pages

This is a static browser game; no bundler or server-side runtime is required.

1. Push the repository contents to `main`.
2. In GitHub, open **Settings → Pages** and select **GitHub Actions** as the source if prompted.
3. Open **Actions → Deploy GitHub Pages → Run workflow**.
4. Once complete, open the URL printed in the deploy job summary.

The workflow is intentionally manual to avoid accidentally publishing during ordinary development. The current package is a release candidate, not a final public release. **Do not deploy publicly until the asset redistribution license and physical-device test gates in [`PUBLICATION_CHECKLIST.md`](PUBLICATION_CHECKLIST.md) are complete.**

For local testing use `python -m http.server 8000` and open `http://localhost:8000`. Do not open `index.html` directly using `file://`.
