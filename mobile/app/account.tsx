import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
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
  updateProfile,
} from "../src/services/authService";
import type { AuthUser } from "@yakquest/shared";
import { syncUserData } from "../src/services/syncService";
import TripQrModal from "../src/features/trip-participants/components/TripQrModal";

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
] as const;

export default function AccountScreen() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [
    showTripQr,
    setShowTripQr,
  ] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [
    profileDisplayName,
    setProfileDisplayName,
  ] = useState("");

  const [
    profileHomeState,
    setProfileHomeState,
  ] = useState("AL");

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(false);

  const [
    showStatePicker,
    setShowStatePicker,
  ] = useState(false);

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
    const currentUser =
      await getCurrentUser();

    setUser(currentUser);

    if (currentUser) {
      setProfileDisplayName(
        currentUser.display_name ||
          "YakQuest User"
      );

      setProfileHomeState(
        currentUser.home_state ||
          "AL"
      );
    }
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

      const result =
        await login(email, password);

      setUser(result.user);

      setProfileDisplayName(
        result.user.display_name ||
          "YakQuest User"
      );

      setProfileHomeState(
        result.user.home_state ||
          "AL"
      );

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

      const result = await register(email, password);
      setUser(result.user);

      setProfileDisplayName(
        result.user.display_name ||
          "YakQuest User"
      );

      setProfileHomeState(
        result.user.home_state ||
          "AL"
      );

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

  const handleUpdateProfile = async () => {
    const cleanedDisplayName =
      profileDisplayName.trim();

    if (cleanedDisplayName.length > 255) {
      Alert.alert(
        "Display Name Too Long",
        "Display name must be 255 characters or fewer."
      );
      return;
    }

    if (!profileHomeState) {
      Alert.alert(
        "Home State Required",
        "Select your home state."
      );
      return;
    }

    try {
      setProfileLoading(true);

      const updatedUser =
        await updateProfile(
          cleanedDisplayName ||
            "YakQuest User",
          profileHomeState
        );

      setUser(updatedUser);

      setProfileDisplayName(
        updatedUser.display_name ||
          "YakQuest User"
      );

      setProfileHomeState(
        updatedUser.home_state ||
          "AL"
      );

      Alert.alert(
        "Profile Updated",
        "Your profile was saved successfully."
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Unable to Update Profile",
        error instanceof Error
          ? error.message
          : "Please try again."
      );
    } finally {
      setProfileLoading(false);
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
          <Text style={styles.sectionTitle}>
            Account
          </Text>

          <Text style={styles.label}>
            Display Name
          </Text>
          <Text style={styles.value}>
            {user.display_name ||
              "YakQuest User"}
          </Text>

          <Text style={styles.label}>
            Email
          </Text>
          <Text style={styles.value}>
            {user.email}
          </Text>

          <Text style={styles.label}>
            Home State
          </Text>
          <Text style={styles.value}>
            {US_STATES.find(
              (state) =>
                state.code ===
                user.home_state
            )?.name ||
              user.home_state ||
              "Alabama"}
          </Text>

          <Text style={styles.label}>
            Trust Score
          </Text>
          <Text style={styles.value}>
            {user.trust_score}
          </Text>

          <Text style={styles.label}>
            Admin
          </Text>
          <Text style={styles.value}>
            {user.is_admin ? "Yes" : "No"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Profile
          </Text>

          <Text style={styles.cardDescription}>
            Your home state helps YakQuest show
            more relevant rivers and paddling
            information.
          </Text>

          <Text style={styles.inputLabel}>
            Display Name
          </Text>

          <TextInput
            style={styles.input}
            placeholder="YakQuest User"
            value={profileDisplayName}
            onChangeText={
              setProfileDisplayName
            }
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={255}
          />

          <Text style={styles.inputLabel}>
            Home State
          </Text>

          <TouchableOpacity
            style={styles.selectInput}
            onPress={() =>
              setShowStatePicker(true)
            }
          >
            <Text style={styles.selectInputText}>
              {US_STATES.find(
                (state) =>
                  state.code ===
                  profileHomeState
              )?.name || "Select a state"}
            </Text>

            <Text style={styles.selectArrow}>
              ▼
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              profileLoading &&
                styles.disabledButton,
            ]}
            onPress={handleUpdateProfile}
            disabled={profileLoading}
          >
            <Text style={styles.buttonText}>
              {profileLoading
                ? "Saving..."
                : "Save Profile"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            setShowTripQr(true)
          }
        >
          <Text style={styles.buttonText}>
            My Trip QR Code
          </Text>
        </TouchableOpacity>

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

        <Modal
          visible={showStatePicker}
          transparent
          animationType="fade"
          onRequestClose={() =>
            setShowStatePicker(false)
          }
        >
          <View style={styles.modalOverlay}>
            <View style={styles.stateModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Select Home State
                </Text>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() =>
                    setShowStatePicker(false)
                  }
                >
                  <Text
                    style={
                      styles.modalCloseButtonText
                    }
                  >
                    ✕
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.stateList}
                contentContainerStyle={
                  styles.stateListContent
                }
              >
                {US_STATES.map((state) => {
                  const isSelected =
                    state.code ===
                    profileHomeState;

                  return (
                    <TouchableOpacity
                      key={state.code}
                      style={[
                        styles.stateOption,
                        isSelected &&
                          styles.selectedStateOption,
                      ]}
                      onPress={() => {
                        setProfileHomeState(
                          state.code
                        );
                        setShowStatePicker(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.stateOptionText,
                          isSelected &&
                            styles.selectedStateOptionText,
                        ]}
                      >
                        {state.name}
                      </Text>

                      <Text
                        style={[
                          styles.stateCode,
                          isSelected &&
                            styles.selectedStateOptionText,
                        ]}
                      >
                        {state.code}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
        
        <TripQrModal
          visible={showTripQr}
          onClose={() =>
            setShowTripQr(false)
          }
        />
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

  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.72,
    marginBottom: 8,
  },

  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.75,
    marginTop: 6,
  },

  selectInput: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.2)",
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
  },

  selectInputText: {
    fontSize: 16,
    color: "#111111",
  },

  selectArrow: {
    fontSize: 12,
    opacity: 0.6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 20,
  },

  stateModal: {
    maxHeight: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    overflow: "hidden",
  },

  modalHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor:
      "rgba(0,0,0,0.12)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: "800",
  },

  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor:
      "rgba(0,0,0,0.08)",
  },

  modalCloseButtonText: {
    fontSize: 17,
    fontWeight: "700",
  },

  stateList: {
    flexGrow: 0,
  },

  stateListContent: {
    padding: 10,
  },

  stateOption: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectedStateOption: {
    backgroundColor: "#1f6f4a",
  },

  stateOptionText: {
    fontSize: 16,
    color: "#111111",
  },

  stateCode: {
    fontSize: 13,
    fontWeight: "700",
    opacity: 0.65,
  },

  selectedStateOptionText: {
    color: "#ffffff",
    opacity: 1,
  },
});