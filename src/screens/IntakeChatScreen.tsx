import React, { useState } from 'react';
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

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import type { SymptomEntities, UserIntent } from '../shared/types';
import { classifyIntent } from '../api/router';
import { parseSymptomMessage } from '../api/nlu';
import { EMPTY_ENTITIES } from '../logic/emptyEntities';
import { getNextIntakeQuestion } from '../logic/getNextIntakeQuestion';


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

  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

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
      } else {
        setHasCompletedIntake(true);
        const summaryText = buildEntitiesSummary(newEntities);
        const botMsg: ChatMessage = {
          id: `b-${Date.now()}`,
          from: 'bot',
          text: `Got it, thanks. Here's what I understand about your knee so far:\n\n${summaryText}\n\nNext, I’ll guide you through some simple movement checks to refine this further.`,
        };
        addMessage(botMsg);
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
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  };

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

      <View style={styles.footer}>
        <TextInput
          style={styles.input}
          placeholder={
            hasCompletedIntake
              ? 'You can add more details if you want...'
              : 'Type your message...'
          }
          value={input}
          onChangeText={setInput}
          editable={!isLoading}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, isLoading && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={isLoading}
        >
          <Text style={styles.sendButtonText}>
            {isLoading ? '...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
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
  messageText: {
    color: '#F9FAFB',
    fontSize: 15,
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
