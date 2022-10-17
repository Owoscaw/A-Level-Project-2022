import React, { useEffect, useState } from "react";

import "../styles/prevSol.css";

function PrevSol(props){

    const [ solution, setSolution ] = useState(null);

    useEffect(() => {
        setSolution(props.data);

        return () => {
            setSolution(null);
            props.changeData(null);
        }
    }, [props.data]);

    console.log(solution);

    return (
        <div id="prevSolution">
            <div id="leftPage">
                <div id="solutionHeader">
                    Header
                </div>
                <div id="solutionMenu">
                    <input type="button" value="clear" onClick={() => props.clearSolution({
                        method: "POST",
                        cache: "no-cache",
                        headers: { 
                        "Accept": "application/json",
                        "Content-Type": "application/json"
                        },
                        body: JSON.stringify({})
                    })}/>
                </div>
                <div id="solutionFooter">
                    <input type="button" id="backButton" value="Back" onClick={() => props.changeScreen("menu")}/>
                </div>
            </div>

            <div id="rightPage">
                <div id="mapHeader">
                    {props.data === null ? "No route selected" : props.data.name}
                </div>
                <div id="mapContainer">

                </div>
            </div>
        </div>
    );
}

export default PrevSol;