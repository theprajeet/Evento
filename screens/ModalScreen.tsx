import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, Image, ActivityIndicator, Alert, Animated, View, Text } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import CustomButton from "../components/CustomButton";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useUserId } from "@nhost/react";
import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

interface RouteParams {
  id: string;
}

interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  EventAttendee: Array<{ user: { id: string; displayName: string; avatarUrl: string } }>;
}

const GetEventWithHost = gql`
  query GetEventWithHost($eventId: uuid!, $userId: uuid!) {
    Event_by_pk(id: $eventId) {
      id
      name
      description
      date
      EventAttendee {
        user {
          id
          displayName
          avatarUrl
        }
      }
    }
    user_events(where: { event_id: { _eq: $eventId }, role: { _eq: "host" } }) {
      user_id
      user {
        displayName
        avatarUrl
      }
    }
    EventAttendee(where: { eventId: { _eq: $eventId }, userId: { _eq: $userId } }) {
      id
    }
  }
`;

const JoinEvent = gql`
  mutation InsertEventAttendee($eventId: uuid!, $userId: uuid!) {
    insert_EventAttendee(objects: [{ eventId: $eventId, userId: $userId }]) {
      returning {
        id
        userId
        eventId
      }
    }
  }
`;

const LeaveEvent = gql`
  mutation DeleteEventAttendee($eventId: uuid!, $userId: uuid!) {
    delete_EventAttendee(where: { eventId: { _eq: $eventId }, userId: { _eq: $userId } }) {
      affected_rows
    }
  }
`;

export default function ModalScreen({ route }: { route: { params: RouteParams } }) {
  const eventId = route?.params?.id;
  const userId = useUserId();

  const { data, loading, error, refetch } = useQuery(GetEventWithHost, {
    variables: { eventId, userId },
    pollInterval: 2000,
  });

  const [doJoinEvent] = useMutation(JoinEvent);
  const [doLeaveEvent] = useMutation(LeaveEvent);

  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [isJoining, setIsJoining] = React.useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const navigation = useNavigation();

  const handleJoinClick = () => {
    const eventDate = new Date(event.date);
    const currentDate = new Date();
    const timeDifference = eventDate.getTime() - currentDate.getTime();
    const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

    // Show alert before displaying the RSVP ticket
    Alert.alert(
      "Important Notice",
      "Mind you that this event can't be canceled within 2 days of its start date.",
      [
        {
          text: "Proceed",
          onPress: () => {
            // Show the RSVP confirmation after alert is dismissed
            setShowConfirmation(true);
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }).start();
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const onConfirm = async () => {
    try {
      setIsJoining(true);
      await doJoinEvent({ variables: { userId, eventId } });
      Alert.alert("Success", "You have joined the event!");
      setShowConfirmation(false);
      await refetch();
    } catch (e) {
      Alert.alert("Error", "Could not join the event.");
    } finally {
      setIsJoining(false);
    }
  };

  const onCancelRSVP = async () => {
    const eventDate = new Date(event.date);
    const currentDate = new Date();
    const timeDifference = eventDate.getTime() - currentDate.getTime();
    const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

    if (daysDifference <= 2) {
      Alert.alert(
        "Cancellation Disabled",
        "You cannot cancel this event within 2 days of its start date."
      );
      return;
    }

    try {
      setIsJoining(true);
      await doLeaveEvent({ variables: { userId, eventId } });
      Alert.alert("Success", "You have canceled your registration.");
      await refetch();
    } catch (e) {
      Alert.alert("Error", "Could not cancel registration.");
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />;
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Error fetching event details</Text>
        <Text>{error.message}</Text>
      </View>
    );
  }

  const event = data?.Event_by_pk;
  const isHost = data?.user_events.some((host) => host.user_id === userId);

  const host = data?.user_events[0]?.user;
  const hasJoined = event?.EventAttendee.some((attendee) => attendee.user.id === userId);

  if (!event) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Event not found</Text>
      </View>
    );
  }

  const displayedUsers = (event?.EventAttendee || []).slice(0, 5).map((attendee) => attendee.user);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{event.name}</Text>
      <View style={styles.dateContainer}>
        <AntDesign name="calendar" size={24} color="black" />
        <Text style={styles.dateText}>{new Date(event.date).toDateString()}</Text>
      </View>
      <Text style={styles.description}>{event.description}</Text>

      {host && (
        <View style={styles.hostContainer}>
          <Image source={{ uri: host.avatarUrl }} style={styles.hostAvatar} />
          <Text style={styles.hostName}>Hosted by {host.displayName}</Text>
        </View>
      )}

      <View style={styles.users}>
        {displayedUsers.map((user, index) => (
          <Image
            key={user.id}
            source={{ uri: user.avatarUrl }}
            style={[
              styles.userAvatar,
              { transform: [{ translateX: -15 * index }] },
            ]}
          />
        ))}
        <View
          style={[
            styles.userAvatar,
            { transform: [{ translateX: -15 * displayedUsers.length }] },
          ]}
        >
          <Text>+{event?.EventAttendee?.length - displayedUsers.length}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        {isHost ? (
          <Text style={styles.hostMessage}>You are hosting this event.</Text>
        ) : hasJoined ? (
          <>
            <Text style={styles.joinedMessage}>You have already joined this event.</Text>
            <CustomButton 
              text="Set Reminder" 
              onPress={() => navigation.navigate("ReminderModal", { eventId })} 
            />
            <CustomButton 
              text="Cancel Registration" 
              onPress={onCancelRSVP} 
              disabled={isJoining || new Date(event.date).getTime() - Date.now() <= 2 * 24 * 60 * 60 * 1000} 
            />
          </>
        ) : (
          !showConfirmation && (
            <View style={styles.joinButtonContainer}>
              <CustomButton text="Join the Event" onPress={handleJoinClick} disabled={isJoining} />
            </View>
          )
        )}

        {showConfirmation && (
          <Animated.View style={[styles.ticketContainer, { opacity: fadeAnim }]}>
            <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.ticket}>
              <Text style={styles.ticketTitle}>RSVP Confirmation</Text>
              <Text style={styles.ticketDescription}>Do you want to join this event?</Text>
              <View style={styles.ticketActions}>
                <CustomButton text="Confirm" onPress={onConfirm} disabled={isJoining} />
                <CustomButton text="Cancel" onPress={() => setShowConfirmation(false)} />
              </View>
            </LinearGradient>
          </Animated.View>
        )}
      </View>

      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 10,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  dateText: {
    fontSize: 18,
    color: "#555",
    marginLeft: 8,
  },
  description: {
    fontSize: 16,
    color: "#333",
    marginVertical: 15,
    textAlign: "justify",
  },
  users: {
    flexDirection: "row",
    marginBottom: 15,
  },
  userAvatar: {
    width: 50,
    aspectRatio: 1,
    borderRadius: 25,
    margin: 2,
    borderWidth: 2,
    borderColor: "white",
    backgroundColor: "gainsboro",
    justifyContent: "center",
    alignItems: "center",
  },
  noUsersContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "lightgray",
    justifyContent: "center",
    alignItems: "center",
  },
  noUsersText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  moreAttendees: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "lightgray",
    justifyContent: "center",
    alignItems: "center",
  },
  joinedMessage: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 30,
  },
  joinButtonContainer: {
    marginBottom: 5, // Adjust to reduce space below the button
    alignItems: "center",
    width: "98%",
  },
  footer: {
    marginTop: "auto",
    marginBottom: 40,
    alignItems: "center",
  },
  ticketContainer: {
    marginTop: 10, // Reduced top margin to push the ticket up
    padding: 30,
    borderRadius: 15,
    position: "absolute",
    bottom: 0,
    left: 10,
    right: 10,
    height: 350, // Increased height
    width: "95%", // Increased width
  },

  ticket: {
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },

  ticketTitle: {
    fontSize: 35, // Increased font size for the title
    fontWeight: "bold", // Ensured it's bold
    color: "white",
  },

  ticketDescription: {
    fontSize: 16,
    color: "white",
    marginVertical: 10,
    textAlign: "center",
  },

  ticketActions: {
    flexDirection: "column", // Stack the buttons vertically
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20, // Added more margin between the title and buttons
  },

  confirmButton: {
    marginBottom: 15, // Space between the buttons
    width: "80%", // Adjust width if needed
  },

  cancelButton: {
    marginBottom: 15, // Space between the buttons
    width: "80%", // Adjust width if needed
  },

  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  hostMessage: {
    fontSize: 18,
    color: "black",
  },
  hostContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  hostName: {
    fontSize: 16,
    color: "#666",
  },
  
});