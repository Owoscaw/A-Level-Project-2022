#include "TSPsolver.h"


//constructor for graph class
Graph::Graph(){
    floydComplete = false;
    optimal = false;
    weight = 0;
}


//constructor for arc class
Arc::Arc(int Iweight = 0, std::string Inode1 = "", std::string Inode2 = ""){
    node1 = Inode1;
    node2 = Inode2;
    weight = Iweight;
}


//constructor for path class
Path::Path(std::vector<std::string> Isequence = {""}){
    nodeSequence = Isequence;
    startNode = "";
    endNode = "";
    pathWeight = 0;
}


//adds a node to the adjacency matrix, if it is unique
void Graph::addNode(std::string nodeName){

    //node must be unique
    if(findNode(nodeName, allNodes) != -1){
        return;
    }

    adjMatrix.insert({ nodeName, std::map<std::string, int>() });
    allNodes.push_back(nodeName);
    floydComplete = false;
}


//removes a node from the graph, if it is included
void Graph::removeNode(std::string nodeName){

    int nodeCount = findNode(nodeName, allNodes);
    if(nodeCount == -1){
        return;
    }

    adjMatrix.erase(nodeName);
    allNodes.erase(allNodes.begin() + nodeCount);

    //removing all arcs associated with nodeName
    for(Arc arcIterator: allArcs){
        if((arcIterator.node1 == nodeName) || (arcIterator.node2 == nodeName)){
            removeArc(arcIterator);
        }
    }

    floydComplete = false;
}


//add a connection (Arc) between two nodes
void Graph::addArc(Arc arcName){
    if(findArc(arcName, allArcs) == -1){

        //creating entries in the adjacency matrix
        adjMatrix[arcName.node1][arcName.node2] = arcName.weight;
        adjMatrix[arcName.node2][arcName.node1] = arcName.weight;

        allArcs.push_back(arcName);
        weight += arcName.weight;

        floydComplete = false;
    } 
}



void Graph::removeArc(Arc arcName){
    int arcCount = findArc(arcName, allArcs);

    if(arcCount == -1){
        return;
    } else {

        adjMatrix[arcName.node1].erase(arcName.node2);
        adjMatrix[arcName.node2].erase(arcName.node1);

        allArcs.erase(allArcs.begin() + arcCount);
        
        floydComplete = false;
    } 
}



bool Graph::areAdjacent(std::string node1, std::string node2){
    return ((adjMatrix[node1].find(node2) != adjMatrix[node1].end()) || (adjMatrix[node2].find(node1) != adjMatrix[node2].end()));
}


//the Floyd-Warshall algorithm
void Graph::calculateFloyds(){
    if(floydComplete){
        return;
    }

    //initialising the distance and route matricies
    for(auto const& columnIterator: allNodes){
        for(auto const& rowIterator: allNodes){

            if(areAdjacent(columnIterator, rowIterator)){
                distTable[columnIterator][rowIterator] = adjMatrix[columnIterator][rowIterator];
                routeTable[columnIterator][rowIterator] = rowIterator;

            } else if(columnIterator == rowIterator){
                distTable[columnIterator][rowIterator] = 0;
                routeTable[columnIterator][rowIterator] = rowIterator;

            } else {
                distTable[columnIterator][rowIterator] = 9999999;
                routeTable[columnIterator][rowIterator] ="";
            }
        }
    }

    //performing the algorithm
    for(auto const& floydIterator: allNodes){
        for(auto const& I1: allNodes){
            for(auto const& I2: allNodes){
                if((floydIterator != I1) && (floydIterator != I2)){

                    int sum = distTable[floydIterator][I2] + distTable[I1][floydIterator];
                    if(sum < distTable[I1][I2]){   
                        distTable[I1][I2] = sum;
                        routeTable[I1][I2] = routeTable[I1][floydIterator];
                    }
                }
            }
        }
    }

    floydComplete = true;
}


//finds the shortest path between nodes using Floyd's algorithm
Path Graph::pathBetweenNodes(std::string node1, std::string node2){

    if(!floydComplete){
        calculateFloyds();
    }

    //initialising a new path with basic information about this path
    Path newPath;
    newPath.startNode = node1;
    newPath.endNode = node2;
    newPath.pathWeight = distTable[node1][node2];
    newPath.nodeSequence.insert(newPath.nodeSequence.begin(), node1);
    newPath.nodeSequence.push_back(node2);

    //routeTable lookup is not needed if the shortest route is direct
    if(areAdjacent(node1, node2) && (adjMatrix[node1][node2] <= distTable[node1][node2])){
        newPath.pathWeight += adjMatrix[node1][node2];
        return newPath;
    }

    //finding next node that needs to be travelled to, and how to get there with recursion
    std::string nextNode = routeTable[node1][node2];
    Path AB = pathBetweenNodes(node1, nextNode);
    Path BC = pathBetweenNodes(nextNode, node2);


    //splicing these two "sub-paths" together
    for(int i = 1; i < AB.nodeSequence.size() - 1; i++){
        newPath.nodeSequence[i] = AB.nodeSequence[i + 1];
    }

    for(int j = AB.nodeSequence.size(); j < BC.nodeSequence.size() - 1; j++){
        newPath.nodeSequence[j] = BC.nodeSequence[j + 1];
    }

    return newPath;
}


//for debugging
void Graph::showGraph(){

    std::cout<<"========================="<<std::endl;

    for(auto const& N1: adjMatrix){
        std::cout<<"---> "<<N1.first<<":"<<std::endl;
        for(auto const& N2: N1.second){
            std::cout<<"-> "<<N2.first<<": "<<N2.second<<std::endl;
        }
    }

    std::cout<<"===== NODES ====="<<std::endl;
    for(auto const& nodeIterator: allNodes){
        std::cout<<nodeIterator<<std::endl;
    }

    std::cout<<"===== ARCS ====="<<std::endl;
    for(auto const& arcIterator: allArcs){
        std::cout<<arcIterator.node1<<" --- "<<arcIterator.node2<<": "<<arcIterator.weight<<std::endl;
    }

    if(floydComplete){
		std::string barrier(15*(allNodes.size() + 1), 95);

		std::cout<<"\nDISTANCE MATRIX:\n";
		std::cout<<std::setw(15)<<std::left<<"               ";
		for(auto const& header1: allNodes){
			std::cout<<std::setw(15)<<std::left<<header1;
		}
		std::cout<<"\n"<<barrier<<std::endl;
		for(auto const& map1: allNodes){
			std::cout<<std::setw(15)<<map1<<"|";
			for(auto const& map2: allNodes){
				std::cout<<std::left<<std::setw(15)<<distTable[map1][map2];
			}
			std::cout<<std::endl;
		}

	
		std::cout<<"\nROUTE MATRIX:\n";
		std::cout<<std::setw(15)<<"               ";
		for(auto const& header2: allNodes){
			std::cout<<std::setw(15)<<header2;
		}
		
		std::cout<<"\n"<<barrier<<std::endl;
		for(auto const& map3: allNodes){
			std::cout<<std::setw(15)<<map3<<"|";
			for(auto const& map4: allNodes){
				std::cout<<std::left<<std::setw(15)<<routeTable[map3][map4];
			}
			std::cout<<std::endl;
		}
	}

    std::cout<<"========================="<<std::endl;
}


//converts a sequence of nodes to a sequence of arcs
void Path::arcify(std::map<std::string, std::map<std::string, int>> adjMatrix){

    if(nodeSequence.size() < 2){
        return;
    }

    for(int i = 0; i < nodeSequence.size() - 1; i++){
        std::string fromNode = nodeSequence[i];
        std::string toNode = nodeSequence[i + 1];
        int arcWeight = adjMatrix[fromNode][toNode];
        pathWeight += arcWeight;
        Arc newArc = Arc(arcWeight, fromNode, toNode);
        arcSequence.push_back(newArc);
    }
}


//utility function for finding the index of a node in a vector of nodes
int findNode(std::string nodeName, std::vector<std::string> searchVector){
    int nodeIndex = 0;
    for(std::string nodeIterator: searchVector){
        if(nodeIterator == nodeName){
            return nodeIndex;
        } else {
            nodeIndex ++;
        }
    }
    return -1;
}


//utility function for finding the index of an arc in a vector of arcs
int findArc(Arc arcName, std::vector<Arc> searchVector){
    int arcIndex = 0;
    for(Arc arcIterator: searchVector){
        if(arcIterator == arcName){
            return arcIndex;
        } else {
            arcIndex ++;
        }
    }
    return -1;
}



Path Graph::findHamiltonianCycle(std::string startNode){

    Path newPath = Path({ startNode });
    newPath.startNode = startNode;
    newPath.endNode = startNode;

    std::vector<std::string> unvisitedNodes = allNodes;
    unvisitedNodes.erase(unvisitedNodes.begin() + findNode(startNode, unvisitedNodes));
    std::string currentNode = startNode;

    while(!unvisitedNodes.empty()){

        std::vector<Arc> possibleArcs;
        for(std::pair<std::string, int> adjIterator: adjMatrix[currentNode]){
            int nodeIndex = findNode(adjIterator.first, unvisitedNodes);
            if((nodeIndex != -1) && (adjIterator.second != 0)){
                Arc possibleArc = Arc(adjIterator.second, currentNode, adjIterator.first);
                possibleArcs.push_back(possibleArc);
            }
        }

        if(possibleArcs.empty()){
            newPath.pathWeight = -1;
            return newPath;
        }

        std::sort(possibleArcs.begin(), possibleArcs.end());
        newPath.nodeSequence.push_back(possibleArcs[0].node2);
        newPath.arcSequence.push_back(possibleArcs[0]);
        newPath.pathWeight += possibleArcs[0].weight;

        std::cout<<possibleArcs[0].node1<<"---"<<possibleArcs[0].node2<<": "<<possibleArcs[0].weight<<std::endl;
        currentNode = possibleArcs[0].node2;
        unvisitedNodes.erase(unvisitedNodes.begin() + findNode(currentNode, unvisitedNodes));
    }
    newPath.nodeSequence.push_back(startNode);
    newPath.pathWeight += adjMatrix[startNode][currentNode];
    std::cout<<startNode<<"---"<<currentNode<<": "<<adjMatrix[startNode][currentNode]<<std::endl;

    return newPath;
}


Graph Graph::getUpperBound(){

    if(!floydComplete){
        calculateFloyds();
    }   

    std::vector<Graph> possibleBounds;

    for(std::string boundIterator: allNodes){

        //performing nearest neighbour algorithm
        Graph NNGraph;
        std::vector<std::string> bannedNodes;
        
        NNGraph.addNode(boundIterator);
        bannedNodes.push_back(boundIterator);
        std::string currentNode = boundIterator;

        while(bannedNodes.size() != allNodes.size()){

            //finding shortest possible arcs that dont connect to previously added nodes
            std::vector<Arc> possibleArcs;
            for(std::pair<std::string, int> mapIterator: adjMatrix[currentNode]){
                if(findNode(mapIterator.first, bannedNodes) == -1){
                    Arc newArc = Arc(mapIterator.second, mapIterator.first, currentNode);
                    possibleArcs.push_back(newArc);
                }
            }
            std::sort(possibleArcs.begin(), possibleArcs.end());

            currentNode = possibleArcs[0].node1;
            bannedNodes.push_back(currentNode);
            NNGraph.addNode(currentNode);
            NNGraph.addArc(possibleArcs[0]);
        }

        //returning to the starting node
        Arc returnArc = Arc(adjMatrix[currentNode][boundIterator], currentNode, boundIterator);
        NNGraph.addArc(returnArc);

        possibleBounds.push_back(NNGraph);
    }

    std::sort(possibleBounds.begin(), possibleBounds.end());

    return possibleBounds[0];
}



int main(){

    Graph solGraph;

    //loading data.json
	std::ifstream jsonFile("data.json", std::ifstream::binary);
	Json::Value solJson;
	jsonFile >> solJson;

	Json::Value solNodes = solJson["nodes"];
	Json::Value solArcs = solJson["arcs"];
    Json::Value durationTable = solJson["durationTable"];
	std::string startNode = solJson["startNode"].asString();

    //adding nodes from data.json 
    for(int i = 0; i < solNodes.size(); i++){
		std::string currentNode = solNodes[i].asString();
		solGraph.addNode(currentNode);
	}

    //adding arcs from data.json
    for(int j = 0; j < solArcs.size(); j++){
        Json::Value currentArc = solArcs[j];
        int currentArcWeight = currentArc["weight"].asInt();
		std::string solNode1 = currentArc["node1"].asString();
		std::string solNode2 = currentArc["node2"].asString();

        Arc newSolArc = Arc(currentArcWeight, solNode1, solNode2);
        solGraph.addArc(newSolArc);
    }

    //Testing:

    // solGraph.calculateFloyds();

    // Arc testArc = Arc(solGraph.adjMatrix["Node 1"]["Node 5"], "Node 1", "Node 5");
    // solGraph.removeArc(testArc);
    // Path testPath = solGraph.pathBetweenNodes("Node 1", "Node 5");

    // for(int k = 0; k < testPath.nodeSequence.size(); k++){
    //     std::cout<<testPath.nodeSequence[k]<<std::endl;
    // }

    //an upper bound is always a viable solution
    Graph solvedGraph = solGraph.getUpperBound();
    solvedGraph.calculateFloyds();
    solvedGraph.showGraph();
    Path solPath = solvedGraph.findHamiltonianCycle(startNode);

    if(solPath.pathWeight != -1){

        std::cout<<"solution found"<<std::endl;
        Json::Value path;
        int pathIndex = 0;
        int durationInSeconds = 0;

        for(std::string pathIterator: solPath.nodeSequence){
            path[pathIndex] = pathIterator;
            pathIndex ++;
        }

        for(int i = 0; i < pathIndex - 1; i++){
            durationInSeconds += durationTable[path[i].asString()][path[i + 1].asString()].asInt();
        }

        solJson["path"] = path;
        solJson["weight"] = solPath.pathWeight;
        solJson["duration"] = durationInSeconds;
    } else {
        solJson["path"] = "not found";
    }

    Json::StreamWriterBuilder builder;
	builder["commentStyle"] = "None";
	builder["indentation"] = "	";

	std::unique_ptr<Json::StreamWriter> writer(builder.newStreamWriter());
	std::ofstream outputFileStream("data.json");
	writer -> write(solJson, &outputFileStream);

    return 0;
}