import SmartMatchProgressHeader from "@/components/SmartMatchProgressHeader";
import { useTheme } from "@/context/ThemeContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Shadows } from '@/constants/theme';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

const SUBCATEGORY_MAP: Record<string, string[]> = {
  'Design & Creative': ['Logo Design', 'Brand Style Guides', 'Illustration', 'UI/UX Design', 'Portrait Drawing'],
  'Development & IT': ['Web Development', 'Mobile App Development', 'Game Development', 'Support & IT'],
  'Writing & Translation': ['Articles & Blog Posts', 'Translation', 'Creative Writing', 'Proofreading'],
  'Digital Marketing': ['Social Media Marketing', 'SEO', 'Content Marketing', 'Video Marketing'],
  'Video & Animation': ['Video Editing', 'Animation for Kids', '3D Product Animation', 'Visual Effects'],
  'Music & Audio': ['Voice Over', 'Mixing & Mastering', 'Producers & Composers', 'Singers & Vocalists'],
};

export default function SmartMatchSkills() {
  const router = useRouter();
  const { category } = useLocalSearchParams(); 
  const { theme, isDark } = useTheme();

  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Load the correct skills based on the Category chosen in Step 1
  useEffect(() => {
    const catString = Array.isArray(category) ? category[0] : category;
    if (catString && SUBCATEGORY_MAP[catString]) {
      setSkillsList(SUBCATEGORY_MAP[catString]);
    } else {
      setSkillsList(['General Services', 'Other']);
    }
  }, [category]);

  const themeStyles = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    card: {
      backgroundColor: isDark ? "#111" : "#fff",
      borderColor: theme.cardBorder,
      borderWidth: 1,
    },
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill)
        ? prev.filter((s) => s !== skill)
        : [...prev, skill]
    );
  };

  const handleContinue = () => {
    router.push({
      pathname: "/smart-match/step3",
      params: { 
        category,
        skills: JSON.stringify(selectedSkills) 
      }
    });
  };

  return (
    <View style={[styles.container, themeStyles.container]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER WITH CURVE & SHADOW */}
      <View style={[styles.headerContainer, { backgroundColor: theme.card }]}>
        <SmartMatchProgressHeader currentStep={2} maxStep={3} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        bounces={false}
        overScrollMode="never"
      >
        <Text style={[styles.question, themeStyles.text]}>
          Select required skills for {category}
        </Text>
        <Text style={[styles.description, themeStyles.textSecondary]}>
          Choose all skills relevant to your project
        </Text>

        <View style={styles.skillsContainer}>
          {skillsList.map((skill) => {
            const active = selectedSkills.includes(skill);
            return (
              <Pressable
                key={skill}
                onPress={() => toggleSkill(skill)}
                style={[
                  styles.skillTag,
                  {
                    backgroundColor: active ? theme.tint : theme.card,
                    borderColor: active ? theme.tint : theme.cardBorder,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.skillText,
                    { color: active ? "#fff" : theme.text },
                  ]}
                >
                  {skill}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: theme.tint,
              opacity: selectedSkills.length > 0 ? 1 : 0.4,
            },
          ]}
          disabled={selectedSkills.length === 0}
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
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 24,
    marginTop: 20,
    gap: 10,
    paddingBottom: 20,
  },
  skillTag: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    ...Shadows.md,
  },
  skillText: {
    fontSize: 14,
    fontWeight: "600",
  },
  button: {
    marginTop: 20,
    paddingVertical: 12, 
    borderRadius: 14,
    marginHorizontal: 24,
    ...Shadows.lg,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17, 
    fontWeight: "700",
    textAlign: "center",
  },
});