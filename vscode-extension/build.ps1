#!/usr/bin/env pwsh

npm install --global yarn

# build HAL GUI
pushd ../hal/gui
yarn
yarn run copy-monaco
yarn run build --output-hashing=none
popd

# copy to extension folder
cp ./../hal/gui/build/* ./media/ -Recurse -Force
# rename main files to remove hash
mv ./media/static/js/main.*.js ./media/static/js/main.js -Force
mv ./media/static/css/main.*.css ./media/static/css/main.css -Force

npm install
npm run compile