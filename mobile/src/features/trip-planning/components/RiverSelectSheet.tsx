import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

import { River } from "../../../data/types";

type Props = {
  visible: boolean;
  rivers: River[];
  recentRivers: River[];
  onClose: () => void;
  onSelectRiver: (river: River) => void;
};

export default function RiverSelectSheet({
  visible,
  rivers,
  recentRivers,
  onClose,
  onSelectRiver,
}: Props) {
  const [query, setQuery] = useState("");

  const filteredRivers = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return rivers;

    return rivers.filter((river) => {
      return (
        river.name.toLowerCase().includes(q) ||
        river.stateName.toLowerCase().includes(q) ||
        river.state.toLowerCase().includes(q)
      );
    });
  }, [query, rivers]);

  if (!visible) return null;

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose a River</Text>

        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>Close</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search rivers or states..."
        placeholderTextColor="#777"
        style={styles.search}
      />

      <ScrollView contentContainerStyle={styles.list}>
        {!query.trim() && recentRivers.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recently Viewed</Text>

            {recentRivers.map((river) => (
              <TouchableOpacity
                key={`recent-${river.id}`}
                style={styles.riverRow}
                onPress={() => {
                  onSelectRiver(river);
                  onClose();
                }}
              >
                <Text style={styles.riverName}>{river.name}</Text>
                <Text style={styles.riverMeta}>
                  {river.stateName} • Difficulty {river.difficulty}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>All Rivers</Text>
          </>
        )}
        {filteredRivers.length === 0 ? (
          <Text style={styles.empty}>No rivers found.</Text>
        ) : (
          filteredRivers.map((river) => (
            <TouchableOpacity
              key={river.id}
              style={styles.riverRow}
              onPress={() => {
                onSelectRiver(river);
                onClose();
              }}
            >
              <Text style={styles.riverName}>{river.name}</Text>
              <Text style={styles.riverMeta}>
                {river.stateName} • Difficulty {river.difficulty}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    maxHeight: "70%",
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  close: {
    fontSize: 14,
    color: "#1CA7A6",
    fontWeight: "700",
  },
  search: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    padding: 10,
    fontSize: 14,
    color: "#111",
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 4,
    fontSize: 13,
    fontWeight: "800",
    color: "#555",
    textTransform: "uppercase",
  },
  list: {
    paddingTop: 10,
    paddingBottom: 20,
  },
  riverRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  riverName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  riverMeta: {
    marginTop: 3,
    fontSize: 13,
    color: "#555",
  },
  empty: {
    paddingVertical: 20,
    color: "#555",
  },
});