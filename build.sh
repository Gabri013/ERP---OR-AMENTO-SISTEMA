#!/bin/bash
cd api-server
npm install
npx prisma generate
npm run build
cd ../sistema-os
npm ci
npm run build
