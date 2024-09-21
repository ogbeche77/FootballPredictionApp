import {API_FOOTBALL_KEY} from '@env';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {NavigationContainer} from '@react-navigation/native';
import axios from 'axios';
import React, {useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, Text, View} from 'react-native';
import styles from './AppStyles';

const API_KEY = API_FOOTBALL_KEY;

const getTomorrowDate = () => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const LeagueScreen = ({leagueId}) => {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);

  const fetchMatches = async () => {
    const tomorrow = getTomorrowDate();
    const API_URL = `https://v3.football.api-sports.io/fixtures?date=${tomorrow}`;

    try {
      const response = await axios.get(API_URL, {
        headers: {
          'x-apisports-key': API_KEY,
        },
      });
      const allMatches = response.data.response;

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
      setMatches(matchesWithPredictions);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching match data:', error.message);
      setLoading(false);
    }
  };

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

      const homeScore = homeStats
        ? calculateTeamScore(homeStats, homeInjuries)
        : getDefaultScore();
      const awayScore = awayStats
        ? calculateTeamScore(awayStats, awayInjuries)
        : getDefaultScore();

      return `${homeScore} - ${awayScore}`;
    } catch (error) {
      console.error('Error predicting match outcome:', error);
      return '1 - 1';
    }
  };

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

  const fetchTeamInjuries = async teamId => {
    const API_URL = `https://v3.football.api-sports.io/injuries?team=${teamId}`;
    const response = await axios.get(API_URL, {
      headers: {
        'x-apisports-key': API_KEY,
      },
    });
    console.log(`Team ${teamId} Injuries Response:`, response.data.response);
    return response.data.response || [];
  };

  const getDefaultScore = () => {
    return Math.floor(Math.random() * 3) + 1;
  };

  const calculateTeamScore = (stats, injuries) => {
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
        : 5;

    const injuryImpact = injuries.length > 0 ? injuries.length * 0.1 : 0;
    const score = Math.max(1, Math.round(formRating / 5 - injuryImpact));
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
                Prediction: To be determined
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

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
        name="Carabao Cup"
        component={() => <LeagueScreen leagueId="713" />}
      />

      <Tab.Screen
        name="Turkish Super Lig"
        component={() => <LeagueScreen leagueId="203" />}
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

export default App;
