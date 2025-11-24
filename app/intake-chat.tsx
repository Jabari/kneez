import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { SymptomEntities } from '../shared/types';
import { parseSymptomMessage } from '../src/api/nlu';
import { getNextIntakeQuestion } from '../src/logic/getNextIntakeQuestion';

const EMPTY_ENTITIES: SymptomEntities = {
  symptom_side: 'unsure',
  symptom_description: [],
  symptom_location: '',
  trigger_activity: [],
  missing_fields: [
    'symptom_side',
    'symptom_description',
    'symptom_location',
    'trigger_activity',
  ],
};

type Message = {
  id: string;
  role: 'bot' | 'user';
  text: string;
};

export default function IntakeChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'intro',
      role: 'bot',
      text: 'Hi! Tell me what is going on with your knee. Mention where it hurts, what it feels like, and what makes it flare up.',
    },
  ]);
  const [entities, setEntities] = useState<SymptomEntities>(EMPTY_ENTITIES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entitySummary = useMemo(() => {
    return [
      `Side: ${entities.symptom_side}`,
      `Location: ${entities.symptom_location || '—'}`,
      `Description: ${entities.symptom_description.join(', ') || '—'}`,
      `Triggers: ${entities.trigger_activity.join(', ') || '—'}`,
    ].join('\n');
  }, [entities]);

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    setInput('');
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const nextEntities = await parseSymptomMessage(trimmed, entities);
      setEntities(nextEntities);
      const followUp = getNextIntakeQuestion(nextEntities);
      const botMessage: Message = followUp
        ? {
            id: `bot-${Date.now()}`,
            role: 'bot',
            text: followUp,
          }
        : {
            id: `bot-${Date.now()}`,
            role: 'bot',
            text: 'Thanks! I have what I need to move on to the next steps.',
          };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      const fallback: Message = {
        id: `bot-error-${Date.now()}`,
        role: 'bot',
        text: 'Sorry, I had trouble reading that. Can you try again?',
      };
      setMessages((prev) => [...prev, fallback]);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [entities, input, isLoading]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <View style={styles.chatContainer}>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.message,
                item.role === 'user' ? styles.userMessage : styles.botMessage,
              ]}
            >
              <Text style={styles.messageAuthor}>{item.role === 'user' ? 'You' : 'Kneez'}</Text>
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={styles.messagesContent}
        />
        <View style={styles.entitiesPanel}>
          <Text style={styles.panelTitle}>What we know so far</Text>
          <Text style={styles.entityText}>{entitySummary}</Text>
          {entities.missing_fields.length > 0 && (
            <Text style={styles.missingText}>
              Still need: {entities.missing_fields.join(', ')}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Describe your knee symptoms..."
          value={input}
          onChangeText={setInput}
          editable={!isLoading}
          multiline
        />
        <Pressable
          accessibilityRole="button"
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Send</Text>}
        </Pressable>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingBottom: 24,
    gap: 12,
  },
  message: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  userMessage: {
    backgroundColor: '#1d4ed8',
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  botMessage: {
    backgroundColor: '#1e293b',
    alignSelf: 'flex-start',
    maxWidth: '90%',
  },
  messageAuthor: {
    fontSize: 12,
    color: '#a5b4fc',
    marginBottom: 4,
  },
  messageText: {
    color: '#f8fafc',
    fontSize: 16,
  },
  entitiesPanel: {
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  panelTitle: {
    color: '#cbd5f5',
    fontWeight: '600',
    marginBottom: 8,
  },
  entityText: {
    color: '#e2e8f0',
    lineHeight: 20,
  },
  missingText: {
    marginTop: 8,
    color: '#fcd34d',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 140,
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sendButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#f87171',
    marginTop: 8,
    textAlign: 'center',
  },
});
