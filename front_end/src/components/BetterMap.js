import React, { useCallback, useMemo, useRef, useState, Component, Fragment} from "react";
import { GoogleMap, useLoadScript, OverlayView, Marker } from "@react-google-maps/api";

import "../styles/betterMap.css";

const possibleIcons = ["markerIcon1.jpg", "markerIcon2.jpg", "markerIcon3.jpg"];
const googleColours = ["23, 107, 239", "255, 62, 48", "247, 181, 41", "23, 156, 82"];
let usedNames = {};


function BetterMap(props){

    const { isLoaded } = useLoadScript({

        //dont look!!!
        googleMapsApiKey: "AIzaSyA4JxaRwAQ18Zvjyxy1CAkuSxKjGpGLzws"
    });
 
    //references and memos to avoid re-rendering map
    const mapRef = useRef();
    const [ nodes, updateNodes ] = useState([]);
    const onMapLoad = useCallback((map) => (mapRef.current = map), []);
    const mapCenter = useMemo(() => ({lat: 52.4, lng: 0}), []);
    const mapOptions = useMemo(() => ({
        disableDefaultUI: true,
        clickableIcons: false,
        draggableCursor: "default",
        draggingCursor: "grabbing"
    }), []);


    //so we can access the functions to remove/rename a node from the menu from newSol
    React.useEffect(() => {
        props.deleteChildNode.current = deleteNode;
    });
    React.useEffect(() => {
        props.renameChildNode.current = renameNode;
    });


    //re-rendering without the deleted node, auditing usedNames
    const deleteNode = (node) => {

        updateNodes(prevState => prevState.filter(entr => {
            return entr.name !== node.name;
        }));
        delete usedNames[node.name];
    };

    //renames a node on the map
    const renameNode = (node, newName) => {
        console.log(node, newName);

        let renamedNode = {
            ...node,
            name: newName
        };

        updateNodes(prevState => prevState.map(entr => (entr.name === node.name ? renamedNode : entr)));
        return renamedNode;
    };

    //used to initialise a timeout, after which a node is deleted
    const setNodeTimeout = (node) => {

        if(node.active){
            return;
        }

        if(node.timeout != null){
            clearTimeout(node.timeout);
        }
        node.timeout = setTimeout(deleteNode, 2000, node);
    };


    //used to clear said timeout 
    const clearNodeTimeout = (node) => {

        if(node.active){
            return;
        }

        if(node.timeout != null){
            clearTimeout(node.timeout);
            node.timeout = null;
        }
    }

    //adds a new node with a marker wherever the map was clicked
    const addNodeHandler = (event) => {

        //resetting node index
        let nodeIndex = 1;
        while(("Node " + nodeIndex.toString()) in usedNames){
            nodeIndex ++;
        }

        //creating new node
        let newNode = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
            url: possibleIcons[Math.floor(Math.random()*3)],
            scaledSize: new window.google.maps.Size(50, 50),
            name: "Node " + nodeIndex.toString(),
            timeout: null,
            colour: "rgba(" + googleColours[Math.floor(Math.random()*4)] + ", 0.5)",
            active: false
        };

        //re-rending with new node included
        usedNames[newNode.name] = true;
        updateNodes(prevState => prevState.concat([newNode]));
    };


    //adds a node to the menu, signifies that it has been included in the solution
    const nodeClickHandler = (node) => {

        if(node.active){
            node.active = false;
            props.deactivateNode(node);
            return;
        }

        node.active = true;
        props.activateNode(node);
    };


    let nodeArray = nodes.map(node => {
        
        return (
            <Fragment key={node.name}>
                <Marker position={{lat: node.lat, lng: node.lng}} icon={{url: node.url, scaledSize: node.scaledSize}} 
                onMouseOver={() => {clearNodeTimeout(node);}} 
                onMouseOut={() => {setNodeTimeout(node);}}
                onLoad={() => {setNodeTimeout(node);}}/>,
                <OverlayView position={{lat: node.lat, lng: node.lng}} 
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                    <NodeVerlay node={node} 
                    setNodeTimeout={setNodeTimeout} clearNodeTimeout={clearNodeTimeout}
                    clickNode={nodeClickHandler}/>
                </OverlayView>
            </Fragment>
        );
    });

    if(!isLoaded){
        return (
            <div id="mapLoading">Loading...</div>
        );
    }

    return (
        <GoogleMap 
        id="map" zoom={15} 
        center={mapCenter} options={mapOptions} 
        onLoad={onMapLoad} onClick={addNodeHandler}>
            {nodeArray}
        </GoogleMap>
    );
}


//custom component that acts like a label for a marker
class NodeVerlay extends Component{
     
    constructor(props){
        super();

        this.state = {
            hovered: false,
            clicked: props.node.active ? true: false
        };

        this.node = props.node;
        this.setHover = this.setHover.bind(this);
        this.setUnhover = this.setUnhover.bind(this);
        this.setClicked = this.setClicked.bind(this);
        this.setNodeTimeout = props.setNodeTimeout.bind(this);
        this.clearNodeTimeout = props.clearNodeTimeout.bind(this);
        this.clickNode = props.clickNode.bind(this);
    }

    setHover(){
        this.setState(prevState => ({
            ...prevState,
            hovered: true
        }));

        this.clearNodeTimeout(this.node);
    }

    setUnhover(){
        this.setState(prevState => ({
            ...prevState,
            hovered: false
        }));

        this.setNodeTimeout(this.node);
    }

    setClicked(){
        this.setState({
            hovered: true,
            clicked: true
        });

        this.clickNode(this.node);
    }

    render(){

        if(this.state.clicked && this.state.hovered){
            return (
                <div className="Node HoveredClicked" style={{backgroundColor: this.node.colour}}
                ref={ref => ref && window.google.maps.OverlayView.preventMapHitsFrom(ref)}
                onMouseLeave={this.setUnhover} onClick={this.setClicked}>
                    <b>{this.node.name}</b><br/>Click to remove
                </div>
            );

        } else if(this.state.clicked){
            return (
                <div className="Node Clicked" style={{backgroundColor: this.node.colour}}
                ref={ref => ref && window.google.maps.OverlayView.preventMapHitsFrom(ref)}
                onMouseOver={this.setHover} onClick={this.setClicked}>
                    <b>{this.node.name}</b>
                </div>
            );

        } else if(this.state.hovered){
            return (
                <div className="Node Hovered" style={{backgroundColor: this.node.colour}}
                ref={ref => ref && window.google.maps.OverlayView.preventMapHitsFrom(ref)}
                onMouseLeave={this.setUnhover} onClick={this.setClicked}>
                    <b>{this.node.name}</b><br/>Click to add
                </div>
            );

        } else {
            return (
                <div className="Node" 
                ref={ref => ref && window.google.maps.OverlayView.preventMapHitsFrom(ref)}
                onMouseOver={this.setHover} onClick={this.setClicked}>
                    <b>{this.node.name}</b>
                </div>
            );
        }
    }
}

export default BetterMap;