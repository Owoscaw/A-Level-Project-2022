import React, { useEffect, useState, useMemo, Component } from "react";
import { GoogleMap, useLoadScript } from "@react-google-maps/api";

import "../styles/prevSol.css";

function PrevSol({data, ...props}){

    const [ solution, setSolution ] = useState(null);
    const [ prevData, setData ] = useState([]);
    const [ startNode, setStartNode ] = useState({});
    const [ mapCenter, setCenter ] = useState({lat: 0, lng: 0});
    const [ mapZoom, setZoom ] = useState(3);
    const mapOptions = useMemo(() => ({
        disableDefaultUI: true,
        draggableCursor: "default",
        draggingCursor: "grabbing"
    }), []);

    const { isLoaded } = useLoadScript({
        googleMapsApiKey: "AIzaSyA4JxaRwAQ18Zvjyxy1CAkuSxKjGpGLzws"
    });

    useEffect(() => {
        setSolution(data);
        loadSolutions().then(response => {
            setData(response.data); 
            console.log(response);
            if(response.data.length > 0 && data !== null){
                console.log(response.data);
                const pathStart = response.data[0].nodes.filter(node => (node.name === data.startNode))[0]
                setStartNode(pathStart);
                setCenter({lat: pathStart.lat, lng: pathStart.lng});
                setZoom(15);
                console.log(mapCenter);
            }
        });

        return () => {
            setSolution(null);
            setData([]);
            setStartNode({});
            setCenter({lat: 0, lng: 0});
        }
    }, [data]);

    const clearSolution = () => {
        props.api("clear", {
            method: "GET",
            cache: "no-cache",
            headers: { 
            "Accept": "application/json",
            "Content-Type": "application/json"
            }
        });

        setZoom(3);
    }

    const loadSolutions = () => {
        return props.api("load", {
            method: "GET",
            cache: "no-cache",
            headers: { 
            "Accept": "application/json",
            "Content-Type": "application/json"
            }
        }).then(response => response.json());
    }

    const loadRoute = () => {

        if(data === null) return;

        let routeOptions = {
            unitSystem: window.google.maps.UnitSystem.METRIC,
            provideRouteAlternatives: false
        };
    }

    return (
        <div id="prevSolution">
            <div id="leftPage">
                <div id="solutionHeader" className="header">
                    Previous solutions:
                </div>
                <div id="solutionMenu">
                    <ul id="solutionList">
                        {
                            prevData.map(route => (
                                <Route data={route} selectHandler={loadRoute}/>
                            ))
                        }
                    </ul>
                </div>
                <div id="solutionFooter">
                    <input type="button" id="backButton" className="footerButton" value="Back" onClick={() => props.changeScreen("menu")}/>
                    <input type="button" id="clearButton" className="footerButton" value="Clear solutions" onClick={() => {
                        clearSolution();
                        loadSolutions().then(response => {
                            setData(response.data);   
                        });
                        }}/>
                </div>
            </div>

            <div id="rightPage">
                <div id="mapHeader" className={data === null ? "header" : "header activeHeader"}>
                    {data === null ? "No route selected" : "Route selected"}
                </div>
                <div id="mapContainer">
                        {
                            isLoaded ? <GoogleMap id="map" zoom={mapZoom} center={mapCenter}
                            options={mapOptions} onLoad={loadRoute}></GoogleMap> : <div id="mapLoading">Loading...</div>
                        }
                </div>
            </div>
        </div>
    );
}

class Route extends Component {

    constructor(props){
        super(props);

        this.state = structuredClone(props.data);

        this.selectHandler = props.selectHandler.bind(this);
    }

    render(){
        return (
        <li key={this.state.name}>
            <div className="routeDiv">
                <div className="routeName">
                    {this.state.name}
                </div>
                <div className="routeWeight">
                    {this.state.weight}
                </div>
                <div className="routeStart">
                    {this.state.startNode}
                </div>

            </div>
        </li>);
    }
}

export default PrevSol;