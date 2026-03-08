import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

const CIRCLE = 46;
// Ensure this matches your flow
const STEPS = ["Category", "Skills", "Details", "Budget"];

const stepRoutes = {
  1: "/smart-match/match",
  2: "/smart-match/step2",
  3: "/smart-match/step3",
  4: "/smart-match/step4",
  5: "/smart-match/loading",
} as const;

type StepNumber = keyof typeof stepRoutes;

export default function SmartMatchProgressHeader({
  currentStep = 1,
  maxStep: _maxStep = 1, // You can pass this to track "furthest unlocked", but we use currentStep for visuals mainly
}: {
  currentStep: StepNumber;
  maxStep: StepNumber;
}) {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  const navigateToStep = (step: StepNumber) => {
    // Prevent jumping to future steps beyond current (or beyond maxStep if you use that logic)
    if (step > currentStep) return;
    router.push(stepRoutes[step]);
  };

  return (
    <View style={[styles.header, { backgroundColor: theme.card }]}>
      <View style={styles.headerAI}>
        <Ionicons name="sparkles-outline" size={26} color={theme.tint} />
        <Text style={[styles.title, { color: theme.text }]}>AI Smart Match</Text>
      </View>

      <View style={styles.progressWrapper}>
        <View style={styles.progressRow}>
          {STEPS.map((label, index) => {
            const stepNumber = (index + 1) as StepNumber;

            const isActive = currentStep === stepNumber;
            // FIX: Only show checkmark if we are completely PAST this step
            const isFinished = stepNumber < currentStep;

            // Logic for styling the circle background
            const circleColor = isActive || isFinished
              ? theme.tint
              : isDark ? "#333" : "#e5e7eb";

            return (
              <Pressable
                key={index}
                onPress={() => navigateToStep(stepNumber)}
                // Disable clicking on future steps
                disabled={stepNumber > currentStep}
                style={{ opacity: stepNumber > currentStep ? 0.5 : 1 }}
              >
                <View style={styles.stepContainer}>
                  <View
                    style={[
                      styles.stepCircle,
                      { backgroundColor: circleColor },
                    ]}
                  >
                    {isFinished ? (
                      // Only show checkmark if finished (step < current)
                      <Ionicons name="checkmark" size={22} color="#fff" />
                    ) : (
                      // Otherwise show the number (Active or Future)
                      <Text
                        style={[
                          styles.stepText,
                          { color: isActive || isFinished ? "#fff" : theme.textSecondary },
                        ]}
                      >
                        {stepNumber}
                      </Text>
                    )}
                  </View>

                  <Text
                    style={[
                      styles.stepLabel,
                      {
                        color: isActive || isFinished
                          ? theme.text
                          : theme.textSecondary,
                        fontWeight: isActive ? "700" : "400",
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerAI: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  progressWrapper: {
    paddingHorizontal: 24,
    marginTop: 6,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  stepContainer: {
    alignItems: "center",
    width: 70,
  },
  stepCircle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  stepText: {
    fontSize: 18,
    fontWeight: "800",
  },
  stepLabel: {
    marginTop: 6,
    fontSize: 13,
    textAlign: "center",
  },
});