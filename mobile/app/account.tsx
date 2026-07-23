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
  changePassword,
  deleteAccount,
  forgotPassword,
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

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmNewPassword,
    setConfirmNewPassword,
  ] = useState("");

  const [
    deletePassword,
    setDeletePassword,
  ] = useState("");

  const [
    deleteConfirmation,
    setDeleteConfirmation,
  ] = useState("");

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

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        "Email Required",
        "Enter your account email first."
      );
      return;
    }

    try {
      setLoading(true);

      const message =
        await forgotPassword(
          email.trim()
        );

      Alert.alert(
        "Check Your Email",
        message
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Unable to Send Reset Link",
        error instanceof Error
          ? error.message
          : "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  const handleChangePassword = async () => {
    if (
      !currentPassword ||
      !newPassword
    ) {
      Alert.alert(
        "Missing Information",
        "Enter your current and new password."
      );
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert(
        "Password Too Short",
        "The new password must contain at least 8 characters."
      );
      return;
    }

    if (
      newPassword !==
      confirmNewPassword
    ) {
      Alert.alert(
        "Passwords Do Not Match",
        "Re-enter the new password."
      );
      return;
    }

    try {
      setLoading(true);

      const message =
        await changePassword(
          currentPassword,
          newPassword
        );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      Alert.alert(
        "Password Changed",
        message
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Unable to Change Password",
        error instanceof Error
          ? error.message
          : "Please try again."
      );
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteAccount = () => {
    if (!deletePassword) {
      Alert.alert(
        "Password Required",
        "Enter your current password."
      );
      return;
    }

    if (
      deleteConfirmation !== "DELETE"
    ) {
      Alert.alert(
        "Confirmation Required",
        'Type "DELETE" exactly.'
      );
      return;
    }

    Alert.alert(
      "Delete YakQuest Account?",
      "This permanently deletes your account, saved trips, trip history, and pending contributions. Approved contributions will remain anonymously.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const message =
                await deleteAccount(
                  deletePassword
                );

              setUser(null);
              setDeletePassword("");
              setDeleteConfirmation("");

              Alert.alert(
                "Account Deleted",
                message
              );
            } catch (error) {
              console.error(error);

              Alert.alert(
                "Unable to Delete Account",
                error instanceof Error
                  ? error.message
                  : "Please try again."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Change Password
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Current password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            value={confirmNewPassword}
            onChangeText={setConfirmNewPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              Change Password
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.card,
            styles.dangerCard,
          ]}
        >
          <Text style={styles.sectionTitle}>
            Delete Account
          </Text>

          <Text style={styles.dangerText}>
            This permanently deletes your
            account, saved trips, trip history,
            and pending contributions.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Current password"
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder='Type "DELETE"'
            value={deleteConfirmation}
            onChangeText={setDeleteConfirmation}
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={[
              styles.deleteButton,
              deleteConfirmation !== "DELETE" &&
                styles.disabledButton,
            ]}
            onPress={handleDeleteAccount}
            disabled={
              loading ||
              deleteConfirmation !== "DELETE"
            }
          >
            <Text style={styles.deleteButtonText}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </View>

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
        style={styles.textButton}
        onPress={handleForgotPassword}
        disabled={loading}
      >
        <Text style={styles.textButtonText}>
          Forgot Password?
        </Text>
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
    paddingBottom: 60,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },

  textButton: {
    paddingVertical: 6,
    alignItems: "center",
  },

  textButtonText: {
    color: "#1f6f4a",
    fontSize: 14,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  dangerCard: {
    borderWidth: 1,
    borderColor: "#d78b8b",
    backgroundColor: "#fff6f6",
  },

  dangerText: {
    color: "#7f3030",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 6,
  },

  deleteButton: {
    backgroundColor: "#b72e2e",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },

  deleteButtonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 16,
  },

  disabledButton: {
    opacity: 0.45,
  },
});