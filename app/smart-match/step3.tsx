import SmartMatchProgressHeader from "@/components/SmartMatchProgressHeader";
import { useTheme } from "@/context/ThemeContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Shadows } from '@/constants/theme';
import {
  Pressable, ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';

export default function SmartMatchDetails() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  
  // Get data from previous steps
  const { category, skills } = useLocalSearchParams();

  const [details, setDetails] = useState("");

  const themeStyles = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    inputContainer: {
      backgroundColor: isDark ? "#111" : theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
    },
  };

  const isButtonEnabled = details.length > 3;

  const handleContinue = () => {
    router.push({
      pathname: "/smart-match/step4",
      params: {
        category,
        skills, 
        description: details
      }
    });
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View style={[styles.headerContainer, { backgroundColor: theme.card }]}>
        <SmartMatchProgressHeader currentStep={3} maxStep={3} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        bounces={false}
        overScrollMode="never"
      >
        {/* Title */}
        <Text style={[styles.question, themeStyles.text]}>
          Describe your project
        </Text>
        <Text style={[styles.description, themeStyles.textSecondary]}>
          The more details you provide, the better matches you'll get
        </Text>

        {/* Input Field */}
        <View style={[styles.textAreaContainer, themeStyles.inputContainer]}>
          <TextInput
            style={[styles.textArea, { color: theme.text }]}
            placeholder="Example: I need a modern e-commerce website for my clothing brand. The site should have a clean design, easy navigation, product filters, shopping cart, and payment integration. Looking for someone experienced with Shopify or custom React solutions."
            placeholderTextColor={theme.textSecondary}
            multiline
            value={details}
            onChangeText={setDetails}
          />
        </View>

        {/* Continue Button */}
        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: theme.tint,
              opacity: isButtonEnabled ? 1 : 0.4, 
            },
          ]}
          disabled={!isButtonEnabled}
          onPress={isButtonEnabled ? handleContinue : undefined}
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

  textAreaContainer: {
    marginTop: 20,
    borderRadius: 16,
    marginHorizontal: 24,
    padding: 12,
    ...Shadows.md,
  },
  textArea: {
    height: 300,
    fontSize: 14,
    textAlignVertical: "top",
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