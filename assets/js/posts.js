/* ================================================================
   posts.js — single source of truth for all blog posts
   ================================================================
   This file is shared by index.html and category.html.

   TO ADD A NEW POST — add a new object to the top of this array.
   Fields:
     title    {string}  — post headline
     url      {string}  — path from site root, e.g. "posts/foo.html"
     date     {string}  — e.g. "March 22, 2026"
     tag      {string}  — category label (must match algos.html card tags)
     excerpt  {string}  — one or two sentence description
     image    {string}  — cover image path from site root (optional)
     featured {boolean} — set true on exactly one post
================================================================ */
var POSTS = [
  {
    title:    "Minimum Spanning Tree",
    url:      "posts/mst.html",
    date:     "April 25, 2017",
    tag:      "Graph Theory",
    excerpt:  "Minimum spanning tree spans all nodes at minimum aggregate cost. Essential for approximation algorithms, routing protocols, and real-time face verification.",
    image:    "images/mst.jpg",
    featured: true
  },
  {
    title:    "Community Detection: Introduction",
    url:      "posts/communitydetection.html",
    date:     "April 24, 2017",
    tag:      "Graph Theory",
    excerpt:  "A community is densely intra-connected and sparsely inter-connected. Community Detection is the process of finding such structures in a network.",
    image:    "images/communitydetection.jpg"
  },
  {
    title:    "Semantic Networks: Basics",
    url:      "posts/semanticnetworks.html",
    date:     "April 22, 2017",
    tag:      "AI",
    excerpt:  "Semantic networks are graphical representations of the interconnections between nodes — the backbone of knowledge representation in Artificial Intelligence.",
    image:    "images/semanticnets.jpg"
  },
  {
    title:    "Network Theory (Graph Theory)",
    url:      "posts/networktheory.html",
    date:     "April 18, 2017",
    tag:      "Graph Theory",
    excerpt:  "Graphs are sets of vertices connected by edges. This field underlies social networks, routing, compilers, and more.",
    image:    "images/graphtheory.jpg"
  },
  {
    title:    "Markov Chains: Basics",
    url:      "posts/markovchains.html",
    date:     "April 14, 2017",
    tag:      "Probability",
    excerpt:  "A Markov chain is a stochastic model where the probability of each event depends only on the state attained in the previous event.",
    image:    "images/markovchain.png"
  },
  {
    title:    "Speeding Up Linked Lists",
    url:      "posts/speedinguplinkedlist.html",
    date:     "April 11, 2017",
    tag:      "Data Structures",
    excerpt:  "Linked list is a fundamental data structure used in countless applications. Exploring techniques to optimize it for real-world performance.",
    image:    "images/speedlinked.jpg"
  },
  {
    title:    "Merge Sort",
    url:      "posts/mergesort.html",
    date:     "April 7, 2017",
    tag:      "Algorithms",
    excerpt:  "Merge sort uses the divide-and-conquer paradigm — breaking the problem into parts, sorting each, then merging the results back together.",
    image:    "images/mergesort.png"
  }
];
