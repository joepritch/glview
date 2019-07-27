import React from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity } from 'react-native';
import { GLView } from 'expo-gl';

export default class App extends React.Component {
  constructor(){
    super();
    this.state = {
      screenHeight: null,
      screenWidth: null,
      testValue: -1,
    }
  }

  componentWillMount(){
    const {height, width} = Dimensions.get('window');
    this.setState({screenHeight: height, screenWidth: width})
  }

  _onContextCreate = async gl => {

    const vertexShaderSource =
    `
    attribute vec4 a_position;
    void main () {
      gl_Position = a_position;
    }
    `;

    const fragmentShaderSource =
    `
    precision mediump float;
    void main () {
      gl_FragColor = vec4(1, .5, 0, 1);
    }
    `

    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
      if (success) {
        return shader;
      }

      console.log('shader failed to compile');
      console.log(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader)
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    function createProgram(gl, vertexShader, fragmentShader) {
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      const success = gl.getProgramParameter(program, gl.LINK_STATUS);
      if (success) {
        return program;
      }

      console.log('program failed to link');
      console.log(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
    }

    const program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttributeLocation);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const size = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    const primitiveType = gl.TRIANGLES;
    const count = 6;
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)

    function createRectangle(width, height, positionX, positionY) {
      const rectanglePositions = [
        positionX, positionY,
        positionX + width, positionY,
        positionX, positionY + height,
        positionX + width, positionY,
        positionX + width, positionY + height,
        positionX, positionY + height,
      ];
      return rectanglePositions;
    }

    const onTick = () => {
      const positions = createRectangle(.5, .5, this.state.testValue, -.5);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
      gl.clearColor(.2, 0, .6, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.drawArrays(primitiveType, offset, count);
      gl.endFrameEXP();
    };

    const animate = () => {
      if (gl) {
        this._rafID = requestAnimationFrame(animate);
        onTick(gl);
      }
    };
    animate();
  }

  render() {

    return (
      <View style={styles.container}>
        <Text style={{color:'red'}}>Open up App.js to start working on your app!</Text>
        <GLView style={styles.glview} onContextCreate={this._onContextCreate}/>
        <TouchableOpacity
          style={{ width: 50, height: 50, backgroundColor: 'red'}}
          onPress={() => {this.setState({testValue: this.state.testValue + .1 })}}
          />
        <TouchableOpacity
          style={{ width: 50, height: 50, backgroundColor: 'blue'}}
          onPress={() => {this.setState({testValue: this.state.testValue - .1 })}}
          />
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
    width: 300,
    height: 300,
    maxHeight: 300,
  },
});
