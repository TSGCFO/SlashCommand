import React from 'react';
import {
  Modal,
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';
import { Colors, Spacing, BorderRadius, Typography } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';
import { Session } from '../utils/storage';
import { SummarizationService, ConversationInsights } from '../utils/summarization';
import { ExportService } from '../utils/export';

interface SummaryModalProps {
  visible: boolean;
  session: Session | null;
  onClose: () => void;
}

export function SummaryModal({ visible, session, onClose }: SummaryModalProps) {
  const theme = useTheme();
  const [insights, setInsights] = React.useState<ConversationInsights | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [flowAnalysis, setFlowAnalysis] = React.useState<any>(null);

  React.useEffect(() => {
    if (visible && session && session.messages.length > 0) {
      generateInsights();
    }
  }, [visible, session]);

  const generateInsights = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const [insightsData, flow] = await Promise.all([
        SummarizationService.extractInsights(session.messages),
        Promise.resolve(SummarizationService.analyzeConversationFlow(session.messages)),
      ]);
      
      setInsights(insightsData);
      setFlowAnalysis(flow);
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const shareSummary = async () => {
    if (!insights) return;

    let shareText = `📊 Conversation Insights\n\n`;
    shareText += `📝 Summary: ${insights.summary}\n\n`;
    shareText += `🎯 Key Points:\n${insights.keyPoints.map(p => `• ${p}`).join('\n')}\n\n`;
    
    if (insights.actionItems.length > 0) {
      shareText += `✅ Action Items:\n${insights.actionItems.map(a => `• ${a}`).join('\n')}\n\n`;
    }
    
    shareText += `📈 Stats: ${insights.wordCount} words, ${insights.questionCount} questions\n`;
    shareText += `💭 Sentiment: ${insights.sentiment}`;

    await ExportService.shareText(shareText, 'Share Conversation Insights');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      case 'mixed': return '🤔';
      default: return '😐';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '#4CAF50';
      case 'negative': return '#F44336';
      case 'mixed': return '#FF9800';
      default: return theme.textSecondary;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={styles.container}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <ThemedText style={styles.title}>Conversation Insights</ThemedText>
          <View style={styles.headerActions}>
            <Pressable onPress={shareSummary} style={styles.headerButton}>
              <Feather name="share" size={20} color={theme.text} />
            </Pressable>
            <Pressable onPress={onClose} style={styles.headerButton}>
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText style={styles.loadingText}>Analyzing conversation...</ThemedText>
          </View>
        ) : insights ? (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Summary Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="file-text" size={18} color={theme.primary} />
                <ThemedText style={styles.sectionTitle}>Summary</ThemedText>
              </View>
              <ThemedText style={styles.summaryText}>{insights.summary}</ThemedText>
            </View>

            {/* Key Points */}
            {insights.keyPoints.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Feather name="star" size={18} color={theme.primary} />
                  <ThemedText style={styles.sectionTitle}>Key Points</ThemedText>
                </View>
                {insights.keyPoints.map((point, index) => (
                  <View key={index} style={styles.listItem}>
                    <ThemedText style={styles.bullet}>•</ThemedText>
                    <ThemedText style={styles.listText}>{point}</ThemedText>
                  </View>
                ))}
              </View>
            )}

            {/* Action Items */}
            {insights.actionItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Feather name="check-square" size={18} color={theme.primary} />
                  <ThemedText style={styles.sectionTitle}>Action Items</ThemedText>
                </View>
                {insights.actionItems.map((item, index) => (
                  <View key={index} style={styles.listItem}>
                    <Feather name="square" size={14} color={theme.textSecondary} />
                    <ThemedText style={styles.listText}>{item}</ThemedText>
                  </View>
                ))}
              </View>
            )}

            {/* Topics */}
            {insights.topics.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Feather name="tag" size={18} color={theme.primary} />
                  <ThemedText style={styles.sectionTitle}>Topics Discussed</ThemedText>
                </View>
                <View style={styles.topicsContainer}>
                  {insights.topics.map((topic, index) => (
                    <View 
                      key={index} 
                      style={[styles.topicChip, { backgroundColor: theme.surfaceSecondary }]}
                    >
                      <ThemedText style={styles.topicText}>{topic}</ThemedText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Statistics */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Feather name="bar-chart-2" size={18} color={theme.primary} />
                <ThemedText style={styles.sectionTitle}>Statistics</ThemedText>
              </View>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: theme.surfaceSecondary }]}>
                  <ThemedText style={styles.statValue}>{insights.wordCount}</ThemedText>
                  <ThemedText style={styles.statLabel}>Words</ThemedText>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.surfaceSecondary }]}>
                  <ThemedText style={styles.statValue}>{insights.questionCount}</ThemedText>
                  <ThemedText style={styles.statLabel}>Questions</ThemedText>
                </View>
                <View style={[styles.statCard, { backgroundColor: theme.surfaceSecondary }]}>
                  <ThemedText style={[styles.statValue, { fontSize: 24 }]}>
                    {getSentimentIcon(insights.sentiment)}
                  </ThemedText>
                  <ThemedText style={[styles.statLabel, { color: getSentimentColor(insights.sentiment) }]}>
                    {insights.sentiment}
                  </ThemedText>
                </View>
              </View>
            </View>

            {/* Flow Analysis */}
            {flowAnalysis && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Feather name="activity" size={18} color={theme.primary} />
                  <ThemedText style={styles.sectionTitle}>Conversation Flow</ThemedText>
                </View>
                <View style={styles.flowGrid}>
                  <View style={styles.flowItem}>
                    <ThemedText style={styles.flowLabel}>Avg Question Length</ThemedText>
                    <ThemedText style={styles.flowValue}>
                      {Math.round(flowAnalysis.avgQuestionLength)} chars
                    </ThemedText>
                  </View>
                  <View style={styles.flowItem}>
                    <ThemedText style={styles.flowLabel}>Avg Response Length</ThemedText>
                    <ThemedText style={styles.flowValue}>
                      {Math.round(flowAnalysis.avgResponseLength)} chars
                    </ThemedText>
                  </View>
                  <View style={styles.flowItem}>
                    <ThemedText style={styles.flowLabel}>Topic Changes</ThemedText>
                    <ThemedText style={styles.flowValue}>{flowAnalysis.topicChanges}</ThemedText>
                  </View>
                  <View style={styles.flowItem}>
                    <ThemedText style={styles.flowLabel}>Depth</ThemedText>
                    <ThemedText style={styles.flowValue}>
                      {flowAnalysis.conversationDepth} exchanges
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <ThemedText>No conversation to analyze</ThemedText>
          </View>
        )}
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: Typography.title.fontSize,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    opacity: 0.7,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: Spacing['2xl'],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.subtitle.fontSize,
    fontWeight: '600',
  },
  summaryText: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.fontSize * 1.6,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  bullet: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
  },
  listText: {
    flex: 1,
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.fontSize * 1.5,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  topicChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  topicText: {
    fontSize: Typography.small.fontSize,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.title.fontSize,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.small.fontSize,
    opacity: 0.7,
  },
  flowGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  flowItem: {
    width: '48%',
  },
  flowLabel: {
    fontSize: Typography.small.fontSize,
    opacity: 0.7,
    marginBottom: Spacing.xs,
  },
  flowValue: {
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
  },
});