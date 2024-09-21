import {StyleSheet} from 'react-native';

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

export default styles;
