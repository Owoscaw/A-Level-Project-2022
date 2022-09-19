import React from "react";
import { useState, Component, useRef } from "react";
import { useTransition, animated } from "react-spring";


import NetworkDisplay from "./NetworkDisplay";
import BetterMap from "./BetterMap";
import "../styles/newSol.css";

let startNode;
let activeNodes = {};
const googleColours = ["66, 133, 244", "234, 67, 53", "251, 188, 5", "52, 168, 83"];

function NewSol(props){

  //states to show nodeMenu and solution cover
  const [ coverIsOn, setCover ] = useState(false);
  let [ nodesInMenu, updateMenu ] = useState([]);

  //transitions for node menu
  const nodeTransition = useTransition(nodesInMenu, {
    from: {
      left: "-110%",
      height: 100,
      paddingTop: 2,
      paddingBottom: 2
    },
    enter: {
      left: "0%",
      height: 100,
      paddingTop: 2,
      paddingBottom: 2
    },
    leave: node => async (next, cancel) => {
      await next({
        left: "110%"
      })
      await next({
        height: 0,
        paddingTop: 0,
        paddingBottom: 0
      })
    }
  });

  const calculateSol = () => {
    setCover(true);
  };

  const cancelSol = () => {
    setCover(false);
  };

  //reference to the function used to delete and rename a marker/overlay from the map
  const deleteChildNode = useRef(null);
  const renameChildNode = useRef(null);

  //called from betterMap when a node is included in the solution
  const activateNode = (node) => {
    activeNodes[node.name] = node;
    updateMenu([...nodesInMenu, node]);
  };

  //opposite of above
  const deactivateNode = (node) => {
    deleteChildNode.current(node);
    delete activeNodes[node.name];
 
    updateMenu(prevState => (prevState.filter(entr => (entr.name !== node.name))));
  };

  const renameNode = (node, newName) => {
    let renamedNode = renameChildNode.current(node, newName); 

    updateMenu(prevState => prevState.map(entr => {
      if(entr.name === node.name){
        entr.name = newName;
      }
      return entr;
    }));

    return renamedNode;
  };

  return (
    <div id="newSolution">
      <div id="UpperPage">
        <BetterMap activateNode={activateNode} deactivateNode={deactivateNode} 
        deleteChildNode={deleteChildNode} renameChildNode={renameChildNode}/>
        <div id="nodeMenu">
          <div id="headOfNodes">
            Node Menu
          </div>
          <div id="divOfNodes">
            <ul id="listOfNodes">
              {
                nodeTransition((styles, node) => {
                  return (
                    <NodeInList node={node} divStyle={{
                      left: styles.left
                      }} liStyle={{
                      height: styles.height,
                      paddingTop: styles.paddingTop,
                      paddingBottom: styles.paddingBottom
                      }} deleteHandler={deactivateNode} renameHandler={renameNode}/>
                  );
                })
              }
            </ul>
          </div>
        </div>
      </div>

      <div id="LowerPage">
        <input id="backButton" type="button" value="Back" onClick={() => props.changeScreen("menu")}/>

        <input id="calculateButton" type="button" value="Calculate" onClick={calculateSol}/>
      </div>

      {coverIsOn ? <NetworkDisplay onCancel={cancelSol}/> : null}

      <script src="https://code.createjs.com/1.0.0/createjs.min.js"></script>
    </div>
  );
}


//custom component to represent a node in the node menu
class NodeInList extends Component {

  constructor(props){
    super();

    this.state = {
      name: props.node.name,
      node: props.node,
    };

    this.divStyle = props.divStyle;
    this.liStyle = props.liStyle;
    this.deleteHandler = props.deleteHandler.bind(this);
    this.renameHandler = props.renameHandler.bind(this);
    this.keyPress = this.keyPress.bind(this);
  }


  keyPress(event){
    if(event.key !== "Enter"){
      return;
    }
    event.target.blur();

    let renamedNode = this.renameHandler(this.state.node, this.state.name);
    this.setState({
      name: renamedNode.name,
      node: renamedNode
    });
  }


  render(){

    return (
      <animated.li key={this.state.node.name} style={this.liStyle}>
        <animated.div className="NodeInList" style={this.divStyle}>
          <div className="NameDiv">{this.state.node.name}</div>
          <input className="RemovalButton" type="button" value="Remove Node"
          onClick={() => {this.deleteHandler(this.state.node);}}/>
          <div className="LatLngDiv">
            {this.state.node.lat.toFixed(8).toString() + ", " + this.state.node.lng.toFixed(8).toString()}
          </div>
          <div className="RenameButtonDiv">
            <input className="TextBox" type="text" maxLength="30" 
            onChange={event => this.setState({...this.state, name: event.target.value})}
            onKeyDown={event => this.keyPress(event)} onBlur={event => {event.target.value = "";}}/>
            <div className="ButtonTextDiv">Rename Node</div>
          </div>
        </animated.div>
      </animated.li>
    );
  }
}


export default NewSol;