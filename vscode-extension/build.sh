#!/usr/bin/sh

npm install --global yarn

#build HAL GUI
cd ../hal/gui
yarn
yarn run copy-monaco
yarn run build --output-hashing=none
cd ../../vscode-extension

# copy to extension folder
cp -rf ../hal/gui/build/* ./media/
# rename main files to remove hash
mv -f ./media/static/js/main.*.js ./media/static/js/main.js
mv -f ./media/static/css/main.*.css ./media/static/css/main.css

npm install
npm run compile