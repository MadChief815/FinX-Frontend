# Finx Pulse Frontend

Frontend mobile application for **Finx Pulse**, a modern financial platform built with **React Native and Expo**.

The application provides the user interface, dashboards, financial insights, and communicates with the [Finx Pulse Backend](https://github.com/MadChief815/FinX-Pulse-Backend).

## Tech Stack

* React Native
* Expo
* TypeScript
* React Navigation
* REST API
* Expo Prebuild

## Getting Started

### 1. Clone

```bash
git clone https://github.com/MadChief815/FinX-Pulse-Frontend.git
cd FinX-Pulse-Frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment

Create a `.env` file and configure the backend API URL:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
```

> **Note:** When running the Android application on a physical device or Android emulator, `127.0.0.1` refers to the device/emulator itself. Use your computer's local network IP when required.

For example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```

### 4. Start the development server

```bash
npm start
```

You can then run the application on:

* Android emulator
* Physical Android device
* iOS simulator (macOS)
* Physical iOS device (macOS)

### 5. Expo Prebuild

This project uses **Expo Prebuild** to generate the native Android and iOS projects.

Generate the native projects with:

```bash
npx expo prebuild
```

To regenerate the native projects:

```bash
npx expo prebuild --clean
```

> `--clean` removes and regenerates the existing native `android` and `ios` directories.

### 6. Run Android

```bash
npx expo run:android
```

### 7. Run iOS

```bash
npx expo run:ios
```

> iOS builds require macOS and Xcode.

## Backend

This frontend requires the **Finx Pulse Backend**:

https://github.com/MadChief815/FinX-Pulse-Backend

## License

Licensed under the **Apache License 2.0**.
