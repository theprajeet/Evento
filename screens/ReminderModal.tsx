import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity, Dimensions } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import { gql, useQuery } from "@apollo/client";
import * as Notifications from "expo-notifications";

// GraphQL query to fetch event name
const GetEventName = gql`
  query GetEventName($eventId: uuid!) {
    Event_by_pk(id: $eventId) {
      name
    }
  }
`;

const { width } = Dimensions.get("window");

export default function ReminderModal({ route }: { route: { params: { eventId: string } } }) {
  const navigation = useNavigation();
  const { eventId } = route.params;

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [reminders, setReminders] = useState<{ date: Date; time: Date }[]>([]);
  const [eventName, setEventName] = useState("");
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [isTimePickerVisible, setTimePickerVisible] = useState(false);

  // Fetch event name from GraphQL
  const { data, loading, error } = useQuery(GetEventName, {
    variables: { eventId },
  });

  useEffect(() => {
    if (data?.Event_by_pk?.name) {
      setEventName(data.Event_by_pk.name);
    }
  }, [data]);

  const onDateChange = (date: Date) => {
    setSelectedDate(date);
    setDatePickerVisible(false);
  };

  const onTimeChange = (time: Date) => {
    setSelectedTime(time);
    setTimePickerVisible(false);
  };

  const addReminder = () => {
    setReminders([...reminders, { date: selectedDate, time: selectedTime }]);
    Alert.alert("Reminder Added", `Reminder set for ${selectedDate.toLocaleString()} at ${selectedTime.toLocaleTimeString()}`);
  };

  const setNotification = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== "granted") {
        Alert.alert("Permission Denied", "Notification permissions are required to set reminders.");
        return;
      }
    }

    // Schedule notifications for all reminders
    reminders.forEach((reminder) => {
      scheduleNotification(reminder);
    });

    Alert.alert("Reminders Set", "You will be notified at the selected times.");
    navigation.goBack();
  };

  const scheduleNotification = async (reminder: { date: Date; time: Date }) => {
    // Combine date and time for notification trigger
    const trigger = new Date(reminder.date.setHours(reminder.time.getHours(), reminder.time.getMinutes(), 0, 0)).getTime() - Date.now();
    if (trigger > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Reminder for ${eventName}`,
          body: `Don't forget about your event: ${eventName}!`,
        },
        trigger: {
          seconds: trigger / 1000,
        },
      });
    } else {
      Alert.alert("Invalid Time", "Please select a future time.");
    }
  };

  useEffect(() => {
    const foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received in foreground:", notification);
    });

    return () => {
      foregroundSubscription.remove();
    };
  }, []);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  const CustomButton = ({ text, onPress }: { text: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{text}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set Reminder for Event</Text>

      <View style={styles.dateTimeBox}>
        <Text style={styles.dateTimeText}>Select Date</Text>
        <TouchableOpacity onPress={() => setDatePickerVisible(true)}>
          <View style={styles.pickerBox}>
            <Text>{selectedDate.toLocaleDateString()}</Text>
            <AntDesign name="down" size={20} color="black" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.dateTimeBox}>
        <Text style={styles.dateTimeText}>Select Time</Text>
        <TouchableOpacity onPress={() => setTimePickerVisible(true)}>
          <View style={styles.pickerBox}>
            <Text>{selectedTime.toLocaleTimeString()}</Text>
            <AntDesign name="down" size={20} color="black" />
          </View>
        </TouchableOpacity>
      </View>

      <CustomButton text="Add Reminder" onPress={addReminder} />
      <CustomButton text="Set Reminders" onPress={setNotification} />

      <Text style={styles.remindersTitle}>Reminders:</Text>
      {reminders.map((reminder, index) => (
        <View key={index} style={styles.reminderCard}>
          <Text style={styles.reminderText}>
            {reminder.date.toLocaleDateString()} at {reminder.time.toLocaleTimeString()}
          </Text>
        </View>
      ))}

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        date={selectedDate}
        onConfirm={onDateChange}
        onCancel={() => setDatePickerVisible(false)}
      />

      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        date={selectedTime}
        onConfirm={onTimeChange}
        onCancel={() => setTimePickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  dateTimeBox: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 15,
    marginVertical: 10,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  dateTimeText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 10,
  },
  pickerBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  remindersTitle: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  reminderCard: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    marginVertical: 8,
    borderRadius: 8,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  reminderText: {
    fontSize: 16,
    color: "#333",
  },
  button: {
    width: width * 0.90,
    alignSelf: "center",
    marginVertical: 6,
    backgroundColor: "#3B71F3",
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
