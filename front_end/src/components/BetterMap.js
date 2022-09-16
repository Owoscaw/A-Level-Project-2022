import React, { useCallback, useMemo, useRef, useState, Component, Fragment} from "react";
import { GoogleMap, useLoadScript, OverlayView, Marker } from "@react-google-maps/api";

import "../styles/betterMap.css";

const possibleIcons = ["markerIcon1.jpg", "markerIcon2.jpg", "markerIcon3.jpg"];
const googleColours = ["23, 107, 239", "255, 62, 48", "247, 181, 41", "23, 156, 82"];
let nodeIndex = 1;

function BetterMap(props){

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: "AIzaSyA4JxaRwAQ18Zvjyxy1CAkuSxKjGpGLzws"
    });

    const mapRef = useRef();
    const [ nodes, updateNodes ] = useState([]);
    const onMapLoad = useCallback((map) => (mapRef.current = map), []);
    const mapCenter = useMemo(() => ({lat: 52.4, lng: 0}), []);
    const mapOptions = useMemo(() => ({
        disableDefaultUI: true,
        clickableIcons: false,
        draggableCursor: "pointer",
        draggingCursor: "move"
    }), []);


    const deleteNode = (node) => {
        console.log("del");
        updateNodes(currentState => currentState.filter(entry => {
            return entry.id !== node.id;
        }));
    };

    const realiseIndex = () => {
        for(let i = 0; i < nodes.length; i++){
            let currentNode = nodes[i];

        }
    };

    const setNodeTimeout = (node) => {
        if(node.timeout != null){
            clearTimeout(node.timeout);
        }
        node.timeout = setTimeout(deleteNode, 2000, node);
        console.log("timeout set");
    };

    const clearNodeTimeout = (node) => {
        if(node.timeout != null){
            clearTimeout(node.timeout);
            node.timeout = null;
        }
        console.log("timeout clear");
    }

    const addNodeHandler = (event) => {

        let newMarkerInfo = {
            position: {lat: event.latLng.lat(), lng: event.latLng.lng()},
            icon: {
                url: possibleIcons[Math.floor(Math.random()*3)],
                scaledSize: new window.google.maps.Size(50, 50)
            },
            mouseOver: false
        };

        let newNode = {
            marker: newMarkerInfo,
            name: "Node " + nodeIndex.toString(),
            id: nodeIndex,
            timeout: null
        };

        nodeIndex ++;
        updateNodes([...nodes, newNode]);
    };


    let nodeArray = nodes.map(node => {

        let currentColour = "rgba(" + googleColours[Math.floor(Math.random()*4)] + ", 0.5)";
        
        return (
            <Fragment key={`${node.name}Fragment`}>
                <Marker key={`${node.name}Marker`} position={node.marker.position} icon={node.marker.icon}
                onMouseOver={() => {clearNodeTimeout(node);}} 
                onMouseOut={() => {setNodeTimeout(node);}}
                onLoad={() => {setNodeTimeout(node);}}/>,
                <OverlayView key={`${node.name}Overlay`} position={node.marker.position} 
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                    <NodeVerlay node={node} colour={currentColour} 
                    setNodeTimeout={setNodeTimeout} clearNodeTimeout={clearNodeTimeout}/>
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



class NodeVerlay extends Component{
     
    constructor(props){
        super();

        this.state = {
            hovered: false
        };

        this.colour = props.colour;
        this.node = props.node;
        this.setHover = this.setHover.bind(this);
        this.setUnhover = this.setUnhover.bind(this);
        this.setNodeTimeout = props.setNodeTimeout.bind(this);
        this.clearNodeTimeout = props.clearNodeTimeout.bind(this);
    }

    setHover(){
        this.setState({
            hovered: true
        });

        this.clearNodeTimeout(this.node);
    }

    setUnhover(){
        this.setState({
            hovered: false
        });

        this.setNodeTimeout(this.node);
    }

    render(){

        if(this.state.hovered){
            return (
                <div className="HoveredNode" style={{backgroundColor: this.colour}}
                ref={ref => ref && window.google.maps.OverlayView.preventMapHitsFrom(ref)}
                onMouseLeave={this.setUnhover}>
                    <b>{this.node.name}</b><br/>Click to add
                </div>
            );
        }

        return (
            <div className="Node" 
            ref={ref => ref && window.google.maps.OverlayView.preventMapHitsFrom(ref)}
            onMouseOver={this.setHover}>
                <b>{this.node.name}</b>
            </div>
        );
    }
}

export default BetterMap;