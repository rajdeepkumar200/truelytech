# How to Build Your Android App (APK)

This guide will help you turn your website into an Android app file (`.apk`) that anyone can download and install.

## Phase 1: Install Necessary Tools

1.  **Download Android Studio**
    *   Go to: [https://developer.android.com/studio](https://developer.android.com/studio)
    *   Download and install the version for Windows.
    *   During installation, make sure **"Android Virtual Device"** is checked.
    *   **Important**: When you open it for the first time, it will ask to download "SDK Components". Let it download everything (this can take 10-15 minutes).

## Phase 2: Open the Project

**CRITICAL STEP:**
1.  Open **Android Studio**.
2.  Click **Open** (or File > Open).
3.  **You MUST select the `android` folder specifically.**
    *   Navigate to: `C:\Users\rajde\Desktop\truelytech`
    *   Double-click `truelytech` to go inside.
    *   Select the folder named **`android`**.
    *   Click **OK**.
    *   *Do NOT open the main `truelytech` folder. Open the `android` folder inside it.*

4.  **Wait for Sync (Very Important)**:
    *   Look at the bottom-right of the window.
    *   You will see a progress bar saying "Gradle Sync" or "Indexing".
    *   **You cannot build until this finishes.** It might take 5-10 minutes.
    *   If it asks to "Update Gradle" or "Install SDK", say **Yes/Update**.

## Phase 3: Build the APK File

**If the "Build APK" option is missing:**
*   It means the project hasn't finished syncing or you opened the wrong folder.
*   Go to **File > Sync Project with Gradle Files**.
*   Wait for the bottom progress bar to finish completely.

1.  **Locate the Top Menu Bar**:
    *   Look at the very top of the Android Studio window.
    *   You should see a row of words: **File | Edit | View | Navigate | Code | Refactor | Build | Run ...**
    *   Click on the word **Build**.
    *   *Note: If you don't see this bar, click the "Hamburger" menu (three horizontal lines ≡) in the top-left corner, then go to Build.*

2.  **Hover over** the option that says **Generate App Bundles or APKs**.
    *   *(In your screenshot, it is the 7th option down, with an arrow `>` next to it).*
    *   When you hover over it, a side menu will pop out.

3.  In that side menu, click **Generate APKs**.
    *   *(It might be the first option in the small side menu).*

4.  A progress bar will appear at the bottom right. Wait for it to finish.
5.  When done, a popup will appear: "APK(s) generated successfully".
6.  Click the blue **locate** link in that popup.
    *   *If you missed the popup, go to this folder on your computer:*
        `C:\Users\rajde\Desktop\truelytech\android\app\build\outputs\apk\debug\`

## Phase 4: Put the App on Your Website

1.  You should see a file named `app-debug.apk` in that folder.
2.  **Rename** this file to `app-release.apk`.
3.  **Copy** this file.
4.  **Paste** it into your website's public folder:
    `C:\Users\rajde\Desktop\truelytech\public\`
5.  Now, when you deploy your website, the "Download APK" button on the Install page will work!

## Troubleshooting

*   **"SDK location not found"**: If Android Studio complains about SDKs, go to **Tools > SDK Manager** and install the latest Android SDK Platform (e.g., Android 14 or 15).
*   **Build Failed**: Try clicking **File > Sync Project with Gradle Files** and try building again.

## Desktop App
For desktop, the "Install App" button on the website (PWA) is the best way to install it without an app store. It works on Windows, macOS, and Linux via Chrome/Edge.
