import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../src/services/backgroundNavigationService";

export default function Layout() {
  return (
    <>
      <StatusBar style="dark" translucent={false} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
    // <Stack>
    //   <Stack.Screen
    //     name="index"
    //     options={{ headerShown: false }}
    //   />
    // </Stack>
  )    
}