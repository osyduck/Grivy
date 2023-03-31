javascript-obfuscator index.js --output 'build'
cp package.json ./build
cp package-lock.json ./build
cp config.json ./build 

cd build
npm install

nexe . --target 'macos-x64-14.15.3' --resources 'node_modules/**/*' --resources 'lib/**/*' --output 'gojek-macos-x64' --build true --python=$(which python3) --verbose true
nexe . --target 'win-x64-14.15.3' --resources 'node_modules/**/*' --resources 'lib/**/*' --output 'gojek-win-x64' --build true --python=$(which python3) --verbose true
nexe . --target 'win-x86-14.15.3' --resources 'node_modules/**/*' --resources 'lib/**/*' --output 'gojek-win-x86' --build true --python=$(which python3) --verbose true
nexe . --target 'linux-x64-14.15.3' --resources 'node_modules/**/*' --resources 'lib/**/*' --output 'gojek-linux-x64' --build true --python=$(which python3) --verbose true
nexe . --target 'linux-x86-14.15.3' --resources 'node_modules/**/*' --resources 'lib/**/*' --output 'gojek-linux-x86' --build true --python=$(which python3) --verbose true
#nexe . --target 'alpine-x64-12.9.1' --resources 'node_modules/**/*' --resources 'lib/**/*'  --resources 'txtdarigojek.txt' --output 'gojek-alpine-x64'
#nexe . --target 'alpine-x86-12.9.1' --resources 'node_modules/**/*' --resources 'lib/**/*'  --resources 'txtdarigojek.txt' --output 'gojek-alpine-x86'

rm -rf node_modules
rm -f package-lock.json
rm -f package.json
rm -f index.js
rm -f config.json