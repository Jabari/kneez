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
import type { SymptomEntities } from '../src/shared/types';
import { parseSymptomMessage } from '../src/api/nlu';
import { getNextIntakeQuestion } from '../src/logic/getNextIntakeQuestion';
import IntakeChatScreen from '../src/screens/IntakeChatScreen';

export default IntakeChatScreen;
