import React from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, PanResponder } from 'react-native';
import { GLView } from 'expo-gl';

export default class App extends React.Component {
  constructor(){
    super();
    this.state = {
      screenHeight: null,
      screenWidth: null,
      xValue: -1,
      yValue: -1,
    }
  }

  componentWillMount(){
    const {height, width} = Dimensions.get('window');
    this.setState({screenHeight: height, screenWidth: width})

    this.PanResponder = PanResponder.create({
      onStartShouldSetPanResponder: (event, gestureState) => true,
      onPanResponderMove: (event, gestureState) => {
        this.setState({xValue: (gestureState.dx / 200), yValue: (gestureState.dy / -200)})
      }
    })
  }

  _onContextCreate = async gl => {

    //functions
    const createShader = (gl, type, source) => {
      //create and compile shaders
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

    const createProgram = (gl, vertexShader, fragmentShader) => {
      //creates and links the program
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

    const generateBufferData = (gl, attribute, size, dataFunc) => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

      const attributeLocation = gl.getAttribLocation(program, attribute);
      gl.enableVertexAttribArray(attributeLocation);

      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.vertexAttribPointer(attributeLocation, size, type, normalize, stride, offset)

      gl.bufferData(
        gl.ARRAY_BUFFER,
        dataFunc,
        gl.STATIC_DRAW
      );
    }

    const createRectangle = (width, height, positionX, positionY) => {
      //generate a rectangle with specified size and position
      const rectanglePositions =
      [
        positionX, positionY,
        positionX + width, positionY,
        positionX, positionY + height,
        positionX + width, positionY,
        positionX + width, positionY + height,
        positionX, positionY + height,
      ];

      return new Float32Array(rectanglePositions);
    }

    // const setColors = (gl) => {
    //   //load colors to GPU
    //   const colorBuffer = gl.createBuffer();
    //   gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    //
    //   const colorAttributeLocation = gl.getAttribLocation(program, "a_color");
    //   gl.enableVertexAttribArray(colorAttributeLocation);
    //
    //   const size = 4;
    //   const type = gl.FLOAT;
    //   const normalize = false;
    //   const stride = 0;
    //   const offset = 0;
    //   gl.vertexAttribPointer(colorAttributeLocation, size, type, normalize, stride, offset);
    //
    //   gl.bufferData(
    //     gl.ARRAY_BUFFER,
    //     getColors(gl),
    //     gl.STATIC_DRAW
    //   );
    // }

    const getColors = () => {
      // pick 2 random colors
      const r1 = 1
      const g1 = 0
      const b1 = 0

      const r2 = 0
      const g2 = 0
      const b2 = 1

      const colorArray =
      [
        r1, g1, b1, 1,
        r1, g1, b1, 1,
        r2, g2, b2, 1,
        r1, g1, b1, 1,
        r2, g2, b2, 1,
        r2, g2, b2, 1
      ];

      return new Float32Array(colorArray);
    }

    //shaders
    const vertexShaderSource =
      `
      attribute vec4 a_position;
      attribute vec4 a_color;
      varying vec4 v_color;
      void main () {
        gl_Position = a_position;
        v_color = a_color;
      }
      `;

    const fragmentShaderSource =
      `
      precision highp float;
      varying vec4 v_color;
      void main () {
        gl_FragColor = v_color;
      }
      `;

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    //program
    const program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    generateBufferData(gl, "a_color", 4, getColors());
    // setColors(gl);


    const primitiveType = gl.TRIANGLES;
    const count = 6;
    const offset = 0;

    const onTick = () => {
      generateBufferData(gl, "a_position", 2, createRectangle(.5, .5, this.state.xValue, this.state.yValue));
      gl.clearColor(1, 1, 1, 1);
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
        <GLView {...this.PanResponder.panHandlers} style={{width: 300, minHeight: 300, maxHeight: 300}} onContextCreate={this._onContextCreate}/>

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
