#ifndef BOUND_H
#define BOUND_H

#include <iostream>
#include <string>
#include <map>
#include <bits/stdc++.h> 
#include <iterator>
#include <vector>
#include <algorithm>
#include <iomanip>

#include "graphsTSP.h"
#include "graphsTSP.cpp"

class Bound: public Graph{
	public:
		bool isOptimal;

		Bound(const Graph& parentGraph);

		Bound();

		path findPath(std::string startNode);

		void calculateLowerBound();

		void calculateUpperBound();

};

bool compareGraphs(const Graph &graph1, const Graph &graph2);

Bound solve(Graph tempGraph);

#endif