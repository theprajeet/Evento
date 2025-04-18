import React from "react";
import { Text, StyleSheet, Pressable } from "react-native";

type CustomButtonProps = {
  onPress: () => void;
  text: string;
  type?: "PRIMARY" | "SECONDARY" | "TERTIARY";
  bgColor?: string;
  fgColor?: string;
  disabled?: boolean; // Added disabled property
};

const CustomButton = ({
  onPress,
  text,
  type = "PRIMARY",
  bgColor,
  fgColor,
  disabled = false, // Default to false
}: CustomButtonProps) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled} // Handle the disabled state
      style={[
        styles.container,
        styles[`container_${type}`],
        bgColor ? { backgroundColor: bgColor } : {},
        disabled && styles.container_DISABLED, // Apply disabled styles
      ]}
    >
      <Text
        style={[
          styles.text,
          styles[`text_${type}`],
          fgColor ? { color: fgColor } : {},
          disabled && styles.text_DISABLED, // Apply disabled text styles
        ]}
      >
        {text}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "90%",
    padding: 15,
    marginVertical: 5,
    alignItems: "center",
    borderRadius: 13,
  },

  container_PRIMARY: {
    backgroundColor: "#3B71F3",
  },

  container_SECONDARY: {
    borderColor: "#3B71F3",
    borderWidth: 2,
  },

  container_TERTIARY: {},

  container_DISABLED: {
    backgroundColor: "#cccccc", // Gray background for disabled state
    borderColor: "#aaaaaa", // Optional: border color for disabled state
  },

  text: {
    fontWeight: "bold",
    color: "white",
  },

  text_PRIMARY: {},

  text_SECONDARY: {
    color: "#3B71F3",
  },

  text_TERTIARY: {
    color: "gray",
  },

  text_DISABLED: {
    color: "#888888", // Gray text color for disabled state
  },
});

export default CustomButton;
