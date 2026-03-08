import 'dotenv/config';

export default {
  expo: {
    name: "CREATECH",
    slug: "createch-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/adaptive-icon.png",
    scheme: ["createchapp", "com.almond.x7.createchapp"],
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.almond.x7.createchapp",
      infoPlist: {
        NSPhotoLibraryUsageDescription: "Allow CREATECH to access your photos to let you share images in chats.",
        NSPhotoLibraryAddUsageDescription: "Allow CREATECH to save photos to your library."
      }
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#FFFFFF",
        foregroundImage: "./assets/adaptive-icon.png",
        monochromeImage: "./assets/adaptive-icon.png",
      },
      edgeToEdgeEnabled: true,
      softwareKeyboardLayoutMode: "resize",
      predictiveBackGestureEnabled: false,
      package: "com.almond.x7.createchapp",
      permissions: [
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_MEDIA_LOCATION"
      ]
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/adaptive-icon.png"
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/splash-icon-dark.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            image: "./assets/splash-icon-light.png",
            backgroundColor: "#000000"
          }
        }
      ],
      "expo-secure-store",
      "expo-font",
      [
        "expo-tracking-transparency",
        {
          "userTrackingPermission": "This identifier will be used to deliver personalized ads to you."
        }
      ],
      [
        "expo-image-picker",
        {
          "photosPermission": "The app accesses your photos to let you share them with other users.",
          "cameraPermission": "Allow $(PRODUCT_NAME) to open the camera",
          "//": "Disable the microphone permission if you don't need video recording",
          "microphonePermission": false
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      router: {
        appRoot: "app"
      },
      eas: {
        projectId: "232db0b7-e835-4c24-a8a3-44ac95f56d23"
      }
    }
  }
};
