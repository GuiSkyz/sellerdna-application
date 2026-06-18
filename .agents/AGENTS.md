# Workspace Rules

## Quality Assurance & Deployment
- **Always build before push:** Before running any `git push` or making deployment commits, you MUST run the build command (`npm run build`, `tsc`, etc.) locally to verify that there are no compilation or TypeScript errors. NEVER skip this step. This applies to both Frontend and Backend projects in this repository.
