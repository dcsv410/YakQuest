import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  getCurrentUser,
  login,
  logout,
  register,
} from "../src/services/authService";
import type { AuthUser } from "@yakquest/shared";
import { syncUserData } from "../src/services/syncService";

export default function AccountScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const loadUser = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  useEffect(() => {
    loadUser();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const result = await login(email, password);
      setUser(result.user);

      setSyncing(true);
      await syncUserData();

      Alert.alert("Logged in", "Your saved trips have been synced.");
    } catch (error) {
      console.error(error);
      Alert.alert("Login failed", "Check your email and password.");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert("Missing info", "Enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const result = await register(email, password, displayName || undefined);
      setUser(result.user);

      setSyncing(true);
      await syncUserData();

      Alert.alert("Account created", "Your account is ready and trips are synced.");
    } catch (error) {
      console.error(error);
      Alert.alert("Registration failed", "This email may already be registered.");
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await syncUserData();
      Alert.alert("Synced", "Saved trips are up to date.");
    } catch (error) {
      console.error(error);
      Alert.alert("Sync failed", "Could not sync saved trips.");
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    Alert.alert("Logged out", "You can still use local saved trips on this device.");
  };

  if (user) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Account</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Signed in as</Text>
          <Text style={styles.value}>{user.email}</Text>

          {user.display_name ? (
            <>
              <Text style={styles.label}>Name</Text>
              <Text style={styles.value}>{user.display_name}</Text>
            </>
          ) : null}

          <Text style={styles.label}>Admin</Text>
          <Text style={styles.value}>{user.is_admin ? "Yes" : "No"}</Text>

          <Text style={styles.label}>Trust Score</Text>
          <Text style={styles.value}>{user.trust_score}</Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSync} disabled={syncing}>
          <Text style={styles.buttonText}>
            {syncing ? "Syncing..." : "Sync Saved Trips"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
          <Text style={styles.secondaryButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Account</Text>
      <Text style={styles.subtitle}>
        An account is optional. You only need one to sync saved trips and submit contributions.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Please wait..." : "Log In"}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.secondaryButtonText}>Create Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
    opacity: 0.75,
  },
  card: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(20,25,35,0.08)",
    gap: 6,
  },
  label: {
    fontSize: 13,
    opacity: 0.65,
    marginTop: 8,
  },
  value: {
    fontSize: 17,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#1f6f4a",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#1f6f4a",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#1f6f4a",
    fontWeight: "700",
    fontSize: 16,
  },
});