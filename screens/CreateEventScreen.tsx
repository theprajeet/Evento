import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Alert, TouchableOpacity } from "react-native";
import { useMutation, gql, useLazyQuery } from "@apollo/client";
import { useNavigation } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import * as Animatable from 'react-native-animatable'; // Add animation import
import { useUserId } from '@nhost/react'; // Correctly import useUserId

// Create Event Mutation
const CREATE_EVENT = gql`
  mutation CreateEvent($name: String!, $description: String!, $date: timestamp!) {
    insert_Event_one(object: { name: $name, description: $description, date: $date }) {
      id
      name
      description
      date
    }
  }
`;

// Create User Event Mutation (for hosting event)
const CREATE_USER_EVENT = gql`
  mutation CreateUserEvent($userId: uuid!, $eventId: uuid!, $role: String!) {
    insert_user_events_one(object: { user_id: $userId, event_id: $eventId, role: $role }) {
      user_id
      event_id
      role
    }
  }
`;

// Get all events
const GET_EVENTS = gql`
  query GetEvent {
    Event {
      id
      name
      date
    }
  }
`;

// Check if the user is already associated with the event
const GET_USER_EVENT_ASSOCIATION = gql`
  query GetUserEventAssociation($userId: uuid!, $eventId: uuid!) {
    user_events(where: { user_id: { _eq: $userId }, event_id: { _eq: $eventId } }) {
      user_id
      event_id
    }
  }
`;

const CreateEventScreen: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [date, setDate] = useState<string>("");

  const navigation = useNavigation();
  
  const userId = useUserId(); // Get current user ID from Nhost
  
  // Check if user is authenticated
  if (!userId) {
    Alert.alert("Error", "You must be logged in to create an event.");
    return <View></View>;  // Optional: Display a loading or error screen
  }

  const [createEvent, { loading: eventLoading }] = useMutation(CREATE_EVENT, {
    update(cache, { data: { insert_Event_one } }) {
      const existingData = cache.readQuery({ query: GET_EVENTS });
  
      if (existingData && existingData.Event) {
        cache.writeQuery({
          query: GET_EVENTS,
          data: {
            Event: [...existingData.Event, insert_Event_one],
          },
        });
      } else {
        cache.writeQuery({
          query: GET_EVENTS,
          data: { Event: [insert_Event_one] },
        });
      }
    },
    onCompleted: (data) => {
      const eventId = data.insert_Event_one.id;
      if (userId) {
        // Directly create the user-event association with the "host" role
        createUserEvent({
          variables: { userId, eventId, role: "host" }, // Pass role as "host"
        }).then(() => {
          Alert.alert("Success", "Event hosted and you are now associated as the host!");
          navigation.navigate("Root"); // Navigate back to root after hosting
        }).catch((error) => {
          Alert.alert("Error", "Failed to associate user with event: " + error.message);
        });
      }
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });
  

  const [createUserEvent] = useMutation(CREATE_USER_EVENT, {
    onCompleted: () => {
      console.log("User has been associated with the event as host.");
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to associate user with event.");
    },
  });

  const [checkUserEventAssociation] = useLazyQuery(GET_USER_EVENT_ASSOCIATION, {
    onCompleted: (data) => {
      const existingAssociation = data.user_events.length > 0;
      if (!existingAssociation) {
        // If no existing association, create the user-event relationship
        const eventId = data.insert_Event_one.id;
        createUserEvent({
          variables: { userId, eventId, role: "host" }, // Pass role as "host"
        });
      } else {
        Alert.alert("Error", "You are already associated with this event.");
      }
    },
    onError: (error) => {
      Alert.alert("Error", "Failed to check user-event association.");
    },
  });

  // Date format validation for YYYY-MM-DD (ISO format)
  const isValidDate = (dateString: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dateString);
  };

  const onHost = () => {
    if (!name || !description || !date) {
      Alert.alert("Error", "Please fill in all the fields.");
      return;
    }

    // Validate if the date is in YYYY-MM-DD format (ISO format)
    if (!isValidDate(date)) {
      Alert.alert("Error", "Please enter a valid date in YYYY-MM-DD format.");
      return;
    }

    const formattedDate = new Date(date);

    if (isNaN(formattedDate.getTime())) {
      Alert.alert("Error", "Invalid date format.");
      return;
    }

    // Create the event
    createEvent({
      variables: { name, description, date: formattedDate.toISOString() },
    });
  };

  // Get today's date in YYYY-MM-DD format for minDate
  const today = new Date().toISOString().split("T")[0];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Event Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter event name"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Event Description</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter event description"
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>Select Event Date</Text>
      
      <Animatable.View animation="fadeIn" duration={500}>
        <Calendar
          style={styles.calendar}
          markedDates={{ [date]: { selected: true, selectedColor: "dodgerblue" } }}
          onDayPress={(day) => setDate(day.dateString)}  // Format is YYYY-MM-DD
          monthFormat={"yyyy MM"}
          minDate={today}  // Disable past dates
        />
      </Animatable.View>

      <TouchableOpacity style={styles.button} onPress={onHost}>
        <Text style={styles.buttonText}>{eventLoading ? "Hosting..." : "Host Event"}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20, // Move content up to the top
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 5,
    fontSize: 16,
    marginBottom: 20,
  },
  calendar: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#3B71F3",
    padding: 15,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default CreateEventScreen;
