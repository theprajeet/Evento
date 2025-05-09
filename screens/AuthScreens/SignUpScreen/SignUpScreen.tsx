import React from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import CustomInput from "../components/CustomInput";
import CustomButton from "../components/CustomButton";
import SocialSignInButtons from "../components/SocialSignInButtons";
import { useNavigation } from "@react-navigation/core";
import { useForm } from "react-hook-form";
import { useSignUpEmailPassword } from "@nhost/react";

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

const SignUpScreen = () => {
  const { control, handleSubmit, watch } = useForm();
  const pwd = watch("password");
  const navigation = useNavigation();

  const { signUpEmailPassword, isLoading } = useSignUpEmailPassword();

  const onRegisterPressed = async (data) => {
    if (isLoading) {
      return;
    }

    const { name, email, password } = data;

    // List of avatar URLs
    const avatarUrls = [
      "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/6.png",
      "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/11.png",
      "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/10.png",
      "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/7.png",
      "https://notjustdev-dummy.s3.us-east-2.amazonaws.com/avatars/2.jpg",
    ];

    // Select a random avatar URL
    const randomAvatarUrl = avatarUrls[Math.floor(Math.random() * avatarUrls.length)];

    // Call signUpEmailPassword with the random avatar URL in metadata
    const { error, isSuccess, needsEmailVerification } = await signUpEmailPassword(email, password, {
      displayName: name.trim(),
      metadata: { name, avatar_url: randomAvatarUrl },
    });

    if (error) {
      Alert.alert("Oops", error.message);
      return;
    }

    if (needsEmailVerification) {
      Alert.alert("Verify your Email", "Check your email and follow the link.");
    }

    if (isSuccess) {
      navigation.navigate("SignIn");
    }
  };

  const onSignInPress = () => {
    navigation.navigate("SignIn");
  };

  const onTermsOfUsePressed = () => {
    console.warn("onTermsOfUsePressed");
  };

  const onPrivacyPressed = () => {
    console.warn("onPrivacyPressed");
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.root}>
        <Text style={styles.title}>Create an account</Text>

        <CustomInput
          name="name"
          control={control}
          placeholder="Name"
          rules={{
            required: "Name is required",
            minLength: {
              value: 3,
              message: "Name should be at least 3 characters long",
            },
            maxLength: {
              value: 24,
              message: "Name should be max 24 characters long",
            },
          }}
        />

        <CustomInput
          name="email"
          control={control}
          placeholder="Email"
          rules={{
            required: "Email is required",
            pattern: { value: EMAIL_REGEX, message: "Email is invalid" },
          }}
        />

        <CustomInput
          name="password"
          control={control}
          placeholder="Password"
          secureTextEntry
          rules={{
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password should be at least 8 characters long",
            },
          }}
        />

        <CustomInput
          name="password-repeat"
          control={control}
          placeholder="Repeat Password"
          secureTextEntry
          rules={{
            validate: (value) => value === pwd || "Passwords do not match",
          }}
        />

        <CustomButton
          text={isLoading ? "Register..." : "Register"}
          onPress={handleSubmit(onRegisterPressed)}
        />

        <Text style={styles.text}>
          By registering, you confirm that you accept our{" "}
          <Text style={styles.link} onPress={onTermsOfUsePressed}>
            Terms of Use
          </Text>{" "}
          and{" "}
          <Text style={styles.link} onPress={onPrivacyPressed}>
            Privacy Policy
          </Text>
        </Text>

        <SocialSignInButtons />

        <CustomButton
          text="Have an account? Sign in"
          onPress={onSignInPress}
          type="TERTIARY"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#051C60",
    margin: 10,
  },
  text: {
    color: "gray",
    marginVertical: 10,
  },
  link: {
    color: "#FDB075",
  },
});

export default SignUpScreen;
