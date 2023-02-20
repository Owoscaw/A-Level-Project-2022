import React, { useCallback, useState, useMemo, useRef, Component, Fragment, useEffect} from "react";
import { GoogleMap, Autocomplete, useLoadScript, OverlayView, Marker, MarkerClusterer } from "@react-google-maps/api";

import "../styles/betterMap.css";
import { ReactComponent as EditIcon } from "../styles/icons8-edit.svg";
import { ReactComponent as TrashIcon } from "../styles/icons8-trash.svg";

//defining constants for possible marker icons and colours
const possibleIcons = ["markerIcon1.jpg", "markerIcon2.jpg", "markerIcon3.jpg"];
const googleColours = ["23, 107, 239", "255, 62, 48", "247, 181, 41", "23, 156, 82"];

//used to keep track of currently occupied names on the map
let usedNames;

function BetterMap(props){


    const { isLoaded } = useLoadScript({
        googleMapsApiKey: "AIzaSyA4JxaRwAQ18Zvjyxy1CAkuSxKjGpGLzws",
        libraries: ["places"]
    });

    const autocompleteRef = useRef();
    const autoInputRef = useRef();

    //clears used names when component is removed
    useEffect(() => {
        usedNames = {};

        return () => {
            usedNames = undefined;
        }
    }, []); 

    const mapRef = useRef();
    const onMapLoad = useCallback((map) => (mapRef.current = map), []);

    //does not have to be redefined when reflows happen
    const [ mapCenter, setCenter ] = useState({ lat: 53.7, lng: -3.5});
    const [ mapZoom, setZoom ] = useState(5);
    const mapOptions = useMemo(() => ({
        disableDefaultUI: true,
        clickableIcons: false,
        draggableCursor: "default",
        draggingCursor: "grabbing",
        gestureHandling: "greedy"
    }), []);

    //configures the behaviour of nodes when the cluster
    const clusterOptions = useMemo(() => ({
        clusterClass: "nodeCluster",
        ignoreHidden: true,
        averageCenter: true,
        calculator: (markers, icons) => {

            console.log(markers, icons);
            return { text: markers.length + " nodes", index: 1 };
        },
        imageExtension: "jpg",
        imagePath: "markerIcon",
    }), []);


    
    
    //adds a new node with a marker wherever the map was clicked
    const addNodeHandler = (event, autocompleted) => {
        
        if(Object.keys(usedNames).length > 10){
            return;
        }
        
        //resetting node index
        let nodeIndex = 1;
        while(("Node " + nodeIndex.toString()) in usedNames){
            nodeIndex ++;
        }
        
        let newNodeColour = googleColours[Math.floor(Math.random()*googleColours.length)];
        let location;

        if(autocompleted){
            location = {
                lat: event.lat,
                lng: event.lng
            }
        } else {
            location = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng()
            }
        }

        //creating new node
        let newNode = {
            ...location,
            url: possibleIcons[Math.floor(Math.random()*3)],
            scaledSize: new window.google.maps.Size(50, 50),
            name: "Node " + nodeIndex.toString(),
            label: "Node " + nodeIndex.toString(),
            timeout: null,
            colour: newNodeColour
        };
        
        //re-rending with new node included
        usedNames[newNode.name] = true;
        props.setNodes(prevState => ([...prevState, newNode]));
    };



    const renameNodeHandler = (node, newName) => {
        
        //redefines node with new name, all previous attributes spread across it
        let renamedNode = {
            ...node,
            name: newName,
            label: newName
        };

        //marking the node's old name as availible and current name as unavailible
        delete usedNames[node.name];
        usedNames[newName] = true;

        //filters out the previous node, replacing it with our renamed node
        props.setNodes(prevState => prevState.map(entr => (entr.name === node.name ? renamedNode : entr)));
        return renamedNode;
    };
    

    const removeNodeHandler = (node) => {
        delete usedNames[node.name];
        props.setNodes(prevState => (prevState.filter(prevNode => prevNode.name !== node.name)));
    }

    const handlePlaceChange = () => {
        if(autocompleteRef.current !== null){
            console.log(autocompleteRef.current.getPlace());
            setCenter({ lat: autocompleteRef.current.getPlace().geometry.location.lat(), lng: autocompleteRef.current.getPlace().geometry.location.lng() });
            addNodeHandler({lat: autocompleteRef.current.getPlace().geometry.location.lat(), lng: autocompleteRef.current.getPlace().geometry.location.lng()}, true);
            setZoom(15);
        }
    }

    //loading screen
    if(!isLoaded){
        return (
            <div id="mapLoading">Loading...</div>
        );
    }

    return (
        <div id="betterMap-container">
            <div id="betterMap-Map-header">
                Map
            </div>
            <GoogleMap 
            id="betterMap" zoom={mapZoom} 
            center={mapCenter} options={mapOptions} 
            onLoad={onMapLoad} onClick={(event) => addNodeHandler(event, false)}>
                <Autocomplete onLoad={(Autocomplete) => {autocompleteRef.current = Autocomplete}}
                onPlaceChanged={() => handlePlaceChange()}>
                    <input type="text" placeholder="Enter Location..." id="betterMap-Autocomplete-input" onBlur={() => {autoInputRef.current.value = ""}} ref={autoInputRef}/>
                </Autocomplete>
                <MarkerClusterer options={clusterOptions}> 
                    {
                        (clusterer) => props.nodes.map(node => {
                            return (
                            <Fragment key={node.name}>
                                <Marker position={{lat: node.lat, lng: node.lng}} icon={{url: node.url, scaledSize: node.scaledSize}} 
                                clusterer={clusterer}>,
                                    <OverlayView position={{lat: node.lat, lng: node.lng}} 
                                    //map panel that recieves mouse DOM events
                                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                                        <NodeVerlay node={node} clickHandler={removeNodeHandler}/>
                                    </OverlayView>
                                </Marker>
                            </Fragment>
                            );
                        })
                    }
                </MarkerClusterer>
            </GoogleMap>

            <div id="betterMap-Menu-header">
                Node Menu
            </div>
            <div id="betterMap-menu">
                <ul id="betterMap-Menu-list">
                    {
                        props.nodes.map(node => (
                            <NodeMenuItem key={node.name} node={node} removeNodeHandler={removeNodeHandler} renameNodeHandler={renameNodeHandler}/>
                        ))
                    }
                </ul>
            </div>
        </div>
    );
}



class NodeMenuItem extends Component{

    constructor(props){
        super(props);

        this.node = props.node;

        //so we can access its content - avoides using state
        this.inputRef = React.createRef();
        this.removeNodeHandler = props.removeNodeHandler.bind(this);
        this.renameNodeHandler = props.renameNodeHandler.bind(this);
        this.inputHandler = this.inputHandler.bind(this);
    }


    inputHandler(name){

        //trimming whitespace and dissallowed characters
        let newName = name.trim().replace(/[&\/\\#,+()$~%'":*?<>{}]/g, '');
        if((newName in usedNames) || (newName.length === 0)){
            this.inputRef.current.value = this.node.name;
            return;
        }

        //managint the content of the input field
        this.inputRef.current.value = newName;
        this.renameNodeHandler(this.node, newName);
    }


    render(){

        return(
            <li>
                <div className="betterMap-Menu-node">
                    <div className="betterMap-Menu-Node-renameContainer">
                        <input type="text" className="betterMap-Menu-Node-rename" defaultValue={this.node.name} maxLength={30}
                        ref={this.inputRef} onBlur={() => this.inputHandler(this.inputRef.current.value)} onKeyDown={(event) => {
                            if(event.key === "Enter"){
                                this.inputRef.current.blur();
                            }
                        }}/>
                        <EditIcon onClick={() => this.inputRef.current.focus()}/>
                    </div>
                    <div className="betterMap-Menu-Node-latlng">
                        {`${this.node.lat.toFixed(4)}, ${this.node.lng.toFixed(4)}`}
                    </div>
                    <TrashIcon className="betterMap-Menu-Node-delete" onClick={() => this.removeNodeHandler(this.node)}/>
                </div>
            </li>
        );
    }
}


//node overlay haha
class NodeVerlay extends Component{
     
    constructor(props){
        super(props);

        this.state = {
            hovered: false
        };

        this.node = props.node;
        this.clickHandler = props.clickHandler.bind(this);
        this.setHover = this.setHover.bind(this);
        this.setUnhover = this.setUnhover.bind(this);
    }

    setHover(){
        this.setState({
            hovered: true
        });
    }

    setUnhover(){
        this.setState({
            hovered: false
        });
    }

    render(){

        return (
            <div className="Node"  key={this.node.name}
                style={{backgroundColor: "rgba(" + this.node.colour + ", 0.5)"}}
                ref={ref => ref && window.google.maps.OverlayView.preventMapHitsFrom(ref)}
                onMouseLeave={this.setUnhover} onMouseOver={this.setHover} onClick={() => this.clickHandler(this.node)}>
                <b>{this.node.name}</b>
                {
                    this.state.hovered ? <><br/>Click to remove</> : null
                }
            </div>
        );
    }
}

export default BetterMap;