import React from "react";
import {useState} from "react";

function NewNode(props){


    return (
        <li id={props.name}>
            <div className="NodeInList">
                <div className="NameDiv">{props.name}</div>
            </div>
        </li>
    );
}

export default NewNode;