import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Markdown from 'react-native-markdown-display';

import type { ChatTurn, SymptomEntities, UserIntent } from '../shared/types';
import type { AssessmentNodePayload } from '../shared/assessment';
import { classifyIntent } from '../api/router';
import { parseSymptomMessage } from '../api/nlu';
import { EMPTY_ENTITIES } from '../logic/emptyEntities';
import { getNextIntakeQuestion } from '../logic/getNextIntakeQuestion';
import { requestEducationalReply } from '../api/education';
import { checkAssessmentHealth, sendAssessmentAnswer, startAssessmentSession } from '../api/assessment';
import { useAssessment } from '../contexts/AssessmentContext';
import { isAcuteReliefReady } from '../logic/intentGuards';


type ChatMessage = {
  id: string;
  from: 'user' | 'bot';
  text: string;
};

export default function IntakeChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      from: 'bot',
      text: `Hi, I’m Neez. Tell me about your knee pain and I’ll help!
Note: Say something like "my left knee hurt when I squat" to see how I can help.`,
    },
  ]);

  const [input, setInput] = useState('');
  const [entities, setEntities] = useState<SymptomEntities>(EMPTY_ENTITIES);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCompletedIntake, setHasCompletedIntake] = useState(false);
  const [intent, setIntent] = useState<UserIntent | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    isServerHealthy,
    setServerHealthy,
    sessionId,
    currentNode,
    setSession,
    setCurrentNode,
  } = useAssessment();

  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await checkAssessmentHealth();
      setServerHealthy(healthy);
      setServerError(healthy ? null : 'Assessment server is down. Please try again later.');
    };

    checkHealth();
  }, [setServerHealthy]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    if (serverError) return;

    if (sessionId && currentNode) {
      setIsLoading(true);
      try {
        addMessage({
          id: `u-${Date.now()}`,
          from: 'user',
          text: trimmed,
        });
        setInput('');

        const response = await sendAssessmentAnswer(sessionId, {
          node_id: currentNode.id,
          value: trimmed,
        });

        if (response.next_node) {
          setCurrentNode(response.next_node);
          addMessage({
            id: `b-${Date.now()}`,
            from: 'bot',
            text: formatAssessmentNode(response.next_node),
          });
        } else if (response.completed) {
          setCurrentNode(null);
          addMessage({
            id: `b-${Date.now()}`,
            from: 'bot',
            text: 'Assessment complete. Thanks for sharing your details!',
          });
        }
      } catch (error) {
        console.error('Failed to progress assessment', error);
        setServerError('Unable to continue assessment. Please try again later.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      from: 'user',
      text: trimmed,
    };
    addMessage(userMsg);
    setInput('');

    setIsLoading(true);
    try {
      let resolvedIntent = intent;

      if (!resolvedIntent) {
        const classification = await classifyIntent(trimmed);
        resolvedIntent = classification.intent;
        setIntent(resolvedIntent);
        console.log('Intent classification', classification.intent);
      }

      if (resolvedIntent === 'out_of_scope') {
        addMessage({
          id: `b-${Date.now()}`,
          from: 'bot',
          text: "I'm focused on knee concerns. Can you share what's going on with your knees?",
        });
        return;
      }

      if (resolvedIntent === 'red_flag') {
        addMessage({
          id: `b-${Date.now()}`,
          from: 'bot',
          text: 'Your description could be a red flag. Please seek in-person medical care or urgent evaluation to stay safe.',
        });
        return;
      }

      if (resolvedIntent === 'general_education') {
        const botReply = await requestEducationalReply(
          trimmed,
          mapChatHistory([...messages, userMsg])
        );

        addMessage({
          id: `b-${Date.now()}`,
          from: 'bot',
          text: botReply,
        });
        return;
      }

      if (resolvedIntent !== 'acute_relief') {
        addMessage({
          id: `b-${Date.now()}`,
          from: 'bot',
          text: 'I can guide quick assessments for current knee pain flare-ups. If you need general education or another type of help, let me know and I can keep it informational.',
        });
        return;
      }

      const newEntities = await parseSymptomMessage(trimmed, entities);
      setEntities(newEntities);

      const followUp = getNextIntakeQuestion(newEntities);

      if (followUp) {
        const botMsg: ChatMessage = {
          id: `b-${Date.now()}`,
          from: 'bot',
          text: followUp,
        };
        addMessage(botMsg);
      } else if (isAcuteReliefReady(resolvedIntent, newEntities)) {
        setHasCompletedIntake(true);
        const summaryText = buildEntitiesSummary(newEntities);
        const botMsg: ChatMessage = {
          id: `b-${Date.now()}`,
          from: 'bot',
          text: `Got it, thanks. Here's what I understand about your knee so far:\n\n${summaryText}\n\nNext, I’ll guide you through some simple movement checks to refine this further.`,
        };
        addMessage(botMsg);

        if (isServerHealthy === false) {
          setServerError('Assessment server is down. Please try again later.');
          return;
        }

        try {
          const session = await startAssessmentSession();
          setSession(session.session_id, session.node);
          setCurrentNode(session.node);
          addMessage({
            id: `b-${Date.now()}`,
            from: 'bot',
            text: formatAssessmentNode(session.node),
          });
        } catch (error) {
          console.error('Failed to start assessment session', error);
          setServerError('Unable to start assessment. Please try again later.');
        }
      }
    } catch (err: any) {
      console.error('Error during NLU:', err);
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        from: 'bot',
        text: 'Sorry, I had trouble understanding that. Can you try rephrasing your last message?',
      };
      addMessage(botMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.from === 'user';
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Markdown style={isUser ? markdownStylesUser : markdownStylesBot}>
          {item.text}
        </Markdown>
      </View>
    );
  };

  const textInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      textInputRef.current?.focus();
    }, 100); // small delay avoids navigation timing issues

    return () => clearTimeout(timeout);
  }, []);


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={80}
    >
      <FlatList
        style={styles.messagesList}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.messagesContent}
      />

      {serverError ? (
        <Text style={styles.errorBanner}>{serverError}</Text>
      ) : null}

      <View style={styles.footer}>
        <TextInput
          ref={textInputRef}
          style={styles.input}
          placeholder={
            hasCompletedIntake
              ? 'You can add more details if you want...'
              : 'Type your message...'
          }
          value={input}
          onChangeText={setInput}
          editable={!isLoading && !serverError}
          multiline
          autoFocus
          returnKeyType="send"
          submitBehavior="submit"
          onSubmitEditing={handleSend}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'Enter' && !nativeEvent.shiftKey) {
              handleSend();
            }
          }}
        />
        <TouchableOpacity
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={isLoading || !!serverError}
        >
          <Text style={styles.sendButtonText}>
            {isLoading ? '...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function mapChatHistory(history: ChatMessage[]): ChatTurn[] {
  return history.map(({ from, text }) => ({ from, text }));
}

function buildEntitiesSummary(entities: SymptomEntities): string {
  const parts: string[] = [];

  if (entities.symptom_side && entities.symptom_side !== 'unsure') {
    parts.push(`• Side: ${entities.symptom_side} knee`);
  }

  if (entities.symptom_location) {
    parts.push(`• Location: ${entities.symptom_location}`);
  }

  if (entities.symptom_description.length > 0) {
    parts.push(`• How it feels: ${entities.symptom_description.join(', ')}`);
  }

  if (entities.trigger_activity.length > 0) {
    parts.push(`• Triggered by: ${entities.trigger_activity.join(', ')}`);
  }

  if (entities.missing_fields.length > 0) {
    parts.push(
      `• Still unclear: ${entities.missing_fields.join(', ')} (we can refine this later)`
    );
  }

  return parts.join('\n');
}

function formatAssessmentNode(node: AssessmentNodePayload): string {
  if (node.type === 'question') {
    return node.prompt ?? node.question ?? node.title ?? 'Next step';
  }

  if (node.type === 'movement_test') {
    return node.prompt ?? node.title ?? 'Next step';
  }

  if (node.type === 'assessment') {
    return [node.title, node.summary].filter(Boolean).join('\n\n');
  }

  return node.title ?? 'Next step';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05070b',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 80,
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 10,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#7F1D1D',
    color: '#FEE2E2',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#1F2937',
    backgroundColor: '#020617',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#0F172A',
    color: '#E5E7EB',
    fontSize: 15,
  },
  sendButton: {
    marginLeft: 8,
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#22C55E',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: '#022C22',
    fontWeight: '600',
  },
});

const markdownBase = {
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  bullet_list: {
    marginVertical: 0,
    paddingVertical: 0,
  },
  ordered_list: {
    marginVertical: 0,
    paddingVertical: 0,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
  },
};

const markdownStylesUser = StyleSheet.create({
  ...markdownBase,
  body: {
    ...markdownBase.body,
    color: '#F9FAFB',
  },
  text: {
    color: '#F9FAFB',
  },
  bullet_list_icon: {
    color: '#F9FAFB',
  },
  ordered_list_icon: {
    color: '#F9FAFB',
  },
});

const markdownStylesBot = StyleSheet.create({
  ...markdownBase,
  body: {
    ...markdownBase.body,
    color: '#E5E7EB',
  },
  text: {
    color: '#E5E7EB',
  },
  bullet_list_icon: {
    color: '#E5E7EB',
  },
  ordered_list_icon: {
    color: '#E5E7EB',
  },
});
