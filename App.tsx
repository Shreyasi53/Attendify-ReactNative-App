/**
 * Attendify - WebView App
 * React Native WebView app with splash screen + download + camera + excel save support
 *
 * @format
 */

import React, { useState, useEffect, useRef } from "react";
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Image,
  ActivityIndicator,
  BackHandler,
  Linking,
  Alert,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import RNFS from "react-native-fs";
import Share from "react-native-share";

function App() {
  const isDarkMode = useColorScheme() === "dark";
  const [showSplash, setShowSplash] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  const webViewRef = useRef<WebView>(null);

  // Splash screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Android back button support
  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [canGoBack]);

  // Normal URL downloads
  const handleDownload = async (event: any) => {
    try {
      const downloadUrl = event?.nativeEvent?.downloadUrl;

      if (downloadUrl) {
        Alert.alert("Download", "Opening download link...");
        Linking.openURL(downloadUrl);
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Error", "Download failed!");
    }
  };

  // ✅ Save Excel file into Downloads folder
  const saveExcelFile = async (fileName: string, base64: string) => {
    try {
      const filePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

      await RNFS.writeFile(filePath, base64, "base64");

      Alert.alert(
        "Download Success ✅",
        `Excel saved successfully!\n\nSaved in Downloads:\n${filePath}`
      );

      // Share file so user can open in Excel
      await Share.open({
        url: "file://" + filePath,
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename: fileName,
        failOnCancel: false,
      });
    } catch (err) {
      console.log("File Save Error:", err);
      Alert.alert("Error", "Failed to save Excel file!");
    }
  };

  // Splash Screen UI
  if (showSplash) {
    return (
      <SafeAreaView
        style={[
          styles.splashContainer,
          { backgroundColor: isDarkMode ? "#000" : "#fff" },
        ]}
      >
        <StatusBar
          backgroundColor={isDarkMode ? "#000000" : "#ffffff"}
          barStyle={isDarkMode ? "light-content" : "dark-content"}
        />

        <View style={styles.splashContent}>
          <Image
            source={require("./assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <ActivityIndicator
            size="large"
            color={isDarkMode ? "#ffffff" : "#000000"}
            style={styles.loader}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Main App UI
  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#000" : "#fff" },
      ]}
    >
      <StatusBar
        translucent={false}
        backgroundColor={isDarkMode ? "#000000" : "#ffffff"}
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />

      <WebView
        ref={webViewRef}
        source={{ uri: "https://attendance-systemmm.netlify.app" }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}

        // ✅ Cache + Cookies (Fix logout issue)
        cacheEnabled={true}
        cacheMode="LOAD_DEFAULT"
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        incognito={false}
        mixedContentMode="always"

        // ✅ WebView Settings
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}

        // ✅ Camera + Location Support
        geolocationEnabled={true}
        allowsProtectedMedia={true}
        mediaCapturePermissionGrantType="grant"

        onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
        onFileDownload={handleDownload}
        originWhitelist={["*"]}

        // ✅ Receive Excel from website
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);

            if (data.type === "downloadExcel") {
              saveExcelFile(data.fileName, data.base64);
            }
          } catch (err) {
            console.log("WebView Message Error:", err);
          }
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  splashContainer: {
    flex: 1,
  },

  splashContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },

  loader: {
    marginTop: 20,
  },

  webview: {
    flex: 1,
  },
});

export default App;
