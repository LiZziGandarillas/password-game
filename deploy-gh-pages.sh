#!/bin/bash

git checkout main

npm install

ng build --prod --base-href="https://LiZziGandarillas.github.io/password-game/"

git checkout -b gh-pages

cp -r dist/password-game/* .

touch .nojekyll

git add .

git commit -m "Deploy to GitHub Pages"

git push origin gh-pages --force

git checkout main

echo "Deployment complete! Visita https://LiZziGandarillas.github.io/password-game/"
