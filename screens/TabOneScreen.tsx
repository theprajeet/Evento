import { StyleSheet, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { View } from "../components/Themed";
import { Agenda, AgendaSchedule } from "react-native-calendars";
import { gql, useQuery } from "@apollo/client";

// GraphQL query to get the events
const GetEvents = gql`
  query GetEvent {
    Event {
      id
      name
      date
    }
  }
`;

const getEventsSchedule = (events: any[]) => {
  const items: AgendaSchedule = {};

  if (events && events.length > 0) {
    events.forEach((event: any) => {
      // Ensure the date is in YYYY-MM-DD format for grouping
      const day = event.date.slice(0, 10); // Extract date in YYYY-MM-DD format (remove time)

      // If no day exists, create a new array for that day
      if (!items[day]) {
        items[day] = [];
      }
      items[day].push({
        ...event,
        day,
        height: 50, // Optional height to control item size
      });
    });
  }
  return items;
};

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`; // Convert to DD-MM-YYYY format
};

export default function TabOneScreen({ navigation }: any) {
  const { data, loading, error } = useQuery(GetEvents);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    Alert.alert("Error fetching events", error.message);
    return (
      <View style={styles.errorContainer}>
        <Text style={{ color: "red" }}>An error occurred. Please try again later.</Text>
      </View>
    );
  }

  const events = data?.Event || [];

  // Group events by their date
  const agendaItems = getEventsSchedule(events);

  console.log("Agenda Items:", agendaItems);

  return (
    <View style={styles.container}>
      <Agenda
        items={agendaItems}
        selected={Object.keys(agendaItems)[0] || "2024-11-29"} // Select the first available date or a default date
        renderItem={(reservation) => (
          <Pressable
            style={styles.item}
            onPress={() => navigation.navigate("Modal", { id: reservation.id })}
          >
            <Text style={styles.eventName}>{reservation?.name || "No Name"}</Text>
            <Text style={styles.eventDate}>{formatDate(reservation.day)}</Text>
          </Pressable>
        )}
        renderEmptyDate={() => (
          <View style={styles.emptyDate}>
            <Text>No events on this date</Text>
          </View>
        )}
        rowHasChanged={(r1, r2) => r1.id !== r2.id}
        pastScrollRange={12} // Allows scrolling backward in months
        futureScrollRange={12} // Allows scrolling forward in months
        showClosingKnob={true} // Display a knob for closing Agenda
        theme={{
          agendaTodayColor: "dodgerblue",
          agendaKnobColor: "gray",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  item: {
    backgroundColor: "white",
    flex: 1,
    borderRadius: 5,
    padding: 10,
    marginRight: 10,
    marginTop: 17,
  },
  eventName: {
    fontSize: 16,
  },
  eventDate: {
    fontSize: 14,
    color: "gray",
    marginTop: 5,
  },
  emptyDate: {
    height: 15,
    flex: 1,
    paddingTop: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
