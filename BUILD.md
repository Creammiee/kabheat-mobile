# KabHeat Mobile - Build Instructions 🚀

This guide explains how to compile the KabHeat React code and generate native installers (APK for Android, and IPA/TestFlight for iOS) for the first time.

> [!IMPORTANT]
> **Prerequisites**
> - **Node.js** (v18+) installed
> - **Android Studio** installed (for Android APKs)
> - **Xcode** installed on a macOS device (for iOS builds)

---

## 1. Initial Setup & Compilation
Whenever you pull the code from GitHub for the first time (or whenever you change the React JavaScript code), you must compile the web assets into the native Android/iOS folders.

1. Open your terminal in the root of the `kabheat-mobile` project.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the React app and sync it to the native Capacitor platforms:
   ```bash
   npm run build
   ```
   *(This command runs `vite build` to generate the HTML/CSS/JS, and then `npx cap sync` to copy those files into the `/android` and `/ios` folders).*

---

## 2. Building for Android (Generating an APK)

1. Open the Android project in Android Studio by running:
   ```bash
   npx cap open android
   ```
2. Wait for **Gradle Sync** to finish. You'll see a loading bar at the bottom right of Android Studio. *Do not click anything until this finishes.*
3. In the top menu bar, click **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
4. Android Studio will begin compiling the native Java/Kotlin code. 
5. When finished, a small popup will appear in the bottom right corner. Click the **"locate"** button.
6. This will open your file explorer directly to the `app-debug.apk` file. 
7. **Install on Phone:** You can now email this APK to yourself, upload it to Google Drive, or plug in your phone via USB to transfer and install it!

> [!TIP]
> To build a production-ready APK for the Google Play Store, use **Build** > **Generate Signed Bundle / APK...** instead, and provide your Keystore credentials.

---

## 3. Building for iOS (iPhone)

> [!WARNING]
> Bluetooth features (like connecting to your Raspberry Pi Pico) **do not work on iOS Simulators**. You must build the app directly onto a physical iPhone.

1. Open the iOS project in Xcode by running:
   ```bash
   npx cap open ios
   ```
2. Plug your physical iPhone into your Mac using a USB-C/Lightning cable.
3. At the very top of the Xcode window (in the center), click the device dropdown menu and select your physical iPhone.
4. In the left sidebar, click on **App** (it has a blue icon).
5. Click the **Signing & Capabilities** tab in the main window.
6. Check the box for **"Automatically manage signing"**.
7. In the **Team** dropdown, select your Apple ID (Personal Team). 
   - *If it's your first time, you may need to click "Add an Account..." and sign in with your Apple ID.*
8. Once signing is resolved, click the big **Play (▶)** button in the top left corner of Xcode.
9. The app will compile and install directly onto your iPhone!

> [!NOTE]
> If you get an "Untrusted Developer" error on your iPhone when trying to open the app, go to **Settings > General > VPN & Device Management**, tap your Apple ID, and click **Trust**.
