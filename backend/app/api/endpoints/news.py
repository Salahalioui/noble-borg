from fastapi import APIRouter, Query
from app.services.news_service import news_service

router = APIRouter()

@router.get("/feed")
async def get_news_feed(
    query: str = Query("stock market crypto", description="Search query or ticker"),
    limit: int = Query(15, le=50)
):
    """Fetch real-time financial news with automated sentiment tagging."""
    news = await news_service.get_google_news(query=query, limit=limit)
    return {"query": query, "count": len(news), "news": news}

@router.get("/reddit")
async def get_reddit_buzz(
    subreddit: str = Query("wallstreetbets", description="Subreddit: wallstreetbets, cryptocurrency, stocks"),
    limit: int = Query(10, le=30)
):
    """Fetch retail social sentiment and hot posts from Reddit."""
    posts = await news_service.get_reddit_buzz(subreddit=subreddit, limit=limit)
    return {"subreddit": subreddit, "count": len(posts), "posts": posts}

@router.get("/fear-and-greed")
async def get_fear_and_greed():
    """Fetch Crypto Fear & Greed Index."""
    fng = await news_service.get_fear_and_greed_index()
    return fng
