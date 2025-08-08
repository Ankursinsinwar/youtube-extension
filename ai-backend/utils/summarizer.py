from transformers import pipeline

summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")

def summarize_chunks(captions, chunk_size=6):
    summaries = []
    for i in range(0, len(captions), chunk_size):
        chunk = captions[i:i + chunk_size]
        text = " ".join([c["text"] for c in chunk])
        start_time = captions[i]["start"]
        print("text:",text)
        # summary_result = summarizer(text, max_length=20, min_length=10, do_sample=False)
        # summary_result = summarizer(text, max_length=len(text.split()) // 2, min_length=min(10, len(text.split()) // 2), do_sample=False)
        max_len = max(20, (len(text.split()) // 2))
        min_len = min(10, max_len)

        summary_result = summarizer(text, max_length=max_len, min_length=min_len, do_sample=False)

        print(summary_result)
        if summary_result:
            summaries.append({"summary": summary_result[0]["summary_text"], "start": start_time})
            print("summaries:",summaries)
        else:
            print(f"Warning: No summary generated for chunk starting at {start_time}")
    return summaries

# Example Usage (assuming 'captions' is a list of dictionaries like [{'text': '...', 'start': ...}])
# captions = [...]
# summaries = summarize_chunks(captions)
# print(summaries)