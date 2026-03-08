import SmartMatchProgressHeader from "@/components/SmartMatchProgressHeader";
import { useTheme } from "@/context/ThemeContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Shadows } from '@/constants/theme';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

const BUDGET_OPTIONS = [
  "Under ₱500",
  "₱500 - ₱1,000",
  "₱1,000 - ₱5,000",
  "₱5,000 - ₱10,000",
  "₱10,000+",
];

const TIMELINE_OPTIONS = [
  "Less than 1 week",
  "1-2 weeks",
  "2-4 weeks",
  "1-3 months",
];

export default function SmartMatchBudget() {
  const router = useRouter();
  const { category, skills, description } = useLocalSearchParams();
  const [selectedBudget, setSelectedBudget] = useState<string | null>(null);
  const [selectedTimeline, setSelectedTimeline] = useState<string | null>(null);
  const { theme, isDark } = useTheme();

  const themeStyles = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    card: {
      backgroundColor: isDark ? "#111" : "#fff",
      borderColor: theme.cardBorder,
      borderWidth: 1,
    },
    tagInactive: {
      backgroundColor: isDark ? "#111" : "#f1f5f9",
    },
  };

  const handleContinue = () => {
    if (selectedBudget && selectedTimeline) {
      router.push({
        pathname: "/smart-match/loading",
        params: {
          category,
          skills,
          description,
          budget: selectedBudget,
          timeline: selectedTimeline
        }
      });
    }
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View style={[styles.headerContainer, { backgroundColor: theme.card }]}>
        <SmartMatchProgressHeader currentStep={4} maxStep={4} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        bounces={false}
        overScrollMode="never"
      >
        {/* Title */}
        <Text style={[styles.question, themeStyles.text]}>Budget & Timeline</Text>
        <Text style={[styles.description, themeStyles.textSecondary]}>
          Help us find creators within your range
        </Text>

        {/* Project Budget Section */}
        <Text style={[styles.sectionTitle, themeStyles.text]}>Project Budget</Text>
        <View style={styles.optionsContainer}>
          {BUDGET_OPTIONS.map((option) => {
            const isActive = selectedBudget === option;
            return (
              <Pressable
                key={option}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: isActive ? theme.tint : theme.card,
                    borderColor: isActive ? theme.tint : theme.cardBorder,
                  },
                ]}
                onPress={() => setSelectedBudget(option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: isActive ? "#fff" : theme.text },
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Project Timeline Section */}
        <Text style={[styles.sectionTitle, themeStyles.text]}>
          Project Timeline
        </Text>
        <View style={styles.optionsContainer}>
          {TIMELINE_OPTIONS.map((option) => {
            const isActive = selectedTimeline === option;
            return (
              <Pressable
                key={option}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor: isActive ? theme.tint : theme.card,
                    borderColor: isActive ? theme.tint : theme.cardBorder,
                  },
                ]}
                onPress={() => setSelectedTimeline(option)}
              >
                <Text
                  style={[
                    styles.optionText,
                    { color: isActive ? "#fff" : theme.text },
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Continue Button */}
        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: theme.tint,
              opacity: selectedBudget && selectedTimeline ? 1 : 0.4,
            },
          ]}
          disabled={!selectedBudget || !selectedTimeline}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    zIndex: 10,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...Shadows.xl,
  },
  question: {
    paddingHorizontal: 24,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 24,
  },
  description: {
    paddingHorizontal: 24,
    marginTop: 4,
    fontSize: 14,
  },
  sectionTitle: {
    paddingHorizontal: 24,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 20,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 24,
    marginTop: 12,
    gap: 10,
  },
  optionButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
    ...Shadows.md,
  },
  optionText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  button: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginHorizontal: 24,
    alignItems: "center",
    ...Shadows.lg,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});