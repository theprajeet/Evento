import React from "react";
import {
  StyleSheet,
  FlatList,
  Image,
  View as RNView,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import { gql, useQuery, useMutation } from "@apollo/client";
import { useUserData } from "@nhost/react";

// GraphQL Query to fetch attendees for an event
const FETCH_EVENT_USERS_QUERY = gql`
  query FetchEventUsers($eventId: uuid!) {
    EventAttendee(where: { eventId: { _eq: $eventId } }) {
      user {
        id
        displayName
        avatarUrl
      }
    }
  }
`;

// GraphQL Mutation to remove user from an event
const REMOVE_USER_FROM_EVENT_MUTATION = gql`
  mutation RemoveUserFromEvent($eventId: uuid!, $userId: uuid!) {
    delete_EventAttendee(
      where: { eventId: { _eq: $eventId }, userId: { _eq: $userId } }
    ) {
      affected_rows
    }
  }
`;

export default function UsersModalScreen({ route }: { route: any }) {
  const { eventId } = route.params;
  const user = useUserData(); // Get current user data

  const { data, loading, error, refetch } = useQuery(FETCH_EVENT_USERS_QUERY, {
    variables: { eventId },
    pollInterval: 2000,  // Poll every 2 seconds for real-time updates
  });

  const [removeUserFromEvent] = useMutation(REMOVE_USER_FROM_EVENT_MUTATION, {
    onCompleted: () => {
      Alert.alert("Success", "User has been removed from the event.");
      refetch(); // Trigger refetch to get updated attendees
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Something went wrong!");
    },
  });

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  // Filter out the logged-in user from the attendees list to prevent duplication
  const attendees = data?.EventAttendee.filter(
    (item: any) => item.user.id !== user?.id
  ) || [];

  const onRemoveUserPress = (userId: string) => {
    if (user?.id) {
      Alert.alert(
        "Remove User",
        `Are you sure you want to remove this user from the event?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Yes",
            onPress: () => {
              removeUserFromEvent({
                variables: {
                  eventId,
                  userId,
                },
              });

              // Notify the removed user (you can also send them an email or notification in a real scenario)
              Alert.alert("Removed", "You have been removed from the event.");
            },
          },
        ]
      );
    }
  };

  return (
    <RNView style={styles.container}>
      <FlatList
        data={attendees}
        keyExtractor={(item, index) => `${item.user.id}-${index}`} // Ensure unique keys
        renderItem={({ item }) => (
          <RNView style={styles.userRow}>
            <Image source={{ uri: item.user.avatarUrl }} style={styles.avatar} />
            <Text style={styles.username}>{item.user.displayName}</Text>
            {/* Show the remove button only to the event host */}
            {user?.id && (
              <TouchableOpacity
                onPress={() => onRemoveUserPress(item.user.id)}
                style={styles.removeButton}
              >
                <Text style={styles.removeButtonText}>-</Text>
              </TouchableOpacity>
            )}
          </RNView>
        )}
        ListEmptyComponent={<Text>No users have joined this event.</Text>}
      />
    </RNView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  removeButton: {
    backgroundColor: "#FF5C5C",
    width: 30, // Width of the button
    height: 30, // Height of the button
    borderRadius: 15, // Half of width/height to make it round
    justifyContent: "center", // Center the minus sign
    alignItems: "center", // Center the minus sign
    marginLeft: 10,
  },
  removeButtonText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
  }
});
