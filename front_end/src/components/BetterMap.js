import React, { useCallback, useMemo, useRef, useState, Component, Fragment, useEffect} from "react";
import { GoogleMap, useLoadScript, OverlayView, Marker, MarkerClusterer } from "@react-google-maps/api";

import "../styles/betterMap.css";

const possibleIcons = ["markerIcon1.jpg", "markerIcon2.jpg", "markerIcon3.jpg"];
let usedNames;

function BetterMap(props){

    useEffect(() => {
        usedNames = {};
        return () => {
            usedNames = undefined;
        }
    }, []);

    const { isLoaded } = useLoadScript({

        //dont look!!!
        googleMapsApiKey: "AIzaSyA4JxaRwAQ18Zvjyxy1CAkuSxKjGpGLzws"
    });
 
    //references and memos to avoid re-rendering map
    const mapRef = useRef();
    const [ nodes, updateNodes ] = useState([]);
    const [ googleColours, setColours ] = useState(["23, 107, 239", "255, 62, 48", "247, 181, 41", "23, 156, 82"]);
    const [ prevColour, setPrevColour ] = useState();
    const onMapLoad = useCallback((map) => (mapRef.current = map), []);
    const mapCenter = useMemo(() => ({lat: 52.4, lng: 0}), []);
    const mapOptions = useMemo(() => ({
        disableDefaultUI: true,
        clickableIcons: false,
        draggableCursor: "default",
        draggingCursor: "grabbing",
        gestureHandling: "greedy"
    }), []);
    const clusterOptions = useMemo(() => ({
        clusterClass: "nodeCluster",
        ignoreHidden: true,
        averageCenter: true,
        calculator: (markers, icons) => {

            console.log(markers);
            return { text: markers.length + " nodes", index: 1 };
        },
        imageExtension: "jpg",
        imagePath: "markerIcon",
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
        
        let renamedNode = {
            ...node,
            name: newName,
            label: newName
        };

        delete usedNames[node.name];
        usedNames[newName] = true;

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

        if(Object.keys(usedNames).length > 10){
            return;
        }

        //resetting node index
        let nodeIndex = 1;
        while(("Node " + nodeIndex.toString()) in usedNames){
            nodeIndex ++;
        }

        let newNodeColour = googleColours[Math.floor(Math.random()*googleColours.length)];
        setColours(prevState => {
            if(typeof prevColour === "undefined"){
                return prevState.filter(colour => colour !== newNodeColour);
            } else {
                return [...prevState.filter(colour => colour !== newNodeColour), prevColour];
            }
        });
        setPrevColour(newNodeColour);

        //creating new node
        let newNode = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng(),
            url: possibleIcons[Math.floor(Math.random()*3)],
            scaledSize: new window.google.maps.Size(50, 50),
            name: "Node " + nodeIndex.toString(),
            label: "Node " + nodeIndex.toString(),
            timeout: null,
            colour: newNodeColour,
            active: false
        };

        //re-rending with new node included
        usedNames[newNode.name] = true;
        updateNodes(prevState => ([...prevState, newNode]));
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

    if(!isLoaded){
        return (
            <div id="mapLoading">Loading...</div>
        );
    }

    return (
        <GoogleMap 
        id="betterMap" zoom={15} 
        center={mapCenter} options={mapOptions} 
        onLoad={onMapLoad} onClick={addNodeHandler}>
            <MarkerClusterer options={clusterOptions}> 
                {
                    (clusterer) => nodes.map(node => {

                        console.log(clusterer);

                        return (
                        <Fragment key={node.name}>
                            <Marker position={{lat: node.lat, lng: node.lng}} icon={{url: node.url, scaledSize: node.scaledSize}} 
                            onMouseOver={() => {clearNodeTimeout(node);}} 
                            onMouseOut={() => {setNodeTimeout(node);}}
                            onLoad={() => {setNodeTimeout(node);}}
                            clusterer={clusterer}>,
                                <OverlayView position={{lat: node.lat, lng: node.lng}} 
                                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
                                    <NodeVerlay node={node} 
                                    setNodeTimeout={setNodeTimeout} clearNodeTimeout={clearNodeTimeout}
                                    clickNode={nodeClickHandler}/>
                                </OverlayView>
                            </Marker>
                        </Fragment>
                        );
                    })
                }
            </MarkerClusterer>
        </GoogleMap>
    );
}


//custom component that acts like a label for a marker
class NodeVerlay extends Component{
     
    constructor(props){
        super();

        this.state = {
            hovered: false,
            clicked: props.node.active
        };

        this.node = props.node;
        this.setHover = this.setHover.bind(this);
        this.setUnhover = this.setUnhover.bind(this);
        this.setClicked = this.setClicked.bind(this);
        this.setNodeTimeout = props.setNodeTimeout.bind(this);
        this.clearNodeTimeout = props.clearNodeTimeout.bind(this);
        this.clickNode = props.clickNode.bind(this);
    }


    //changing style of node based on hover and activeness
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

        let className = "Node";

        if(this.state.clicked && this.state.hovered){
            className += " HoveredClicked";
        } else if (this.state.clicked){
            className += " Clicked";
        } else if (this.state.hovered){
            className += " Hovered";
        }


        return (
            <div className={className} 
                style={{backgroundColor: "rgba(" + this.node.colour + ", 0.5)"}}
                ref={ref => ref && window.google.maps.OverlayView.preventMapHitsFrom(ref)}
                onMouseLeave={this.setUnhover} onMouseOver={this.setHover} onClick={this.setClicked}>
                <b>{this.node.name}</b>
                {
                    this.state.clicked ? (this.state.hovered ? <><br/>Click to remove</> : <></>) : (this.state.hovered ? <><br/>Click to add</> : <></>)
                }
            </div>
        );
    }
}

export default BetterMap;