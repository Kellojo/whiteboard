# 🧠 Simple Whiteboard

Whiteboards with shapes, sticky notes, text, images and icons. Deployable as a simple docker container in your homelab. Includes support for multiple boards and import/export of individual boards.

## ✨ Features

- 🟦 Draw shapes, add sticky notes, text, images and icons
- 📋 Copy/paste and drag/drop support for images
- 🎨 Customizable text color, font weight, alignment, ...
- 🗂️ Manage multiple boards
- 🔗 Share links to specific boards
- 📦 Import/export individual boards as JSON files
- 🐳 Deployable as a simple docker container

## 🚫 Currently does not support

- 🤝 Real time collaboration (not planned for the foreseeable future)
- 🔐 User accounts and permissions (ideally, put this behind a reverse proxy with authentication)

## 🏠 Self-hosting

The recommended way to self-host is using Docker. You can use the provided `docker-compose.yml` file to get started quickly.

```yaml
services:
  whiteboard:
    image: ghcr.io/kellojo/whiteboard:latest
    container_name: whiteboard
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - ORIGIN=http://localhost:3000
    volumes:
      - ./whiteboards:/app/.whiteboards
```

:::warning
The app does not include any authentication or access control mechanisms. Make sure to put it behind a reverse proxy with authentication to prevent unauthorized access.
:::

## 🤝 Contributing

Contributions are very welcome! If you want to contribute, please open an issue or a pull request.

Things that would be nice to have:

- 🔺 More shapes (e.g. circles, arrows, ...)
- ✍️ More text formatting options (e.g. italic, underline, ...)
- 🖼️ More image editing options (e.g. cropping, rotating, ...)
- 🧭 Favicon and app icon
- 📱 Better support for mobile and touch devices

### 🛠️ Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev
```

### 📦 Building

To create a production version of your app:

```sh
npm run build
```
