const builder = require('electron-builder');

builder.build({
    config: {
        appId: "impromptu",
        productName: "impromptu",
        files: [
            "dist/*"
        ],
        directories: {
            output: "product"
        },
        linux:{
            target: "dir"
        }
    }
});
