import React, { useEffect, useState } from "react";

import "../styles/prevSol.css";

function PrevSol(props){

    const [ solution, setSolution ] = useState({});

    useEffect(() => {
        setSolution(props.data);

        return () => {
            setSolution({});
            props.changeData(null);
        }
    }, [props.data]);

    console.log(solution);

    return (
        <div>
            Test
            <input type="button" id="returnButton" value="click me" onClick={() => props.changeScreen("menu")}/>
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
    );
}

export default PrevSol;