// app/about.tsx

import { View, Text } from "react-native";

export default function AboutScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text>YakQuest</Text>
      <Text>PLAN • PADDLE • EXPLORE</Text>
    </View>
  );
}