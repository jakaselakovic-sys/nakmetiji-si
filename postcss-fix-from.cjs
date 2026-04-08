// Fix for Turbopack: when Turbopack invokes PostCSS it does not set opts.from.
// @tailwindcss/postcss computes its compilation base as:
//   path.dirname(path.resolve(opts.from ?? ""))
// When opts.from is empty, path.resolve("") === process.cwd() (the project root),
// so dirname gives the *parent* of the project (Desktop), which breaks resolution.
// This plugin runs first and sets opts.from from the CSS source file when missing.
const path = require("path");

const plugin = () => ({
  postcssPlugin: "fix-turbopack-from",
  Once(root, { result }) {
    if (!result.opts.from) {
      const file = root.source?.input?.file;
      result.opts.from = file ?? path.join(__dirname, "src/app/globals.css");
    }
  },
});
plugin.postcss = true;

module.exports = plugin;
