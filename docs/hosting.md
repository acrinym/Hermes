# Hosting Plugin Manifests and Skins

Serve your plugin goodies from GitHub Pages or Netlify so Hermes can fetch them easily. 😄

## GitHub Pages
1. Place manifest or skin files in a public repo.
2. Under **Settings > Pages**, choose the branch and folder to publish.
3. The files become available at `https://<user>.github.io/<repo>/<file>`.

## Netlify
1. Create a new site from your repository.
2. Set the publish directory to the folder with manifest/skin files.
3. Deploy and use the generated URL to reference your assets.

Both services require public access for Hermes to load the assets. ✅
