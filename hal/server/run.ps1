#!/usr/bin/env pwsh

New-Item -ItemType Directory -Force -Path ./tmp/
Invoke-WebRequest https://rtsys.informatik.uni-kiel.de/~kieler/files/release_sccharts_1.3.0/cli/kicodia.win.jar -OutFile tmp/kicodia.win.jar

./gradlew bootRun