import React from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, PanResponder } from 'react-native';
import { GLView } from 'expo-gl';

export default class App extends React.Component {
  constructor(){
    super();
    this.state = {
      screenHeight: null,
      screenWidth: null,
      width: 100,
      height: 100,
      translation: [0, 0],
      translationDelta: [0, 0],
      rotation: [0, 1],
      rotationDegreeDelta: 0,
      scale: [1, 1],
      scaleDelta: [1, 1],
    }
  }

  componentWillMount(){
    const {height, width} = Dimensions.get('window');
    this.setState({screenHeight: height, screenWidth: width})

    this.translateResponder = PanResponder.create({
      onStartShouldSetPanResponder: (event, gestureState) => true,
      onPanResponderMove: (event, gestureState) => {
        this.setState({translation: this.calculateTranslation(gestureState, this.state.translationDelta)})
      },
      onPanResponderRelease: (event, gestureState) => {
        this.setState({translationDelta: this.calculateTranslation(gestureState, this.state.translationDelta)})
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

    this.scaleResponder = PanResponder.create({
      onStartShouldSetPanResponder: (event, gestureState) => true,
      onPanResponderMove: (event, gestureState) => {
        this.setState({scale: this.calculateScale(gestureState, this.state.scaleDelta)})
      },
      onPanResponderRelease: (event, gestureState) => {
        this.setState({scaleDelta: this.calculateScale(gestureState, this.state.scaleDelta)})
      }
    })

  }

  //matrix
  m3 = {
    translation: () => {
      const t = this.state.translation;
      return [
        1, 0, 0,
        0, 1, 0,
        t[0], t[1], 1,
      ];
    },

    rotation: () => {
      const r = this.state.rotation;
      return [
        r[1],-r[0], 0,
        r[0], r[1], 0,
        0, 0, 1,
      ];
    },

    scale: () => {
      const s = this.state.scale;
      return [
        s[0], 0, 0,
        0, s[1], 0,
        0, 0, 1,
      ];
    },

    identity: () => {
      return [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      ];
    },

    projection: (width, height) => {
      return [
        2 / width, 0, 0,
        0, -2 / height, 0,
        -1, 1, 1
      ];
    },

    multiply: (a, b) => {
      var a00 = a[0 * 3 + 0];
      var a01 = a[0 * 3 + 1];
      var a02 = a[0 * 3 + 2];
      var a10 = a[1 * 3 + 0];
      var a11 = a[1 * 3 + 1];
      var a12 = a[1 * 3 + 2];
      var a20 = a[2 * 3 + 0];
      var a21 = a[2 * 3 + 1];
      var a22 = a[2 * 3 + 2];
      var b00 = b[0 * 3 + 0];
      var b01 = b[0 * 3 + 1];
      var b02 = b[0 * 3 + 2];
      var b10 = b[1 * 3 + 0];
      var b11 = b[1 * 3 + 1];
      var b12 = b[1 * 3 + 2];
      var b20 = b[2 * 3 + 0];
      var b21 = b[2 * 3 + 1];
      var b22 = b[2 * 3 + 2];

      return [
        b00 * a00 + b01 * a10 + b02 * a20,
        b00 * a01 + b01 * a11 + b02 * a21,
        b00 * a02 + b01 * a12 + b02 * a22,
        b10 * a00 + b11 * a10 + b12 * a20,
        b10 * a01 + b11 * a11 + b12 * a21,
        b10 * a02 + b11 * a12 + b12 * a22,
        b20 * a00 + b21 * a10 + b22 * a20,
        b20 * a01 + b21 * a11 + b22 * a21,
        b20 * a02 + b21 * a12 + b22 * a22,
      ];
    },
  };
  //transforms
  calculateTranslation = (translation, translationDelta) => {
    const tx = translation.dx + translationDelta[0];
    const ty = translation.dy + translationDelta[1];
    return [tx, ty];
  }

  calculateRotation = (degrees) => {
    const radians = degrees * Math.PI / 180;
    const sine = Math.sin(radians);
    const cosine = Math.cos(radians);
    return [sine, cosine]
  }

  calculateScale = (scale, scaleDelta) => {
    const xScale = (scale.dx / 100) + scaleDelta[0];
    const yScale = (scale.dy / 100) + scaleDelta[1];
    return [xScale, yScale];
  }


  //create shapes
  createRandomTriangle = () => {
    //create a random triangle
    return this.createTriangle(Math.random() * 200, Math.random() * 200, Math.random() * 200, Math.random() * 200)
  }

  createTriangle = (width, height, xValue, yValue) => {
    //create a triangle with specified size and a_position
    const triangleVerticies = [
      xValue, yValue,
      xValue + width, yValue,
      xValue, yValue + height,
    ];


    return triangleVerticies;
  }

  createRectangle = (width, height, xValue, yValue) => {
    //create a rectangle with specified size and position
    const firstTriangle = this.createTriangle(width, height, xValue, yValue);

    const secondTriangle = this.createTriangle((width * -1), (height * -1), (xValue + width), (yValue + height));

    const rectangle = firstTriangle.concat(secondTriangle);

    return rectangle;
  }

  createF = (width, height, xValue, yValue) => {
    //create multiple rectangles in the shape of an 'F' with a specified height and position
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
      //create and link the program
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
      uniform mat3 u_matrix;
      varying vec4 v_color;
      void main () {
        gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
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

    const matrixLocation = gl.getUniformLocation(program, "u_matrix");

    const renderObject = this.createF(100, 100, 0, 0);

    setGeometry(gl, renderObject);

    const onTick = () => {
      gl.clearColor(1, 1, 1, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      const translationMatrix = this.m3.translation();
      const rotationMatrix = this.m3.rotation();
      const scaleMatrix = this.m3.scale();
      const projectionMatrix = this.m3.projection(400, 400);

      let matrix = this.m3.multiply(projectionMatrix, translationMatrix);
      matrix = this.m3.multiply(matrix, rotationMatrix);
      matrix = this.m3.multiply(matrix, scaleMatrix);
      gl.uniformMatrix3fv(matrixLocation, false, matrix);

      const primitiveType = gl.TRIANGLES;
      const offset = 0;
      const count = 18;

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
        style={{width: 400, height: 100, borderRadius: 50, backgroundColor: 'lightgreen'}}
      />
      <View
        {...this.scaleResponder.panHandlers}
        style={{width: 400, height: 100, borderRadius: 50, backgroundColor: 'pink'}}
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
