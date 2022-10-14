#include "graphsTSP.h"

struct arc{
	std::string node1;
	std::string node2;
	int weight;

	//used in implimentation to search for arcs
	bool operator==(const arc& rhs) const{
		bool node1Match = (node1 == rhs.node1);
		bool node2Match = (node2 == rhs.node2);
		bool weightMatch = (weight == rhs.weight);

		return (node1Match && node2Match && weightMatch);
	}
};


struct path{
	std::vector<std::string> path;
	std::string startNode;
	std::string endNode;
	int pathWeight = 0;
	int pathSize = 0;
};


Graph::Graph(){
	weight = 0;
	floydsComplete = false;
	std::cout<<"\nGraph initialised";
}


//add a new node, called nodeName, to the graph
void Graph::addNode(std::string nodeName){
	//no duplicate nodes!!
	if(findNode(allNodes, nodeName) != -1){
		return;
	}

	adjTable.insert(make_pair(nodeName, std::map<std::string, int>()));
	allNodes.push_back(nodeName);

	//floyds algorithm will now need to be recalculated
	floydsComplete = false;
}


//remove an existing node, called nodeName, from the graph
void Graph::removeNode(std::string nodeName){

	adjTable.erase(std::string(nodeName));
	std::vector<std::string>::iterator nodeIndex = allNodes.begin();
	nodeIndex += findNode(allNodes, nodeName);
	allNodes.erase(nodeIndex);

	//again it will now be different
	floydsComplete = false;
}


//add a new connection from arcName.node1 to arcName.node2 with cost arcName.weight both ways
void Graph::addArc(arc arcName){

	if((arcName.node1 == arcName.node2) || (arcName.weight == 0)){
		//arc is invalid
		std::cout<<"ARC ERROR"<<std::endl;
		return;

	} else if(findArc(allArcs, arcName) == -1){

		//arc is new, so add a new entry to adjacency
		adjTable[arcName.node1].insert(make_pair(arcName.node2, arcName.weight));
		adjTable[arcName.node2].insert(make_pair(arcName.node1, arcName.weight));

		allArcs.push_back(arcName);
		weight = weight + arcName.weight;

		//this will change floyds solution, there is a new path
		floydsComplete = false;
		return;
	}
}


//remove an existing arc, arcName both ways
void Graph::removeArc(arc arcName){
	arc alternateArc = createArc(arcName.weight, arcName.node2, arcName.node1);

	if((arcName.node1 == arcName.node2) || (findArc(allArcs, arcName) == -1)){
		//invalid arc, or arc hasnt been added
		return;

	} else {

		allArcs.erase(allArcs.begin() + findArc(allArcs, arcName));
		weight = weight - arcName.weight;

		adjTable[arcName.node1].erase(arcName.node2);
		adjTable[arcName.node2].erase(arcName.node1);

		floydsComplete = false;
		return;
	}
}


//returns the index of a node in the vector allNodes
int findNode(std::vector<std::string> searchVector, std::string searchNode){
	auto searchIterator = find(searchVector.begin(), searchVector.end(), searchNode);

	if(searchIterator != searchVector.end()){
		int nodeIndex = searchIterator - searchVector.begin();
		return nodeIndex;
	} else{
		return -1;
	}
}


//returns the index of an arc in the vector allArcs
int findArc(std::vector<arc> searchVector, arc searchArc){

	//search for duplicates aswell
	arc alternateArc = createArc(searchArc.weight, searchArc.node2, searchArc.node1);
	auto searchIterator = std::find(searchVector.begin(), searchVector.end(), searchArc);
	auto alternateSearchIterator = std::find(searchVector.begin(), searchVector.end(), alternateArc);

	if(searchIterator != searchVector.end()){
		int arcIndex = searchIterator - searchVector.begin();
		return arcIndex;

	} else if(alternateSearchIterator != searchVector.end()){
		int alternateArcIndex = alternateSearchIterator - searchVector.begin();
		return alternateArcIndex;

	} else{
		return -1;
	}
}


//returns the result of comparing the weight of node1 relative to the parent node to node2
bool compareAdj(const std::tuple<int, std::string> &node1, const std::tuple<int, std::string> &node2){
	return std::get<0>(node1) < std::get<0>(node2);
}


//returns the result of comparing the weight of arc1 to the weight of arc2, used to sort arcs for kruskal's algorithm
bool compareArcs(const arc &arc1, const arc &arc2){
	return arc1.weight < arc2.weight;
}


//returns true if there is an arc between node1 and node2 in graph tempGraph, false if not
bool areAdjacent(Graph tempGraph, std::string node1, std::string node2){
	if(tempGraph.adjTable[node1].find(node2) != tempGraph.adjTable[node1].end()){
		return true;
	} else if(tempGraph.adjTable[node2].find(node1) != tempGraph.adjTable[node2].end()){
		return true;
	} else{
		return false;
	}
}


//used in containsCycle implimentation. This is the actual DFS part
bool Graph::traverseNode(std::string nodeName, std::map<std::string, bool> visitedNodes, std::string parentNodeName){
	visitedNodes[nodeName] = true;

	for(auto const& recursiveNodeIterator: adjTable[nodeName]){
		if(!visitedNodes[recursiveNodeIterator.first]){
			if(traverseNode(recursiveNodeIterator.first, visitedNodes, nodeName)){
				return true;
			}
		} else if(recursiveNodeIterator.first != parentNodeName){
			return true;
		}
	}
	return false;
}


//returns true if the graph contains a cycle, false otherwise. This uses DFS traversal, albiet a janky implimentation
bool Graph::containsCycle(){
	//creating mapped values of {nodes: node is visited?}
	std::map<std::string, bool> visitedNodes; //= new map<std::string, bool>;
	for(auto const& nodeIterator: allNodes){
		visitedNodes[nodeIterator] = false;
	}

	//iterate through every node that is not visited to see if its subgraph contains a cycle
	for(auto const& traverseNodeIterator: allNodes){
		if(!visitedNodes[traverseNodeIterator]){
			if(traverseNode(traverseNodeIterator, visitedNodes, "")){
				return true;
			}
		}
	}
	return false;
}


//determines if the graph is eulerian
bool Graph::isEulerian(){
	for(auto const& nodeIterator: allNodes){
		if(adjTable[nodeIterator].size() % 2 != 0){
			return false;
		}
	}
	return true;
}


//is graph complete
bool Graph::isComplete(){
	for(auto const& nodeIterator: allNodes){
		if(adjTable[nodeIterator].size() != (allNodes.size() - 1)){
			return false;
		}
	}
	return true;
}


//performs floyd's algorithm on a graph
void Graph::calculateFloyds(){

	std::map<int, arc> path;
	int sum = 0;

	//initialising distance and route tables
	for(auto const& columnIterator: allNodes){
		for(auto const& rowIterator: allNodes){

			//initialise the route table to:
			//  X A B C D E F
			//  A A B C D E F
			//  B A B C D E F
			//  C A B C D E F
			//  D A B C D E F
			//  E A B C D E F
			//  F A B C D E F

			if(areAdjacent(*this, columnIterator, rowIterator)){

				//connects adjacent nodes with their value in the graph's adjacency matrix
				distTable[columnIterator][rowIterator] = adjTable[columnIterator][rowIterator];
				routeTable[columnIterator][rowIterator] = rowIterator;

			} else if(columnIterator == rowIterator){
				
				//the diagonal of the distance table should be 0
				distTable[columnIterator][rowIterator] = 0;
				routeTable[columnIterator][rowIterator] = rowIterator;

			} else{
				//if there is no direct route between nodes, the distance is "infinite"
				distTable[columnIterator][rowIterator] = 9999999;

				//no direct path exists
				routeTable[rowIterator][columnIterator] = " ";
			}
		}
	}


	//performing floyd's algorithm
	for(auto const& iterationIterator: allNodes){

		//use each node in turn
		for(auto const& iterator1: allNodes){
			for(auto const& iterator2: allNodes){

				//choosing each cell in turn, if it is not in the current node's 
				//row or column
				if((iterationIterator != iterator1) && (iterationIterator != iterator2)){

					//sum of the current cell's cross section between current node
					sum = distTable[iterationIterator][iterator2] + distTable[iterator1][iterationIterator];
					if(sum < distTable[iterator1][iterator2]){
						distTable[iterator1][iterator2] = sum;
						routeTable[iterator1][iterator2] = routeTable[iterator1][iterationIterator];
					}
				}	
			}
		}
	}
	floydsComplete = true;
	std::cout<<"\nFloyd's algorithm completed"<<std::endl;
}


//returns the shortest path between two given nodes
path Graph::pathBetweenNodes(std::string node1, std::string node2){
	if(!floydsComplete){
		calculateFloyds();
	}	

	path tempPath;
	tempPath.startNode = node1;
	tempPath.endNode = node2;
	tempPath.pathWeight = distTable[node1][node2];

	if((node1 == node2) || (distTable[node1][node2] == 9999999) || (routeTable[node1][node2] == " ")){
		return tempPath;
	}

	//traversing the route table caluclated by floyds algorithm
	std::string currentNode = node1;
	tempPath.path.push_back(currentNode);
	while(currentNode != node2){
		currentNode = routeTable[currentNode][node2];
		tempPath.path.push_back(currentNode);
		tempPath.pathSize ++;
	}

	return tempPath;
}


//function to print the graph; this will only print a node if it has at least one weighted connection
void Graph::showGraph(){

	std::cout<<"\n\n======BEGIN GRAPH DISPLAY======\n\nTotal weight: "<<weight<<std::endl;
	for(outerIterator = adjTable.begin(); outerIterator != adjTable.end(); outerIterator++){
		std::cout<<"\nNode: "<<outerIterator->first<<std::endl;
		for(innerIterator = outerIterator->second.begin(); innerIterator != outerIterator->second.end(); innerIterator++){
			std::cout<<"> Arc: "<<innerIterator->first<<", Weight: "<<innerIterator->second<<std::endl;
		}
	}

	std::cout<<"\nALL NODES:"<<std::endl;
	for(auto const& nodeIterator: allNodes){
		std::cout<<nodeIterator<<std::endl;
	}
	std::cout<<"\nALL ARCS:"<<std::endl;
	for(auto const& arcIterator: allArcs){
		std::cout<<arcIterator.node1<<" --- "<<arcIterator.node2<<": "<<arcIterator.weight<<"\n";
	}


	if(floydsComplete){
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

	std::cout<<"\n\n======END GRAPH DISPLAY====\n\n";
}


//returns a MST of graph using kruskals algorithm
Graph findMST(Graph tempGraph){
	Graph MST; 
	Graph testMST;

	for(auto const& nodeIterator: tempGraph.allNodes){
		testMST.addNode(nodeIterator);
	}

	//creating vector of all arcs that could be included
	std::vector<arc> sortedArcsToBeAdded = tempGraph.allArcs;
	std::vector<std::string> nodesToBeAdded = tempGraph.allNodes;

	//sorting arcs according to weight
	sort(sortedArcsToBeAdded.begin(), sortedArcsToBeAdded.end(), compareArcs);

	//iterating through all the arcs that could be added
	for(auto const& arcIterator: sortedArcsToBeAdded){

		//add the arc
		testMST.addArc(arcIterator);

		//if adding the arc created a cycle, remove it
		if(testMST.containsCycle()){
			testMST.removeArc(arcIterator);
			continue;
		}

		if(findNode(MST.allNodes, arcIterator.node1) == -1){
			MST.addNode(arcIterator.node1);
		}
		if(findNode(MST.allNodes, arcIterator.node2) == -1){
			MST.addNode(arcIterator.node2);
		}
		MST.addArc(arcIterator);
	}

	return MST;
}


//returns a MST of a graph, but after removing a node, nodeName
Graph findRMST(Graph tempGraph, std::string nodeName){
	Graph RMST = tempGraph;

	RMST.removeNode(nodeName);

	//remove every arc connected to nodeName
	for(auto const& arcIterator: tempGraph.allArcs){
		if((arcIterator.node1 == nodeName) || (arcIterator.node2 == nodeName)){
			RMST.removeArc(arcIterator);
		}
	}
	
	return findMST(RMST);
}


//returns an arc struct with weight arcweight, connecting node1 and node2
arc createArc(int arcWeight, std::string node1, std::string node2){
	arc newArc;
	newArc.weight = arcWeight;
	newArc.node1 = node1;
	newArc.node2 = node2;

	return newArc;
}


bool Graph::containsHamiltonianCycle(){
	//initialise the hamiltonian cycle as an array
	std::string *path = new std::string[allNodes.size()]; 

	//setting the first element to an arbitrary point, hamiltonian cycles can start from any node
	path[0] = allNodes[0];
	//index 1 because we already set index 0
	if(!hamiltonianRecurrer(*this, path, 1)){
		//if no hamiltonian cycle is detected, there is no hamiltonian cycle
		return false;
	}
	//or is there?
	return true;
}


//used in hamiltonian cycle to check if the next node, nodeIterator, is safe to include
bool isNodeSafe(Graph tempGraph, std::string path[], int nodeIterator, int index){

	//if the previous node and the next are not adjacent, it is not safe
	if(!areAdjacent(tempGraph, path[index - 1], tempGraph.allNodes[nodeIterator])){
		return false;

	}

	//checking if the node is already in the list
	for(int nodeChecker = 0; nodeChecker < index; nodeChecker++){
		if(path[nodeChecker] == tempGraph.allNodes[nodeIterator]){
			return false;
		}
	}
	
	return true;
}


bool hamiltonianRecurrer(Graph tempGraph, std::string path[], int index){

	//size of path the same as amount of nodes
	if(index == tempGraph.allNodes.size()){

		//if the front is connected to the back, a hamiltonian path exists
		if(areAdjacent(tempGraph, path[tempGraph.allNodes.size() - 1], path[0])){
			return true;
		} else{
			//if there is no connection between these nodes, and every node has been included, a path does not exist
			return false;
		}
	}

	//going through each node in the graph, except the first one because we used that to start with
	for(int nodeIterator = 1; nodeIterator < tempGraph.allNodes.size(); nodeIterator++){
		if(isNodeSafe(tempGraph, path, nodeIterator, index)){
			//if it can be added safely, add this node at this index in the cycle
			path[index] = tempGraph.allNodes[nodeIterator];

			//connecting the other nodes through recursion
			if(hamiltonianRecurrer(tempGraph, path, index + 1)){
				return true;
			}
			//if the node does not follow a hamiltonian cycle, remove it
			path[index] = "";
		}
	}
	//no nodes can currently be added to the cycle, so return false
	return false;
}