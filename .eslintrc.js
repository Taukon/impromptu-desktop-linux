module.exports = {
    env: {
        es2020: true,
        node: true,
        browser: true
    },
    ignorePatterns: ["webpack.config.js", ".eslintrc.js", "build.js"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "prettier"
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        "ecmaVersion": "latest",
        "sourceType": "module",
        "project": "./tsconfig.json"
    },
    plugins: [
        "@typescript-eslint"
    ],
    rules: {
        "@typescript-eslint/no-explicit-any": 1,
        "@typescript-eslint/no-non-null-assertion": 1
    },
    root: true
}