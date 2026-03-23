import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TouchableOpacity } from 'react-native';
import { theme } from '../theme/colors';
// Make sure to install: npm install lucide-react-native
import { Eye, EyeOff } from 'lucide-react-native';

export interface GlassInputProps extends TextInputProps {
  label: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({ label, secureTextEntry, ...props }) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Determine if we should actually hide the text
  // We only show the toggle if secureTextEntry was originally passed as true
  const shouldHideText = secureTextEntry && !isPasswordVisible;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholderTextColor={theme.textMuted}
          secureTextEntry={shouldHideText}
          {...props}
        />

        {/* Only show the eye button if it's a password field */}
        {secureTextEntry && (
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            activeOpacity={0.7}
          >
            {isPasswordVisible ? (
              <EyeOff size={20} color={theme.textMuted} />
            ) : (
              <Eye size={20} color={theme.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 15,
  },
  label: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: theme.glassBorder,
    borderRadius: 8,
  },
  input: {
    flex: 1, // Takes up remaining space
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: theme.textMain,
    fontSize: 16,
  },
  iconContainer: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});