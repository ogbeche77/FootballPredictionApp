import {API_FOOTBALL_KEY} from '@env';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';

import {NavigationContainer} from '@react-navigation/native';
import axios from 'axios';
import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const API_KEY = API_FOOTBALL_KEY; // Replace with your API key

// Helper function to get tomorrow's date in YYYY-MM-DD format
const getTomorrowDate = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Reusable component for displaying matches for a specific league and predicting outcomes
const LeagueScreen = ({leagueId}) => {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);

  // Fetch all matches for tomorrow and filter by league ID
  const fetchMatches = async () => {
    const tomorrow = getTomorrowDate();
    const API_URL = `https://v3.football.api-sports.io/fixtures?date=${tomorrow}`; // Fetch all fixtures for tomorrow

    try {
      const response = await axios.get(API_URL, {
        headers: {
          'x-apisports-key': API_KEY,
        },
      });
      const allMatches = response.data.response; // Get all matches for tomorrow
      // Filter matches by league ID
      const leagueMatches = allMatches.filter(
        match => match.league.id === parseInt(leagueId),
      );
      const matchesWithPredictions = await Promise.all(
        leagueMatches.map(async match => {
          const prediction = await predictMatch(
            match.teams.home.id,
            match.teams.away.id,
          );
          return {...match, prediction};
        }),
      );
      setMatches(matchesWithPredictions); // Set filtered matches
      setLoading(false);
    } catch (error) {
      console.error('Error fetching match data:', error.message); // Log the error message
      console.error(error.response ? error.response.data : error); // Log additional error details
      setLoading(false);
    }
  };

  // Fetch team statistics and injuries, and predict match outcome
  const predictMatch = async (homeTeamId, awayTeamId) => {
    try {
      const homeStats = await fetchTeamStatistics(homeTeamId);
      const awayStats = await fetchTeamStatistics(awayTeamId);

      const homeInjuries = await fetchTeamInjuries(homeTeamId);
      const awayInjuries = await fetchTeamInjuries(awayTeamId);

      console.log('Home Team Stats:', homeStats);
      console.log('Away Team Stats:', awayStats);
      console.log('Home Team Injuries:', homeInjuries);
      console.log('Away Team Injuries:', awayInjuries);

      // If stats are null or not available, use default scores
      const homeScore = homeStats
        ? calculateTeamScore(homeStats, homeInjuries)
        : getDefaultScore();
      const awayScore = awayStats
        ? calculateTeamScore(awayStats, awayInjuries)
        : getDefaultScore();

      return `${homeScore} - ${awayScore}`;
    } catch (error) {
      console.error('Error predicting match outcome:', error);
      // Fallback logic: If something goes wrong, predict a draw
      return '1 - 1';
    }
  };

  // Fetch team statistics (form, goals scored, etc.)
  const fetchTeamStatistics = async teamId => {
    const API_URL = `https://v3.football.api-sports.io/teams/statistics?team=${teamId}&season=2024`;
    const response = await axios.get(API_URL, {
      headers: {
        'x-apisports-key': API_KEY,
      },
    });
    console.log(`Team ${teamId} Stats Response:`, response.data.response); // Log the full response
    return response.data.response; // Check if response is null or undefined
  };

  // Fetch team injuries
  const fetchTeamInjuries = async teamId => {
    const API_URL = `https://v3.football.api-sports.io/injuries?team=${teamId}`;
    const response = await axios.get(API_URL, {
      headers: {
        'x-apisports-key': API_KEY,
      },
    });
    console.log(`Team ${teamId} Injuries Response:`, response.data.response); // Log the full response
    return response.data.response || []; // Return empty array if injuries are not available
  };

  // Default score if statistics are unavailable
  const getDefaultScore = () => {
    return Math.floor(Math.random() * 3) + 1; // Return a random score between 1 and 3
  };

  // Calculate team score based on form and injuries
  const calculateTeamScore = (stats, injuries) => {
    // Ensure form exists before attempting to split it
    const formRating =
      stats && stats.form
        ? stats.form.split('').reduce((acc, match) => {
            if (match === 'W') {
              return acc + 3;
            }
            if (match === 'D') {
              return acc + 1;
            }
            return acc;
          }, 0)
        : 5; // Default form rating of 5 if stats are unavailable

    const injuryImpact = injuries.length > 0 ? injuries.length * 0.1 : 0; // Reduce score slightly based on injuries
    const score = Math.max(1, Math.round(formRating / 5 - injuryImpact)); // Ensure score is at least 1
    return score;
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#ffbf00" />
      ) : matches.length === 0 ? (
        <Text style={styles.noMatches}>
          No matches available for tomorrow in this league.
        </Text>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={item => item.fixture.id.toString()}
          renderItem={({item}) => (
            <View style={styles.matchItem}>
              <Text style={styles.matchText}>
                {item.teams.home.name} vs {item.teams.away.name} -{' '}
                {new Date(item.fixture.date).toLocaleString()}
              </Text>
              <Text style={styles.predictionText}>
                Prediction: {item.prediction}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

// Create a Tab Navigator
const Tab = createMaterialTopTabNavigator();

const PredictionsTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarItemStyle: {width: 150},
        tabBarLabelStyle: {fontSize: 12, fontWeight: 'bold'},
        tabBarStyle: {backgroundColor: '#1e1e1e'},
        tabBarIndicatorStyle: {backgroundColor: '#ffbf00', height: 3},
        tabBarActiveTintColor: '#ffbf00',
        tabBarInactiveTintColor: '#ccc',
      }}>
      <Tab.Screen
        name="English Premier League"
        component={() => <LeagueScreen leagueId="39" />}
      />
      <Tab.Screen
        name="La Liga"
        component={() => <LeagueScreen leagueId="140" />}
      />
      <Tab.Screen
        name="Serie A"
        component={() => <LeagueScreen leagueId="135" />}
      />
      <Tab.Screen
        name="Bundesliga"
        component={() => <LeagueScreen leagueId="78" />}
      />
      <Tab.Screen
        name="Ligue 1"
        component={() => <LeagueScreen leagueId="61" />}
      />
      <Tab.Screen
        name="UEFA Champions League"
        component={() => <LeagueScreen leagueId="2" />}
      />

      <Tab.Screen
        name="Turkish Super Lig"
        component={() => <LeagueScreen leagueId="203" />}
      />
      <Tab.Screen
        name="Carabao Cup"
        component={() => <LeagueScreen leagueId="713" />}
      />
    </Tab.Navigator>
  );
};

const App = () => {
  return (
    <NavigationContainer>
      <PredictionsTabs />
    </NavigationContainer>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#2b2b2b',
  },
  noMatches: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
    color: '#ffbf00',
  },
  matchItem: {
    backgroundColor: '#3b3b3b',
    padding: 20,
    marginVertical: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: {width: 0, height: 3},
    elevation: 5,
  },
  matchText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  predictionText: {
    fontSize: 16,
    marginTop: 5,
    color: '#ffbf00',
  },
});

export default App;
