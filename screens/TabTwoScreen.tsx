import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Image,
  TouchableOpacity,
  View as RNView,
  Alert,
  ScrollView,
} from "react-native";
import { Text, View } from "../components/Themed";
import { useUserData, useSignOut } from "@nhost/react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { gql, useQuery, useMutation } from "@apollo/client";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { parseISO, format } from "date-fns";


type NavigationProp = NativeStackNavigationProp<RootStackParamList, "TabTwo">;

// GraphQL Query to Fetch Hosted Events
const FETCH_USER_HOSTED_EVENTS_QUERY = gql`
  query FetchUserHostedEvents($userId: uuid!) {
    Event(where: { user_events: { user_id: { _eq: $userId }, role: { _eq: "host" } } }) {
      id
      name
      date
      description
      EventAttendee {
        id
        user {
          displayName
          avatarUrl
        }
      }
    }
  }
`;

// GraphQL Query to Fetch Joined Events
const FETCH_USER_JOINED_EVENTS_QUERY = gql`
  query FetchUserJoinedEvents($userId: uuid!) {
    EventAttendee(where: { userId: { _eq: $userId } }) {
      eventId
      Event {
        id
        name
        date
      }
    }
  }
`;

// GraphQL Mutation to Delete an Event
const DELETE_EVENT_MUTATION = gql`
  mutation DeleteEvent($eventId: uuid!) {
    delete_Event_by_pk(id: $eventId) {
      id
    }
  }
`;

export default function TabTwoScreen() {
  const user = useUserData();
  const { signOut } = useSignOut();
  const navigation = useNavigation<NavigationProp>();
  const [hostedEvents, setHostedEvents] = useState<any[]>([]);
  const [joinedEvents, setJoinedEvents] = useState<any[]>([]);
  const [loadingState, setLoadingState] = useState<boolean>(true);

  const { data: hostedData, refetch: hostedRefetch, loading: hostedLoading } = useQuery(
    FETCH_USER_HOSTED_EVENTS_QUERY,
    {
      variables: { userId: user?.id },
      skip: !user?.id,
      fetchPolicy: "network-only",
    }
  );

  const { data: joinedData, refetch: joinedRefetch, loading: joinedLoading } = useQuery(
    FETCH_USER_JOINED_EVENTS_QUERY,
    {
      variables: { userId: user?.id },
      skip: !user?.id,
      fetchPolicy: "network-only",
      onCompleted: () => setLoadingState(false),
      onError: () => setLoadingState(false),
    }
  );

  useEffect(() => {
    if (hostedData?.Event) {
      setHostedEvents(hostedData.Event);
    } else {
      setHostedEvents([]);
    }

    if (joinedData?.EventAttendee) {
      const joined = joinedData.EventAttendee.map((item: any) => item.Event);
      setJoinedEvents(joined);
    } else {
      setJoinedEvents([]);
    }
  }, [hostedData, joinedData]);

  useFocusEffect(
    React.useCallback(() => {
      hostedRefetch();
      joinedRefetch();
    }, [hostedRefetch, joinedRefetch])
  );

  const [deleteEvent] = useMutation(DELETE_EVENT_MUTATION, {
    onCompleted: () => {
      Alert.alert("Success", "Event has been deleted.");
      hostedRefetch();
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Something went wrong!");
    },
  });

  const onHostEventPress = () => {
    navigation.navigate("CreateEvent");
  };

  const onCancelEventPress = (eventId: string) => {
    Alert.alert("Cancel Event", "Are you sure you want to cancel this event?", [
      { text: "No", style: "cancel" },
      { text: "Yes", onPress: () => deleteEvent({ variables: { eventId } }) },
    ]);
  };

  const onViewUsersPress = (eventId: string) => {
    navigation.navigate("UsersModal", { eventId });
  };

  if (loadingState || hostedLoading || joinedLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* User Profile Section */}
      <Image source={{ uri: user?.avatarUrl }} style={styles.avatar} />
      <Text style={styles.name}>{user?.displayName}</Text>

      {/* Host Event Button */}
      <TouchableOpacity style={styles.hostEventButton} onPress={onHostEventPress}>
        <Text style={styles.hostEventButtonText}>Host an Event</Text>
      </TouchableOpacity>

      {/* Hosted Events Section */}
      {hostedEvents.length > 0 ? (
        hostedEvents.map((event) => (
          <RNView key={event.id} style={styles.hostedEventsCard}>
            <Text style={styles.cardTitle}>{event.name}</Text>
            <RNView style={styles.cardDetailsContainer}>
              <RNView style={[styles.detailItem, styles.detailItemWithBorder]}>
                <Text style={styles.detailLabel}>Date:</Text>
                <Text style={styles.detailValue}>
                  {new Date(event.date).toLocaleDateString()}
                </Text>
              </RNView>
              <RNView style={[styles.detailItem, styles.detailItemWithBorder]}>
                <Text style={styles.detailLabel}>Users Joined:</Text>
                <Text style={styles.detailValue}>{event.EventAttendee.length}</Text>
              </RNView>
            </RNView>
            <TouchableOpacity
              style={styles.cardButton}
              onPress={() => onViewUsersPress(event.id)}
            >
              <Text style={styles.cardButtonText}>View Users</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cardButton, styles.cancelButton]}
              onPress={() => onCancelEventPress(event.id)}
            >
              <Text style={[styles.cardButtonText, styles.cancelButtonText]}>
                Cancel the Event
              </Text>
            </TouchableOpacity>
          </RNView>
        ))
      ) : (
        <Text style={styles.noEventsText}>
          You have not hosted any events yet.
        </Text>
      )}

      {/* Joined Events RSVP Tickets */}
      {joinedEvents.length > 0 ? (
      <RNView style={styles.joinedEventsContainer}>
        <Text style={styles.joinedEventsTitle}>RSVP Tickets</Text>
        {joinedEvents.map((event) => {
          const eventDate = event.date
            ? new Date(event.date).toLocaleDateString()
            : "Date not available";
        
          return (
            <View
              key={event.id}
              style={styles.rsvpTicket}
            >
              {/* Ticket Title */}
              <Text style={styles.rsvpTicketTitle}>RSVP Ticket</Text>
          
              {/* Event Details */}
              <RNView style={styles.ticketDetailsContainer}>
                <Text style={styles.eventName}>{event.name}</Text>
                <Text style={styles.eventDate}>{eventDate}</Text>
              </RNView>
            </View>
          );
        })}
      </RNView>
    
) : (
  <Text style={styles.noJoinedEventsText}>You have not joined any events yet.</Text>
)}

      {/* Sign Out Button */}
      <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: "center",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginVertical: 20,
    backgroundColor: "#ccc",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  hostEventButton: {
    width: "90%",
    height: 50,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  hostEventButtonText: {
    color: "#333",
    fontWeight: "bold",
    fontSize: 16,
  },
  hostedEventsCard: {
    width: "90%",
    marginVertical: 15,
    borderRadius: 15,
    padding: 15,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  cardDetailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  detailItem: {
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  detailItemWithBorder: {
    borderWidth: 0.1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 10,
    backgroundColor: "#E9ECEF",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#888",
  },
  detailValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  cardButton: {
    height: 45,
    backgroundColor: "#E9ECEF",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 5,
    elevation: 2,
  },
  cancelButton: {
    backgroundColor: "#ffe5e5",
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  cancelButtonText: {
    color: "crimson",
  },
  noEventsText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  signOutButton: {
    width: "90%",
    height: 50,
    borderRadius: 15,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  signOutText: {
    color: "red",
    fontWeight: "bold",
    fontSize: 14,
  },
  joinedEventsContainer: {
    width: "90%",
    marginTop: 20,
    alignItems: "center",
  },
  joinedEventsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  rsvpTicket: {
    width: "100%",
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    // backgroundColor: "rgba(0, 0, 0, 0.3)"
    backgroundColor: "white", 
    // borderColor: "rgba(255, 255, 255, 0.1)",   
    borderColor: "white",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    overflow: "hidden", // To ensure rounded corners
  },
  rsvpTicketTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
    marginBottom: 10,
  },
  eventText: {
    fontSize: 18,
    color: "black",
    marginBottom: 5,
  },
  eventName: {
    fontSize: 17,
    fontWeight: "500",
    color: "black",
  },
  eventNameText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#fff",
  },
  noJoinedEventsText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 20,
  },
  ticketDetailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  eventDate: {
    fontSize: 16,
    fontWeight: "400",
    color: "black",
  },

});
