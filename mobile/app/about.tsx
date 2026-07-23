import {
  ABOUT_ATTRIBUTIONS,
  ABOUT_INTRODUCTION,
  ABOUT_LEGAL_NOTE,
  ABOUT_SECTIONS,
  YAKQUEST_CONTACT_EMAIL,
  YAKQUEST_COPYRIGHT_YEAR,
  YAKQUEST_NAME,
  YAKQUEST_TAGLINE,
  YAKQUEST_WEBSITE,
} from "@yakquest/shared";

import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

async function openLink(url: string) {
  try {
    const supported = await Linking.canOpenURL(url);

    if (!supported) {
      Alert.alert(
        "Unable to Open Link",
        "This link could not be opened on your device."
      );
      return;
    }

    await Linking.openURL(url);
  } catch (error) {
    console.error("Failed to open link", error);

    Alert.alert(
      "Unable to Open Link",
      "Something went wrong while opening this link."
    );
  }
}

export default function AboutScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>
          About YakQuest
        </Text>

        <Text style={styles.title}>
          {YAKQUEST_NAME}
        </Text>

        <Text style={styles.tagline}>
          {YAKQUEST_TAGLINE}
        </Text>

        <View style={styles.introduction}>
          {ABOUT_INTRODUCTION.map(
            (paragraph) => (
              <Text
                key={paragraph}
                style={styles.introductionText}
              >
                {paragraph}
              </Text>
            )
          )}
        </View>
      </View>

      <View style={styles.highlightCard}>
        <Text style={styles.highlightIcon}>
          🛶
        </Text>

        <View style={styles.highlightContent}>
          <Text style={styles.highlightTitle}>
            Plan carefully. Paddle responsibly.
          </Text>

          <Text style={styles.highlightText}>
            YakQuest provides planning
            information, but the final decision
            to launch always belongs to the
            paddler.
          </Text>
        </View>
      </View>

      {ABOUT_SECTIONS.map((section) => (
        <View
          key={section.id}
          style={styles.sectionCard}
        >
          <Text style={styles.sectionTitle}>
            {section.title}
          </Text>

          {section.paragraphs.map(
            (paragraph) => (
              <Text
                key={paragraph}
                style={styles.bodyText}
              >
                {paragraph}
              </Text>
            )
          )}
        </View>
      ))}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          Data Sources and Attributions
        </Text>

        {ABOUT_ATTRIBUTIONS.map(
          (attribution) => (
            <View
              key={attribution.name}
              style={styles.attributionCard}
            >
              <Text style={styles.attributionTitle}>
                {attribution.name}
              </Text>

              <Text style={styles.bodyText}>
                {attribution.description}
              </Text>

              <Pressable
                onPress={() =>
                  openLink(attribution.url)
                }
                accessibilityRole="link"
              >
                <Text style={styles.linkText}>
                  {attribution.linkLabel}
                </Text>
              </Pressable>
            </View>
          )
        )}

        <Text style={styles.legalNote}>
          {ABOUT_LEGAL_NOTE}
        </Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          Contact YakQuest
        </Text>

        <Text style={styles.bodyText}>
          Questions, corrections, safety
          concerns, copyright concerns, and
          support requests may be sent to:
        </Text>

        <Pressable
          onPress={() =>
            openLink(
              `mailto:${YAKQUEST_CONTACT_EMAIL}`
            )
          }
          accessibilityRole="link"
        >
          <Text style={styles.contactEmail}>
            {YAKQUEST_CONTACT_EMAIL}
          </Text>
        </Pressable>

        <View style={styles.websiteRow}>
          <Text style={styles.bodyText}>
            Website:{" "}
          </Text>

          <Pressable
            onPress={() =>
              openLink(YAKQUEST_WEBSITE)
            }
            accessibilityRole="link"
          >
            <Text style={styles.linkText}>
              yakquest.com
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © {YAKQUEST_COPYRIGHT_YEAR}{" "}
          {YAKQUEST_NAME}. All rights reserved.
        </Text>

        <Text style={styles.footerText}>
          Built to help paddlers plan more
          confidently and enjoy waterways
          responsibly.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F7F8",
  },

  contentContainer: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 42,
  },

  hero: {
    paddingHorizontal: 4,
    marginBottom: 18,
  },

  eyebrow: {
    color: "#24746C",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 6,
  },

  title: {
    color: "#173B3A",
    fontSize: 36,
    fontWeight: "900",
    marginBottom: 2,
  },

  tagline: {
    color: "#24746C",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 18,
  },

  introduction: {
    gap: 12,
  },

  introductionText: {
    color: "#34484B",
    fontSize: 16,
    lineHeight: 24,
  },

  highlightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#DCEFEB",
    borderColor: "#A8D3CA",
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
  },

  highlightIcon: {
    fontSize: 30,
    marginRight: 14,
  },

  highlightContent: {
    flex: 1,
  },

  highlightTitle: {
    color: "#173B3A",
    fontSize: 19,
    fontWeight: "800",
    lineHeight: 25,
    marginBottom: 6,
  },

  highlightText: {
    color: "#34484B",
    fontSize: 15,
    lineHeight: 22,
  },

  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#DCE4E6",
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },

  sectionTitle: {
    color: "#173B3A",
    fontSize: 21,
    fontWeight: "800",
    marginBottom: 12,
  },

  bodyText: {
    color: "#43565A",
    fontSize: 15,
    lineHeight: 23,
    marginBottom: 11,
  },

  attributionCard: {
    backgroundColor: "#F4F7F8",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },

  attributionTitle: {
    color: "#173B3A",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },

  linkText: {
    color: "#176F92",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
    textDecorationLine: "underline",
  },

  legalNote: {
    color: "#5B696C",
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 20,
    marginTop: 4,
  },

  contactEmail: {
    color: "#176F92",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 14,
    textDecorationLine: "underline",
  },

  websiteRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "baseline",
  },

  footer: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 8,
  },

  footerText: {
    color: "#69777A",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: 7,
  },
});