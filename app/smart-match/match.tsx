import SmartMatchProgressHeader from "@/components/SmartMatchProgressHeader";
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { analyzeProjectDescription } from '@/frontend/matching';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Shadows } from '@/constants/theme';
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const MAIN_CATEGORIES = [
  { id: 'cat1', label: 'Design & Creative', description: 'Logos, UI/UX, Art', icon: 'color-palette-outline', color: '#8b5cf6' },
  { id: 'cat2', label: 'Development & IT', description: 'Web, Mobile, AI', icon: 'code-slash-outline', color: '#3b82f6' },
  { id: 'cat3', label: 'Writing & Translation', description: 'Blogs, Copy, Books', icon: 'document-text-outline', color: '#f97316' },
  { id: 'cat4', label: 'Digital Marketing', description: 'SEO, Social Media', icon: 'trending-up-outline', color: '#10b981' },
  { id: 'cat5', label: 'Video & Animation', description: 'Editing, Motion', icon: 'videocam-outline', color: '#ef4444' },
  { id: 'cat6', label: 'Music & Audio', description: 'Voice over, Mixing', icon: 'musical-notes-outline', color: '#f59e0b' },
];

export default function SmartMatchScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'smart' | 'guided'>('smart'); // Default to AI mode
  const [projectDescription, setProjectDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showInvalidProjectModal, setShowInvalidProjectModal] = useState(false);

  // Guided mode state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const stylesDynamic = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    textSecondary: { color: theme.textSecondary },
    card: {
      backgroundColor: theme.card,
      borderColor: theme.cardBorder,
      borderWidth: 1,
    },
  };

  // AI Analysis Function
  const analyzeProject = async () => {
    if (projectDescription.length < 20) return;

    setIsAnalyzing(true);
    try {
      const analysis = analyzeProjectDescription(projectDescription);

      // Check if project is valid
      if (analysis.isValid === false) {
        setShowInvalidProjectModal(true);
        setIsAnalyzing(false);
        return;
      }

      // Navigate to loading screen with AI-extracted data
      router.push({
        pathname: '/smart-match/loading',
        params: {
          category: analysis.category,
          skills: JSON.stringify(analysis.skills),
          description: analysis.description || projectDescription,
          budget: analysis.budget,
          timeline: analysis.timeline
        }
      });

    } catch (error) {
      console.error('AI Analysis error:', error);
      // Fallback: proceed with raw description
      router.push({
        pathname: '/smart-match/loading',
        params: {
          category: 'General',
          skills: JSON.stringify([]),
          description: projectDescription,
          budget: 'Open',
          timeline: 'Flexible'
        }
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleContinueGuided = () => {
    if (!selectedLabel) return;
    router.push({
      pathname: '/smart-match/step2',
      params: { category: selectedLabel }
    });
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace('/(tabs)');
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [router])
  );

  return (
    <View style={[styles.container, stylesDynamic.container]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* HEADER */}
      <View style={[styles.headerContainer, { backgroundColor: theme.card }]}>
        <SmartMatchProgressHeader currentStep={1} maxStep={mode === 'smart' ? 1 : 3} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        bounces={false}
        overScrollMode="never"
      >
        <View style={styles.content}>
          {/* Mode Toggle */}
          <View style={styles.modeToggle}>
            <Pressable
              style={[
                styles.modeButton,
                mode === 'smart' && { backgroundColor: theme.tint },
                mode !== 'smart' && { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }
              ]}
              onPress={() => setMode('smart')}
            >
              <Ionicons name="sparkles" size={20} color={mode === 'smart' ? '#fff' : theme.text} />
              <Text style={[styles.modeText, { color: mode === 'smart' ? '#fff' : theme.text }]}>
                AI Smart Match
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.modeButton,
                mode === 'guided' && { backgroundColor: theme.tint },
                mode !== 'guided' && { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }
              ]}
              onPress={() => setMode('guided')}
            >
              <Ionicons name="list" size={20} color={mode === 'guided' ? '#fff' : theme.text} />
              <Text style={[styles.modeText, { color: mode === 'guided' ? '#fff' : theme.text }]}>
                Guided Match
              </Text>
            </Pressable>
          </View>

          {mode === 'smart' ? (
            // AI SMART MODE
            <>
              <Text style={[styles.question, stylesDynamic.text]}>
                Describe what you need
              </Text>
              <Text style={[styles.description, stylesDynamic.textSecondary]}>
                Tell us about your project in your own words. Our AI will analyze it and find the perfect creators.
              </Text>

              <View style={[styles.textAreaContainer, stylesDynamic.card]}>
                <TextInput
                  style={[styles.textArea, { color: theme.text }]}
                  placeholder="Example: I need a modern e-commerce website for my clothing brand. Looking for someone with Shopify experience who can create a clean design with product filters, shopping cart, and payment integration. Budget around ₱20,000-₱30,000, needed in 2-3 weeks."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  value={projectDescription}
                  onChangeText={setProjectDescription}
                  editable={!isAnalyzing}
                />
                <View style={styles.charCount}>
                  <Ionicons name="information-circle-outline" size={14} color={theme.textSecondary} />
                  <Text style={[styles.charCountText, stylesDynamic.textSecondary]}>
                    {projectDescription.length < 20
                      ? `${20 - projectDescription.length} more characters needed`
                      : 'Ready to analyze'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                disabled={projectDescription.length < 20 || isAnalyzing}
                style={[
                  styles.continueButton,
                  {
                    backgroundColor: projectDescription.length >= 20 ? theme.tint : theme.cardBorder,
                    opacity: projectDescription.length >= 20 && !isAnalyzing ? 1 : 0.7,
                  },
                ]}
                onPress={analyzeProject}
              >
                {isAnalyzing ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                    <Text style={styles.continueText}>AI Analyzing...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="sparkles" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.continueText}>Find Matches with AI</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.aiFeatures}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.tint} />
                  <Text style={[styles.featureText, stylesDynamic.textSecondary]}>
                    AI extracts category & skills automatically
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.tint} />
                  <Text style={[styles.featureText, stylesDynamic.textSecondary]}>
                    Smart budget & timeline estimation
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.tint} />
                  <Text style={[styles.featureText, stylesDynamic.textSecondary]}>
                    Personalized creator recommendations
                  </Text>
                </View>
              </View>
            </>
          ) : (
            // GUIDED MODE
            <>
              <Text style={[styles.question, stylesDynamic.text]}>
                {t("matchQuestion")}
              </Text>
              <Text style={[styles.description, stylesDynamic.textSecondary]}>
                {t("matchDesc")}
              </Text>

              <View style={styles.grid}>
                {MAIN_CATEGORIES.map((cat) => {
                  const isActive = selectedId === cat.id;
                  const activeColor = cat.color || theme.tint;

                  return (
                    <Pressable
                      key={cat.id}
                      style={[
                        styles.card,
                        stylesDynamic.card,
                        isActive && {
                          backgroundColor: activeColor,
                          borderColor: activeColor,
                          transform: [{ scale: 1.02 }],
                          shadowColor: activeColor,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 6
                        },
                      ]}
                      onPress={() => {
                        setSelectedId(cat.id);
                        setSelectedLabel(cat.label);
                        setSelectedColor(cat.color);
                      }}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={32}
                        color={isActive ? "#fff" : activeColor}
                        style={{ marginBottom: 8 }}
                      />
                      <Text
                        style={[
                          styles.cardLabel,
                          { color: isActive ? "#fff" : theme.text },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <TouchableOpacity
                disabled={!selectedId}
                style={[
                  styles.continueButton,
                  {
                    backgroundColor: selectedId ? (selectedColor || theme.tint) : theme.cardBorder,
                    opacity: selectedId ? 1 : 0.7,
                  },
                ]}
                onPress={handleContinueGuided}
              >
                <Text style={[
                  styles.continueText,
                  !selectedId && { color: theme.textSecondary }
                ]}>
                  Continue
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Invalid Project Modal */}
        <Modal visible={showInvalidProjectModal} transparent animationType="fade" onRequestClose={() => setShowInvalidProjectModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.card }]}>
              <View style={[styles.modalIconContainer, { backgroundColor: '#ef444420' }]}>
                <Ionicons name="alert-circle" size={48} color="#ef4444" />
              </View>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Invalid Project Description</Text>
              <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
                Please describe a real project with clear deliverables. Test posts, demos, or vague descriptions cannot be matched with creators.
              </Text>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.tint }]}
                onPress={() => setShowInvalidProjectModal(false)}
              >
                <Text style={styles.modalButtonText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  content: { paddingBottom: 40 },

  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 10,
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  modeText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // AI Smart Mode
  textAreaContainer: {
    marginHorizontal: 24,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    ...Shadows.md,
  },
  textArea: {
    height: 240,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: "top",
  },
  charCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  charCountText: {
    fontSize: 12,
    fontWeight: '500',
  },
  aiFeatures: {
    marginHorizontal: 24,
    marginTop: 20,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },

  // Guided Mode
  question: {
    paddingHorizontal: 24,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 24,
  },
  description: {
    paddingHorizontal: 24,
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.8
  },
  grid: {
    paddingHorizontal: 24,
    marginTop: 32,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    height: 130,
    borderRadius: 16,
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    ...Shadows.md,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: 'center',
    marginTop: 8
  },
  continueButton: {
    marginTop: 30,
    paddingVertical: 16,
    borderRadius: 16,
    marginHorizontal: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  continueText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  // Invalid Project Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    ...Shadows.xl,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  modalButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

