
from dotenv import load_dotenv
load_dotenv()
import os

from tavily import TavilyClient
from groq import Groq

tavily = TavilyClient(api_key=os.getenv("TAVILY_API_KEY"))
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def web_search(query: str) -> dict:
    results = tavily.search(
        query=query,
        search_depth="advanced",
        max_results=5,
        include_answer=True,
        include_raw_content=False
    )
    return results

def web_search_agent(message: str, history: list = []) -> dict:
    search_results = web_search(message)
    
    sources = ""
    for i, result in enumerate(search_results.get("results", []), 1):
        sources += f"\n[{i}] {result['title']}\nURL: {result['url']}\nContent: {result['content'][:500]}\n"
    
    tavily_answer = search_results.get("answer", "")
    
    messages = [
        {
            "role": "system",
            "content": """You are an advanced Web Search Agent inside AI-OS.
You have access to real-time web search results.
Your job is to:
1. Analyze the search results thoroughly
2. Provide a comprehensive, well-structured answer
3. Always cite sources with [1], [2], etc.
4. Include key insights and latest information
5. Format response beautifully with markdown
6. Be accurate and factual"""
        },
        {
            "role": "user",
            "content": f"""User Query: {message}

Tavily AI Answer: {tavily_answer}

Web Search Results:
{sources}

Please provide a comprehensive answer based on these real-time search results. 
Cite sources using [1], [2], etc. Format nicely with markdown."""
        }
    ]
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=4096,
        temperature=0.3
    )
    
    formatted_sources = "\n\n---\n**🔗 Sources:**\n"
    for i, result in enumerate(search_results.get("results", []), 1):
        formatted_sources += f"\n[{i}] [{result['title']}]({result['url']})"
    
    final_response = response.choices[0].message.content + formatted_sources
    
    return {
        "response": final_response,
        "agent_used": "search",
        "tokens_used": response.usage.total_tokens,
        "sources_count": len(search_results.get("results", []))
    }