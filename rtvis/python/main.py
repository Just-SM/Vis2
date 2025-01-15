from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from collections import Counter
import math
import numpy as np
import umap
import gensim.downloader as api
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from tqdm import tqdm
from sklearn.preprocessing import MinMaxScaler
from sklearn.feature_extraction.text import TfidfVectorizer
import uvicorn

from fastapi.middleware.cors import CORSMiddleware

# ------------------------------------------------------------------------------
# Initialization and Configuration
# ------------------------------------------------------------------------------

# Download required NLTK datasets
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')
nltk.download('wordnet')
nltk.download('stopwords')

app = FastAPI(title="Custom Embeddings API", version="1.0")

# Define allowed origins for CORS
origins = [
    "http://localhost:3000/*",
]

# Apply CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# Data Models
# ------------------------------------------------------------------------------

class EmbeddingRequest(BaseModel):
    text: str

class TermData(BaseModel):
    term: str
    x: float
    y: float
    group: int
    score: float

# ------------------------------------------------------------------------------
# Utility Functions
# ------------------------------------------------------------------------------

def tokenize_and_filter(text_corpus: List[str]) -> List[List[str]]:
    """
    Processes the text corpus by tokenizing, POS tagging, lemmatizing,
    and filtering out unwanted words based on stopwords and POS tags.
    """
    lemmatizer = WordNetLemmatizer()
    stop_words = set(stopwords.words('english'))
    valid_tags = {"JJ", "JJR", "JJS", "NN", "NNS", "NNP", "NNPS"}

    processed_corpus = []
    for sentence in tqdm(text_corpus, desc="Processing sentences"):
        tokens = []
        words = nltk.word_tokenize(sentence.lower())
        pos_tags = nltk.pos_tag(words)

        for word, tag in pos_tags:
            lemma = lemmatizer.lemmatize(word)
            if lemma not in stop_words and lemma.isalpha() and tag in valid_tags:
                tokens.append(lemma)

        print(f"Tokens for sentence: {tokens}")  # Debug statement
        processed_corpus.append(tokens)
    return processed_corpus

def calculate_tf_icf(sentence_terms: List[List[str]]) -> dict:
    """
    Calculates TF-ICF scores for each term in the corpus.
    """
    all_terms = [term for sentence in sentence_terms for term in sentence]
    term_freq = Counter(all_terms)
    print("Term Frequencies:", term_freq)  # Debug statement

    total_terms = len(all_terms)
    tf = {term: count / total_terms for term, count in term_freq.items()}

    total_sentences = len(sentence_terms)
    term_in_sentences = Counter(term for sentence in sentence_terms for term in set(sentence))
    icf = {
        term: math.log((1 + total_sentences) / (1 + count)) + 1
        for term, count in term_in_sentences.items()
    }

    tf_icf = {term: tf[term] * icf[term] for term in tf}
    print("TF-ICF Scores:", tf_icf)  # Debug statement

    return tf_icf

def distribute_bins(scores: List[float], percentages: List[int]) -> List[int]:
    """
    Assigns bin numbers to scores based on specified percentage thresholds.
    Higher scores receive lower bin numbers.
    """
    total = len(scores)
    bin_sizes = [int(total * (p / 100)) for p in percentages]
    bin_sizes[-1] += total - sum(bin_sizes)  # Adjust for any rounding issues

    bins = []
    for bin_num, size in enumerate(bin_sizes, start=1):
        bins.extend([bin_num] * size)

    return bins

# ------------------------------------------------------------------------------
# Startup Event: Load Pre-trained Model
# ------------------------------------------------------------------------------

@app.on_event("startup")
def initialize_model():
    """
    Loads the pre-trained Word2Vec model when the application starts.
    """
    try:
        print("Loading Word2Vec model...")
        app.state.word2vec = api.load("word2vec-google-news-300")
        print("Model loaded successfully.")
    except Exception as e:
        raise RuntimeError(f"Failed to load Word2Vec model: {e}")

# ------------------------------------------------------------------------------
# API Endpoint
# ------------------------------------------------------------------------------

@app.post("/api/embeddings", response_model=List[TermData])
def generate_embeddings(request: EmbeddingRequest):
    input_text = request.text.strip()
    if not input_text:
        raise HTTPException(status_code=400, detail="Input text cannot be empty.")

    sentences = nltk.sent_tokenize(input_text)
    if not sentences:
        raise HTTPException(status_code=400, detail="No valid sentences found.")

    # Process text: tokenize and filter
    terms_per_sentence = tokenize_and_filter(sentences)

    # Compute TF-ICF scores
    tf_icf = calculate_tf_icf(terms_per_sentence)
    if not tf_icf:
        raise HTTPException(status_code=400, detail="No valid terms after processing.")

    # Sort terms by TF-ICF score in descending order
    sorted_terms = dict(sorted(tf_icf.items(), key=lambda item: item[1], reverse=True))
    print(f"Top TF-ICF Terms: {sorted_terms}")  # Debug statement

    # Select top 500 terms
    top_terms = list(sorted_terms.keys())[:500]
    print(f"Selected Top Terms ({len(top_terms)}): {top_terms}")  # Debug statement
    if not top_terms:
        raise HTTPException(status_code=400, detail="No terms available for processing.")

    # Normalize TF-ICF scores
    sum_scores = sum(sorted_terms[term] for term in top_terms)
    if sum_scores == 0:
        raise HTTPException(status_code=400, detail="Normalization failed due to zero sum of scores.")

    normalized_scores = {term: sorted_terms[term] / sum_scores for term in top_terms}
    print(f"Normalized Scores: {normalized_scores}")  # Debug statement

    # Assign bins based on normalized scores
    scores = [normalized_scores[term] for term in top_terms]
    bin_percentages = [30, 30, 25, 10, 5]  # Bins 1 to 5
    bins = distribute_bins(scores, bin_percentages)
    print(f"Assigned Bins: {bins}")  # Debug statement

    # Retrieve embeddings
    model = app.state.word2vec
    embeddings = []
    missing = []
    for term in top_terms:
        if term in model:
            embeddings.append(model[term])
        else:
            missing.append(term)
            embeddings.append(np.zeros(model.vector_size))  # Placeholder for missing terms

    embeddings = np.array(embeddings)
    print(f"Embeddings Shape: {embeddings.shape}")  # Debug statement

    if embeddings.size == 0:
        raise HTTPException(status_code=400, detail="No embeddings found.")

    if missing:
        print(f"Missing Embeddings for: {missing}")  # Debug statement

    # Dimensionality reduction with UMAP
    num_terms = embeddings.shape[0]
    if num_terms < 2:
        raise HTTPException(status_code=400, detail="Insufficient terms for dimensionality reduction.")

    neighbors = min(15, num_terms - 1)
    try:
        reducer = umap.UMAP(
            n_components=2,
            random_state=42,
            min_dist=0.6,
            spread=1.2,
            n_neighbors=neighbors
        )
        reduced = reducer.fit_transform(embeddings)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"UMAP reduction failed: {e}")

    print(f"Reduced Embeddings Shape: {reduced.shape}")  # Debug statement

    # Scale coordinates to fit a 2560x1600 layout
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled = scaler.fit_transform(reduced)
    scaled[:, 0] *= 2560  # Scale x-axis
    scaled[:, 1] *= 1600  # Scale y-axis

    # Compile the final term data
    term_data = []
    for term, x, y, bin_num, score in zip(top_terms, scaled[:, 0], scaled[:, 1], bins, scores):
        term_info = TermData(
            term=term,
            x=float(x),
            y=float(y),
            group=int(bin_num),
            score=float(score)
        )
        term_data.append(term_info)

    return term_data

# ------------------------------------------------------------------------------
# Application Entry Point
# ------------------------------------------------------------------------------

if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
