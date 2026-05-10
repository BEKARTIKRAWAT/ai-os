from dotenv import load_dotenv
load_dotenv()
import os
import PyPDF2
from groq import Groq

def get_client():
    load_dotenv()
    return Groq(api_key=os.getenv("GROQ_API_KEY"))

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    ext = filename.split(".")[-1].lower()
    
    if ext == "pdf":
        import io
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    
    elif ext in ["txt", "md", "py", "js", "ts", "html", "css", "json", "csv"]:
        return file_bytes.decode("utf-8", errors="ignore")
    
    else:
        return f"File type .{ext} supported nahi hai abhi."

def analyze_file(file_bytes: bytes, filename: str, user_question: str = "") -> dict:
    client = get_client()
    content = extract_text_from_file(file_bytes, filename)
    
    if not content.strip():
        return {"response": "File empty hai ya read nahi ho saki!", "agent_used": "file", "tokens_used": 0}
    
    if len(content) > 8000:
        content = content[:8000] + "\n\n... [File bahut badi hai]"
    
    ext = filename.split(".")[-1].lower()
    file_type = {
        "pdf": "PDF Document",
        "py": "Python Code",
        "js": "JavaScript Code",
        "ts": "TypeScript Code",
        "json": "JSON Data",
        "csv": "CSV Data"
    }.get(ext, "Text File")

    question = user_question if user_question else "Is file ka comprehensive analysis karo."

    messages = [
        {
            "role": "system",
            "content": f"""You are an expert file analyzer inside AI-OS.
You have been given a {file_type} to analyze.
Provide extremely detailed, structured, and insightful analysis.
Format your response with proper markdown."""
        },
        {
            "role": "user", 
            "content": f"""File name: {filename}
File content:
{content}

User question: {question}"""
        }
    ]
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=4096,
        temperature=0.3
    )
    
    return {
        "response": response.choices[0].message.content,
        "agent_used": "file",
        "tokens_used": response.usage.total_tokens,
        "file_info": {
            "name": filename,
            "type": file_type,
            "size": len(file_bytes),
            "chars": len(content)
        }
    }