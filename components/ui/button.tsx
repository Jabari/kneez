import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';

export type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}

const VARIANT_STYLES: Record<ButtonVariant, ViewStyle> = {
  default: {
    backgroundColor: '#6C2EB7',
    borderColor: '#6C2EB7',
  },
  secondary: {
    backgroundColor: '#F3E8FF',
    borderColor: '#E2D2FB',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#6C2EB7',
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
};

const SIZE_STYLES: Record<ButtonSize, ViewStyle> = {
  sm: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  default: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  lg: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
  },
  icon: {
    padding: 12,
    borderRadius: 999,
  },
};

const TEXT_STYLES: Record<ButtonVariant, TextStyle> = {
  default: { color: '#fff' },
  secondary: { color: '#3B0764' },
  outline: { color: '#3B0764' },
  ghost: { color: '#3B0764' },
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});

export const Button = React.forwardRef<Pressable, ButtonProps>(
  (
    {
      title,
      children,
      variant = 'default',
      size = 'default',
      loading = false,
      textStyle,
      style,
      disabled,
      ...pressableProps
    },
    ref,
  ) => {
    const variantStyle = VARIANT_STYLES[variant];
    const sizeStyle = SIZE_STYLES[size];
    const textColorStyle = TEXT_STYLES[variant];

    return (
      <Pressable
        ref={ref}
        accessibilityRole="button"
        style={[styles.base, variantStyle, sizeStyle, style, disabled && { opacity: 0.7 }]}
        disabled={disabled || loading}
        {...pressableProps}
      >
        {loading && <ActivityIndicator size="small" color={textColorStyle.color} />}
        {title ? (
          <Text style={[styles.text, textColorStyle, textStyle]}>{title}</Text>
        ) : (
          children
        )}
      </Pressable>
    );
  },
);

Button.displayName = 'Button';
