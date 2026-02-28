# Simple Whiteboard

Whiteboards with shapes, sticky notes, text, images and icons. Deployable as a simple docker container in your homelab. Includes support for multiple boards and import/export of individual boards.

## Features
- Draw shapes, add sticky notes, text, images and icons
- Copy/paste and drag/drop support for images
- Customizable text color, font weight, alignment, ...
- Manage multiple boards
- Share links to specific boards
- Import/export individual boards as JSON files
- Deployable as a simple docker container

Currently does not support:
- Real time collaboration (not planned for the foreseeable future)
- User accounts and permissions (ideally, put this behind a reverse proxy with authentication)

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev
```

## Building

To create a production version of your app:

```sh
npm run build
```
