const bwipjs = require('bwip-js');
const fs = require('fs');

bwipjs.toBuffer({
        bcid:        'code128',       // Barcode type
        text:        'A95CECF03QPA',    // Text to encode
        scale:       3,               // 3x scaling factor
        height:      10,              // Bar height, in millimeters
        includetext: true,            // Show human-readable text
        textxalign:  'center',        // Always good to set this
        padding: 10
    }, function (err, png) {
        if (err) {
            // `err` may be a string or Error object
        } else {
            fs.writeFileSync('barcode.png', png);
            // `png` is a Buffer
            // png.length           : PNG file length
            // png.readUInt32BE(16) : PNG image width
            // png.readUInt32BE(20) : PNG image height
        }
    });