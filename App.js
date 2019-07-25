import React from 'react';
import { StyleSheet, Text, View, Dimensions } from 'react-native';
import { GLView } from 'expo-gl';

export default class App extends React.Component {
  constructor(){
    super();
    this.state = {
      screenHeight: null,
      screenWidth: null,
    }
  }

  componentWillMount(){
    const {height, width} = Dimensions.get('window');
    this.setState({screenHeight: height, screenWidth: width})
  }

  _onContextCreate = async gl => {

  }

  render() {

    return (
      <View style={styles.container}>
        <Text style={{color:'red'}}>Open up App.js to start working on your app!</Text>
        <GLView style={[styles.glview, {width: this.state.screenWidth, height: this.state.screenWidth}]} onContextCreate={this._onContextCreate}/>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'lightgrey',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glview: {
    borderColor: 'red',
    borderRadius: 1,
  },
});
