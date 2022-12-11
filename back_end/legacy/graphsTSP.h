#ifndef GRAPH_H
#define GRAPH_H

#include <iostream>
#include <string>
#include <map>
#include <iterator>
#include <vector>
#include <algorithm>
#include <iomanip>
#include <fstream>

struct arc;

struct path;

class Graph{
	public:
		std::map<std::string, std::map<std::string, int>> adjTable;
		std::map<std::string, std::map<std::string, int>>::iterator outerIterator;
		std::map<std::string, int>::iterator innerIterator;

		std::map<std::string, std::map<std::string, int>> distTable;
		std::map<std::string, std::map<std::string, std::string>> routeTable;

		bool floydsComplete;

		std::vector<std::string> allNodes;
		std::vector<arc> allArcs;
		int weight;

		Graph();

		void addNode(std::string nodeName);

		void removeNode(std::string nodeName);

		void addArc(arc arcName);

		void removeArc(arc arcName);

		bool traverseNode(std::string nodeName, std::map<std::string, bool> visitedNodes, std::string parentNodeName);

		bool containsCycle();

		bool isEulerian();

		bool isComplete();

		void calculateFloyds();

		path pathBetweenNodes(std::string node1, std::string node2);

		bool containsHamiltonianCycle();

		path findHamiltonianCycle(std::string startNode);

		void showGraph();
};

int findNode(std::vector<std::string> searchVector, std::string searchNode);

int findArc(std::vector<arc> searchVector, arc searchArc);

bool compareAdj(const std::tuple<int, std::string> &node1, const std::tuple<int, std::string> &node2);

bool compareArcs(const arc &arc1, const arc &arc2);

bool areAdjacent(Graph tempGraph, std::string node1, std::string node2);

Graph generateGraph(std::string networkJSON);

Graph findMST(Graph tempGraph);

Graph findRMST(Graph tempGraph, std::string nodeName);

arc createArc(int arcWeight, std::string node1, std::string node2);

bool isNodeSafe(Graph tempGraph, std::string path[], int nodeIterator, int index);

bool hamiltonianRecurrer(Graph tempGraph, std::string path[], int index);

#endif