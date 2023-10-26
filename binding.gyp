{
  "targets": [
    {
      "target_name": "screenshot",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [ "lib/screenshot.cc" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      'libraries': [
        '-lX11'
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
    },
    {
      "target_name": "converter",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "sources": [ "lib/converter.cc" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      'libraries': [
        '-ljpeg'
      ],
      'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
    },
    {
        "target_name": "x11Simulator",
        "cflags!": ["-fno-exceptions"],
        "cflags_cc!": ["-fno-exceptions"],
        "sources": ["lib/x11Simulator.cc"],
        "include_dirs": [
            "<!@(node -p \"require('node-addon-api').include\")"
        ],
        'libraries': [
            '-lX11', '-lXtst', '-lxcb'
        ],
        'defines': ['NAPI_DISABLE_CPP_EXCEPTIONS'],
    }
  ]
}