import math

def dot(a, b):
    return sum(x * y for x, y in zip(a, b))

def cosine(a, b):
    """Cosine similarity: 1 means same direction, 0 means unrelated."""
    return dot(a, b) / (math.sqrt(dot(a, a)) * math.sqrt(dot(b, b)))

def search(query, items):
    """Item names with their scores, most similar first."""
    scored = [(name, cosine(query, vec)) for name, vec in items.items()]
    return sorted(scored, key=lambda pair: pair[1], reverse=True)

search([4, 1, 1], {
    "insulated winter coat": [5, 2, 2],
    "wool overcoat": [4, 4, 0],
    "rain shell": [1, 1, 5],
    "linen shirt": [0, 3, 0],
})  # coat 0.985, overcoat 0.833, shell 0.454, shirt 0.236
