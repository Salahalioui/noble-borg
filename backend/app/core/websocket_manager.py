import json
import asyncio
from typing import Dict, Set, Any
from fastapi import WebSocket

class WebSocketManager:
    """Manages connected frontend WebSocket clients and topic-based pub/sub routing."""
    
    def __init__(self):
        # All active connections
        self.active_connections: Set[WebSocket] = set()
        # Topic subscriptions: {topic: {WebSocket, ...}}
        self.subscriptions: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.add(websocket)

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            self.active_connections.discard(websocket)
            for topic, subscribers in self.subscriptions.items():
                subscribers.discard(websocket)

    async def subscribe(self, websocket: WebSocket, topic: str):
        async with self._lock:
            if topic not in self.subscriptions:
                self.subscriptions[topic] = set()
            self.subscriptions[topic].add(websocket)

    async def unsubscribe(self, websocket: WebSocket, topic: str):
        async with self._lock:
            if topic in self.subscriptions:
                self.subscriptions[topic].discard(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients."""
        payload = json.dumps(message)
        disconnected = set()
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except Exception:
                disconnected.add(connection)
                
        if disconnected:
            for conn in disconnected:
                await self.disconnect(conn)

    async def publish_to_topic(self, topic: str, data: Dict[str, Any]):
        """Publish a message to all subscribers of a specific topic."""
        message = {
            "topic": topic,
            "data": data
        }
        payload = json.dumps(message)
        
        async with self._lock:
            subscribers = self.subscriptions.get(topic, set()).copy()
            
        disconnected = set()
        for connection in subscribers:
            try:
                await connection.send_text(payload)
            except Exception:
                disconnected.add(connection)
                
        if disconnected:
            for conn in disconnected:
                await self.disconnect(conn)

ws_manager = WebSocketManager()
