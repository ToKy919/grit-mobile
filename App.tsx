/**
 * GRIT — Main App Entry
 * Premium training app for hybrid athletes
 */

import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useWorkoutHistoryStore } from "./src/stores/useWorkoutHistoryStore";
import { useFonts, PlayfairDisplay_700Bold, PlayfairDisplay_900Black } from "@expo-google-fonts/playfair-display";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "./src/design/tokens";
import { NavBar } from "./src/components/NavBar";
import { HomeScreen } from "./src/screens/HomeScreen";
import { RunTrackerScreen } from "./src/screens/RunTrackerScreen";
import { LiveWorkoutScreen } from "./src/screens/LiveWorkoutScreen";
import { HyroxScreen } from "./src/screens/HyroxScreen";
import { ProgressScreen } from "./src/screens/ProgressScreen";
import { VideoStudioScreen } from "./src/screens/VideoStudioScreen";

export default function App() {
  const [activeTab, setActiveTab] = useState(0);

  // Load persisted data on startup
  useEffect(() => {
    useWorkoutHistoryStore.getState().loadFromStorage();
  }, []);

  const [fontsLoaded] = useFonts({
    PlayfairDisplay_700Bold,
    PlayfairDisplay_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.neonYellow} />
      </View>
    );
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 0: return <HomeScreen onStartSession={() => setActiveTab(2)} />;
      case 1: return <RunTrackerScreen />;
      case 2: return <LiveWorkoutScreen />;
      case 3: return <HyroxScreen />;
      case 4: return <ProgressScreen />;
      case 5: return <VideoStudioScreen />;
      default: return <HomeScreen onStartSession={() => setActiveTab(2)} />;
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        {renderScreen()}
        <NavBar
          activeIndex={activeTab > 5 ? 0 : activeTab}
          onTabPress={(i) => setActiveTab(i)}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
  },
});
