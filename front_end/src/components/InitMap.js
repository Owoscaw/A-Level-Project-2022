import React from "react";
import {useRef, useEffect} from "react";

function InitMap(props){
    const ref = useRef();


    useEffect(() => {
        new window.maps.Map(ref.current)
    });
}

export default InitMap;