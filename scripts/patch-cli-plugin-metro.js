/**
 * Postinstall shim: Expo CLI 0.10 (SDK 49) imports
 * @react-native-community/cli-plugin-metro/build/commands/bundle/saveAssets
 * but React Native 0.81 renamed this to @react-native/community-cli-plugin
 * with restricted package exports. This script creates a compatibility shim
 * so `expo export --platform web` succeeds without upgrading the Expo SDK.
 */
const fs = require("fs");
const path = require("path");

const shimDir = path.join(
  __dirname,
  "../node_modules/@react-native-community/cli-plugin-metro/build/commands/bundle"
);

const packageDir = path.join(
  __dirname,
  "../node_modules/@react-native-community/cli-plugin-metro"
);

fs.mkdirSync(shimDir, { recursive: true });

// package.json for the shim package
fs.writeFileSync(
  path.join(packageDir, "package.json"),
  JSON.stringify({ name: "@react-native-community/cli-plugin-metro", version: "0.0.1-shim", main: "build/index.js" }, null, 2)
);

// saveAssets shim — for web exports this is a no-op; Expo handles web assets
// via exportAssetsAsync. For native platforms a basic file copy is performed.
const saveAssetsContent = `"use strict";
const path = require("path");
const fs = require("fs");

async function saveAssets(assets, platform, assetsDest) {
  if (platform === "web") return;
  if (!assetsDest) return;
  const copies = [];
  for (const asset of assets) {
    for (let i = 0; i < asset.files.length; i++) {
      const src = asset.files[i];
      const scale = asset.scales[i];
      const suffix = asset.scales.length > 1 ? "@" + scale + "x" : "";
      const dest = path.join(assetsDest, asset.httpServerLocation || "", asset.name + suffix + "." + asset.type);
      copies.push({ src, dest });
    }
  }
  await Promise.all(copies.map(({ src, dest }) => new Promise((resolve, reject) => {
    fs.mkdir(path.dirname(dest), { recursive: true }, (err) => {
      if (err) return reject(err);
      fs.copyFile(src, dest, (err2) => (err2 ? reject(err2) : resolve()));
    });
  })));
}

module.exports = saveAssets;
module.exports.default = saveAssets;
`;

fs.writeFileSync(path.join(shimDir, "saveAssets.js"), saveAssetsContent);

// buildBundle shim — proxies to @react-native/community-cli-plugin
const buildBundleContent = `"use strict";
const pkg = require("@react-native/community-cli-plugin");
exports.buildBundleWithConfig = pkg.unstable_buildBundleWithConfig || (() => { throw new Error("buildBundleWithConfig not available"); });
`;

fs.writeFileSync(path.join(shimDir, "buildBundle.js"), buildBundleContent);

console.log("✓ @react-native-community/cli-plugin-metro shim created");
