import path from "path";

// In Turbopack's PostCSS worker, process.cwd() is the project root.
// import.meta.url is NOT reliable here — Turbopack rewrites it to a .next/ path.
// So we use process.cwd() to compute all paths.

export default {
  plugins: [
    // Runs first: fixes opts.from when Turbopack leaves it set to the project root
    // instead of the actual CSS file path, which causes @tailwindcss/postcss to
    // resolve tailwindcss from the wrong directory (parent of project root).
    [path.join(process.cwd(), "postcss-fix-from.cjs"), {}],
    ["@tailwindcss/postcss", { base: process.cwd() }],
  ],
};
