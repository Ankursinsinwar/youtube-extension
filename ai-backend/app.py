from flask import Flask, request, jsonify
from utils.semantic_search import search_similar_segments
from utils.summarizer import summarize_chunks
from youtube_transcript_api import YouTubeTranscriptApi
from flask_cors import CORS
app = Flask(__name__)
CORS(app) 

@app.route("/search", methods=["POST"])
def search():
    data = request.get_json()
    print("data: ", data)
    captions = data.get("captions", [])
    print("cap:",captions)
    query = data.get("query", "")
    print("query: ", query)

    matches = search_similar_segments(captions, query)
    print(matches)
    print("matches: ", matches)
    return jsonify(matches)

@app.route("/summarize", methods=["POST"])
def summarize():
    data = request.get_json()
    captions = data.get("captions", [])
    print("cap:",captions)
    result = summarize_chunks(captions)
    return jsonify(result)


@app.route("/captions", methods=["POST"])
def get_captions():
    data = request.get_json()
    print("data:",data)
    video_id = data.get("video_id")
    # language = data.get("language", 'English') # Default to English

    if not video_id:
        return jsonify({"error": "Missing 'video_id' in the request"}), 400

    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
        # fetched_transcript = YouTubeTranscriptApi.list_transcripts(video_id)
        # for transcript in fetched_transcript:
        #     output = transcript.translate(language_code='en').fetch()
        #     print(output)

        # return jsonify(output.snippets)
        print(transcript)
        return jsonify(transcript)
    except Exception as e:
        print(f"Transcript error for video ID {video_id}: {e}")
        return jsonify([])



if __name__ == "__main__":
    app.run(debug=True)
