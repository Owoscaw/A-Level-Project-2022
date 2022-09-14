import React, { useCallback, useMemo, useRef, useState } from "react";
import { GoogleMap, useLoadScript, OverlayView } from "@react-google-maps/api";

import "../styles/newSol.css";

const possibleIcons = ["markerIcon1.jpg", "markerIcon2.jpg", "markerIcon3.jpg"];
let nodeIndex = 1;

function BetterMap(props){

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: "AIzaSyA4JxaRwAQ18Zvjyxy1CAkuSxKjGpGLzws"
    });

    const mapRef = useRef();
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

        let newNode = new NodeView("Node " + nodeIndex.toString(), newMarker, mapRef);

        props.addNode(newNode);
        nodeIndex ++;
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
        </GoogleMap>
    );
}

class NodeView extends OverlayView {

    constructor(name, marker, mapRef){
        super();

        this.name = name;
        this.marker = marker;
        this.map = mapRef.current;
    }

    onAdd(){

        let nodeJSX = <div className="Node">{this.name}</div>;

        this.timer = setTimeout(() => {
            console.log("deleted!");
        }, 2000);

        window.google.maps.OverlayView.preventMapHitsFrom(nodeJSX);
        this.getPanes().overlayMouseTarget.appendChild(nodeJSX);
        console.log("added");
    }

    draw(){
        const overlayProjection = this.getProjection();
        const centre = overlayProjection.fromLatLngToDivPixel(this.marker.position);
    }

}


export default BetterMap;