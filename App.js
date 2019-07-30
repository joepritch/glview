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
      xValueDelta: 0,
      yValueDelta: 0,
      width: 100,
      height: 100,
      count: 0,
      renderObject: [],
      rotation: [0, 1],
      rotationDegreeDelta: 0,
    }
  }

  componentWillMount(){
    const {height, width} = Dimensions.get('window');
    this.setState({screenHeight: height, screenWidth: width})

    this.translateResponder = PanResponder.create({
      onStartShouldSetPanResponder: (event, gestureState) => true,
      onPanResponderMove: (event, gestureState) => {
        this.setState({xValue: (gestureState.dx + this.state.xValueDelta), yValue: (gestureState.dy + this.state.yValueDelta)})
      },
      onPanResponderRelease: (event, gestureState) => {
        this.setState({xValueDelta: (gestureState.dx + this.state.xValueDelta), yValueDelta: (gestureState.dy + this.state.yValueDelta)})
      }
    })

    this.rotateResponder = PanResponder.create({
      onStartShouldSetPanResponder: (event, gestureState) => true,
      onPanResponderMove: (event, gestureState) => {
        this.setState({rotation: this.calculateRotation(gestureState.dx + this.state.rotationDegreeDelta)})
      },
      onPanResponderRelease: (event, gestureState) => {
        this.setState({rotationDegreeDelta: gestureState.dx + this.state.rotationDegreeDelta})
      }
    })

  }

  calculateRotation = (degrees, oldSine, oldCosine) =>{
    const radians = degrees * Math.PI / 180;
    const sine = Math.sin(radians);
    const cosine = Math.cos(radians);
    return [sine, cosine]
  }

  createRandomTriangle = () => {
    return this.createTriangle(Math.random() * 200, Math.random() * 200, Math.random() * 200, Math.random() * 200)
  }

  createTriangle = (width, height, xValue, yValue) => {
    //generate a triangle with specified size and a_position
    const triangleVerticies = [
      xValue, yValue,
      xValue + width, yValue,
      xValue, yValue + height,
    ];


    return triangleVerticies;
  }

  createRectangle = (width, height, xValue, yValue) => {
    //generate a rectangle with specified size and position
    const firstTriangle = this.createTriangle(width, height, xValue, yValue);

    const secondTriangle = this.createTriangle((width * -1), (height * -1), (xValue + width), (yValue + height));

    const rectangle = firstTriangle.concat(secondTriangle);

    return rectangle;
  }

  createF = (width, height, xValue, yValue) => {
    //generate rectangles in the shape of an 'F' with a specified height and position
    const thickness = width / 4;

    const column = this.createRectangle(thickness, height, xValue, yValue);

    const topRow = this.createRectangle((width - thickness), thickness, (xValue + thickness), yValue);

    const middleRow = this.createRectangle((width - (thickness * 2)), thickness, (xValue + thickness), (yValue + (thickness * 2)));

    const f = column.concat(topRow, middleRow);

    return f;
  }

  _onContextCreate = async (gl) => {

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

    const setGeometry = (gl, data) => {
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

      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(data),
        gl.STATIC_DRAW
      );

    }

    //shader sources
    const vertexShaderSource =
      `
      attribute vec2 a_position;
      uniform vec2 u_translation;
      uniform vec2 u_rotation;
      uniform vec2 u_resolution;
      varying vec4 v_color;
      void main () {
        vec2 rotatedPosition = vec2(
          a_position.x * u_rotation.y + a_position.y * u_rotation.x,
          a_position.y * u_rotation.y - a_position.x * u_rotation.x
        );
        vec2 position = rotatedPosition + u_translation;
        vec2 zeroToOne = position / u_resolution;
        vec2 zeroToTwo = zeroToOne * 2.0;
        vec2 clipSpace = zeroToTwo - 1.0;
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        v_color = gl_Position * 0.5 + 0.5;
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

    //shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    //program
    const program = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(program);

    //main
    const resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");
    gl.uniform2f(resolutionUniformLocation, 400, 400);

    const translationUniformLocation = gl.getUniformLocation(program, "u_translation");
    const rotationUniformLocation = gl.getUniformLocation(program, "u_rotation");


    const renderObject = this.createRectangle(this.state.width, this.state.height, 25, 25);

    setGeometry(gl, renderObject);

    const onTick = () => {
      gl.clearColor(1, 1, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const rotation = this.state.rotation;
      gl.uniform2fv(rotationUniformLocation, rotation)
      const translation = [this.state.xValue, this.state.yValue];
      gl.uniform2fv(translationUniformLocation, translation);

      const primitiveType = gl.TRIANGLES;
      const offset = 0;
      const count = 3;

      gl.drawArrays(primitiveType, offset, count);
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
          {...this.translateResponder.panHandlers}
          style={{width: 400, minHeight: 400, maxHeight: 400}}
          onContextCreate={this._onContextCreate}
        />
      <View
        {...this.rotateResponder.panHandlers}
        style={{width: 400, height: 100, borderRadius: 50, backgroundColor: 'green'}}
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
