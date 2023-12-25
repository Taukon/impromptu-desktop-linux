module.exports = {
    env: {
        es2020: true,
        node: true,
        browser: true
    },
    ignorePatterns: ["webpack.config.js", ".eslintrc.js", "build.js"],
    extends: [
        'plugin:react/recommended',
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
        "@typescript-eslint",
        'react',
    ],
    rules: {
        "@typescript-eslint/no-explicit-any": 1,
        "@typescript-eslint/no-non-null-assertion": 1,
        "react/jsx-uses-react": 0,
        "react/react-in-jsx-scope": 0,
        "react/prop-types": 0,
    },
    root: true
}