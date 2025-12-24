# main.py

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import json
import uuid
import sqlite3
import traceback
from dotenv import load_dotenv

# LangChain imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory

# -------------------------------
# Load environment variables
# -------------------------------
load_dotenv()  # loads variables from .env
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in .env")

os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

# -------------------------------
# FastAPI setup
# -------------------------------
app = FastAPI(title="StudyBuddy Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FileInfo(BaseModel):
    name: str
    type: str  # 'file' or 'link'

class UserMessage(BaseModel):
    id: Optional[str] = None
    role: str
    content: str
    subject: Optional[str] = None
    files: Optional[List[FileInfo]] = []

# -------------------------------
# SQLite persistent chat memory
# -------------------------------
DB_PATH = "chat_history.db"
conn = sqlite3.connect(DB_PATH, check_same_thread=False)
c = conn.cursor()
c.execute("""
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    role TEXT,
    content TEXT,
    subject TEXT,
    files TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")
conn.commit()

def save_message(id: str, role: str, content: str, subject: Optional[str], files: Optional[List[FileInfo]]):
    files_json = json.dumps([f.dict() for f in files]) if files else None
    c.execute(
        "INSERT INTO messages (id, role, content, subject, files) VALUES (?, ?, ?, ?, ?)",
        (id, role, content, subject, files_json)
    )
    conn.commit()

# -------------------------------
# LangChain setup
# -------------------------------

# 1️⃣ Gemini model (free)
gemini_model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=GOOGLE_API_KEY,
    temperature=0.7,
    max_output_tokens=512,
    convert_system_message_to_human=True
)

# 2️⃣ Embeddings + FAISS
EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
embedding_model = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)

FAISS_INDEX_DIR = "faiss_index"
if os.path.exists(FAISS_INDEX_DIR):
    vectorstore = FAISS.load_local(
        FAISS_INDEX_DIR, 
        embedding_model,
        allow_dangerous_deserialization=True
    )
else:
    # Initialize with a dummy text since FAISS needs at least one embedding
    vectorstore = FAISS.from_texts(["initialization"], embedding_model)

# 3️⃣ Conversation memory
memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)

# 4️⃣ RAG chain
# 4️⃣ RAG chain
# Custom prompt for RAG to allow general knowledge fallback
rag_prompt_template = """You are StudyBuddy, an AI tutor assistant.
Use the following pieces of context to answer the question at the end.
If the answer is not in the context, answer the question using your own general knowledge.

Context:
{context}

Question: {question}

Assistant:"""

rag_prompt = PromptTemplate(
    template=rag_prompt_template, input_variables=["context", "question"]
)

rag_chain = ConversationalRetrievalChain.from_llm(
    llm=gemini_model,
    retriever=vectorstore.as_retriever(search_kwargs={"k": 4}),
    memory=memory,
    combine_docs_chain_kwargs={"prompt": rag_prompt}
)

# 5️⃣ Prompt template
# 5️⃣ Prompt template
PROMPT_TEMPLATE = """
Subject: {subject}
Files/Links Info: {files_info}
User Message: {user_message}

Instructions: 
- Be concise and friendly
- Answer as if you are tutoring the user
"""
prompt_template = PromptTemplate(
    input_variables=["subject", "files_info", "user_message"],
    template=PROMPT_TEMPLATE
)

def generate_prompt(user_message: UserMessage):
    files_info = json.dumps([f.dict() for f in user_message.files]) if user_message.files else "None"
    return prompt_template.format(
        subject=user_message.subject or "General",
        files_info=files_info,
        user_message=user_message.content
    )

# -------------------------------
# Endpoints
# -------------------------------

@app.post("/send")
def send_message(msg: UserMessage):
    try:
        msg.id = msg.id or str(uuid.uuid4())
        # Save user message
        save_message(msg.id, msg.role, msg.content, msg.subject, msg.files)

        # Generate prompt
        final_prompt = generate_prompt(msg)

        # Run RAG chain
        # ConversationalRetrievalChain expects 'question' key
        result = rag_chain.invoke({"question": final_prompt})
        response = result['answer']

        # Save assistant response
        assistant_id = str(uuid.uuid4())
        save_message(assistant_id, "assistant", response, msg.subject, None)

        return {"response": response}
    except Exception as e:
        print(f"Error processing request: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/history")
def get_history(limit: int = 20):
    c.execute(
        "SELECT id, role, content, subject, files, timestamp FROM messages ORDER BY timestamp DESC LIMIT ?",
        (limit,)
    )
    rows = c.fetchall()
    history = [
        {
            "id": row[0],
            "role": row[1],
            "content": row[2],
            "subject": row[3],
            "files": json.loads(row[4]) if row[4] else [],
            "timestamp": row[5]
        } for row in rows
    ]
    return {"history": history[::-1]}
