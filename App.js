import React from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, PanResponder } from 'react-native';
import { GLView } from 'expo-gl';

export default class App extends React.Component {
  constructor(){
    super();
    this.state = {
      screenHeight: null,
      screenWidth: null,
      xValue: 0,
      yValue: 0,
      width: 100,
      height: 100,
      count: 0,
      renderObject: [],
    }
  }

  componentWillMount(){
    const {height, width} = Dimensions.get('window');
    this.setState({screenHeight: height, screenWidth: width})

    this.PanResponder = PanResponder.create({
      onStartShouldSetPanResponder: (event, gestureState) => true,
      onPanResponderMove: (event, gestureState) => {
        this.setState({xValue: (gestureState.dx), yValue: (gestureState.dy)})
      }
    })
  }


  _onContextCreate = async (gl) => {

    //functions
    const createRandomTriangle = () => {
      return createTriangle(Math.random() * 200, Math.random() * 200, Math.random() * 200, Math.random() * 200, )
    }

    const createTriangle = (width, height, xValue, yValue) => {
      //generate a triangle with specified size and a_position
      const triangleVerticies = [
        xValue, yValue,
        xValue + width, yValue,
        xValue, yValue + height,
      ];

      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(triangleVerticies),
        gl.STATIC_DRAW
      );

      const primitiveType = gl.TRIANGLES;
      const offset = 0;
      const count = 3;

      gl.drawArrays(primitiveType, offset, count);
    }

    const createRectangle = (width, height, xValue, yValue) => {
      //generate a rectangle with specified size and position
      const firstTriangle = createTriangle(width, height, xValue, yValue);

      const secondTriangle = createTriangle((width * -1), (height * -1), (xValue + width), (yValue + height));

      // const rectangle = firstTriangle.concat(secondTriangle)
      //
      // return rectangle;
    }

    const createF = (width, height, xValue, yValue) => {
      //generate rectangles in the shape of an 'F' with a specified height and position
      const thickness = width / 4;

      const column = createRectangle(thickness, height, xValue, yValue);

      const topRow = createRectangle((width - thickness), thickness, (xValue + thickness), yValue);

      const middleRow = createRectangle((width - (thickness * 2)), thickness, (xValue + thickness), (yValue + (thickness * 2)));

      // // console.log(column);
      // const finalArray = column.concat(topRow, middleRow)
      // // console.log(finalArray);
      //
      // return finalArray;
    }

    const getColors = () => {
      // pick 2 random colors
      const r1 = Math.random();
      const g1 = Math.random();
      const b1 = Math.random();

      const r2 = Math.random();
      const g2 = Math.random();
      const b2 = Math.random();

      const colorArray =
      [
        r1, g1, b1, 1,
        r1, g1, b1, 1,
        r2, g2, b2, 1,
        r2, g2, b2, 1,
        r2, g2, b2, 1,
        r1, g1, b1, 1
      ];

      return colorArray;
    }

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

    const setColor = (gl, colorArray) => {
      const colorBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

      const colorAttributeLocation = gl.getAttribLocation(program, "a_color");
      gl.enableVertexAttribArray(colorAttributeLocation);

      const size = 4;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.vertexAttribPointer(colorAttributeLocation, size, type, normalize, stride, offset)

      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(colorArray),
        gl.STATIC_DRAW
      );
    }

    const setGeometry = (gl) => {
      const vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);

      const vertexAttributeLocation = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(vertexAttributeLocation);

      const size = 2;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.vertexAttribPointer(vertexAttributeLocation, size, type, normalize, stride, offset)
    }

    //shaders
    const vertexShaderSource =
      `
      attribute vec2 a_position;
      uniform vec2 u_resolution;
      attribute vec4 a_color;
      varying vec4 v_color;
      void main () {
        vec2 zeroToOne = a_position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        v_color = a_color;
      }
      `;

    const fragmentShaderSource =
      `
      precision mediump float;
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

    //main
    setColor(gl, getColors());

    setGeometry(gl);

    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    gl.uniform2f(resolutionUniformLocation, 400, 400);

    const onTick = () => {
      gl.clearColor(1, 1, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      createF(this.state.width, this.state.height, this.state.xValue, this.state.yValue);
      gl.endFrameEXP();
    };

    const animate = () => {
      if (gl) {
        this._rafID = requestAnimationFrame(animate);
        onTick();
      }
    };
    animate();
  }

  render() {

    return (
      <View style={styles.container}>
        <GLView
          {...this.PanResponder.panHandlers}
          style={{width: 400, minHeight: 400, maxHeight: 400}}
          onContextCreate={this._onContextCreate}
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
