from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer("paraphrase-MiniLM-L6-v2")

def search_similar_segments(captions, query, top_k=5):
    texts = [c["text"] for c in captions]
    embeddings = model.encode(texts, convert_to_tensor=True)
    query_embedding = model.encode(query, convert_to_tensor=True)

    hits = util.semantic_search(query_embedding, embeddings, top_k=top_k)[0]
    results = [
        {"text": texts[hit["corpus_id"]], "start": captions[hit["corpus_id"]]["start"]}
        for hit in hits
    ]
    return results
