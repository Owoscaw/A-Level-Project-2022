import React, { useCallback, useMemo, useRef, useState } from "react";
import { GoogleMap, useLoadScript, OverlayView } from "@react-google-maps/api";

import "../styles/betterMap.css";

const possibleIcons = ["markerIcon1.jpg", "markerIcon2.jpg", "markerIcon3.jpg"];
const googleColours = ["66, 133, 244", "234, 67, 53", "251, 188, 5", "52, 168, 83"];
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
        clickableIcons: false
    }), []);



    const addNodeHandler = (event) => {

        let newMarker = new window.google.maps.Marker({
            position: {lat: event.latLng.lat(), lng: event.latLng.lng()},
            map: mapRef.current,
            icon: {
                url: possibleIcons[Math.floor(Math.random()*3)],
                scaledSize: new window.google.maps.Size(50, 50)
            }
        });

        let newNode = {
            marker: newMarker,
            name: "Node " + nodeIndex.toString(),
            id: nodeIndex
        };

        //define this 
        // let newNode = new NodeView;
        nodeIndex ++;
        updateNodes(nodes.concat([newNode]));
        //props.addNode(newNode);
    };

    const activateNodeHandler = (node) => {
        props.activateNode(node);
    };


    if(!isLoaded){
        return (
            <div id="mapLoading">Loading...</div>
        );
    }

    return (
        <GoogleMap id="map" zoom={15} center={mapCenter} options={mapOptions} onLoad={onMapLoad} onClick={addNodeHandler}>
            {
                nodes.map((node) => {

                    let nodeDiv = <div className="Node"><b>{node.name}</b><br/>Click to add</div>;
                    let nodeColour = "rgba(" + googleColours[Math.floor(Math.random()*4)] + "0.5)";

                    return (
                        <OverlayView key={node.id} position={node.marker.position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET} onLoad={console.log("load")}>
                            {nodeDiv}
                        </OverlayView>
                    );
                })
            }
        </GoogleMap>
    );
}

// class NodeView extends OverlayView {


// }


export default BetterMap;