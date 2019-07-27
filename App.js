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

  componentDidMount(){
    console.log(this.state);
  }

  _onContextCreate = async gl => {

    //functions
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

    //shaders
    const vertexShaderSource =
      `
      attribute vec4 a_position;
      void main () {
        gl_Position = a_position;
      }
      `;

    const fragmentShaderSource =
      `
      precision highp float;
      uniform vec4 u_color;
      void main () {
        gl_FragColor = u_color;
      }
      `;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    //program
    const program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttributeLocation);

    const size = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.vertexAttribPointer(positionAttributeLocation, size, type, normalize, stride, offset)

    const primitiveType = gl.TRIANGLES;

    const count = 6;

    const colorUniformLocation = gl.getUniformLocation(program, "u_color");
    gl.uniform4f(colorUniformLocation, Math.random(), Math.random(), Math.random(), 1);

    const onTick = () => {
      const positions = createRectangle(.5, .5, this.state.testValue, -.5);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
      gl.clearColor(.2, .9, .6, 1);
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
        <GLView style={{width: 300, minHeight: 300, maxHeight: 300}} onContextCreate={this._onContextCreate}/>
        <TouchableOpacity
          style={{ width: 300, height: 100, backgroundColor: 'red'}}
          onPress={() => {this.setState({testValue: this.state.testValue + .1 })}}
          />
        <TouchableOpacity
          style={{ width: 300, height: 100, backgroundColor: 'blue'}}
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
});
