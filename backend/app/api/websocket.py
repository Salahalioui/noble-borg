import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket_manager import ws_manager

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Multiplexed WebSocket endpoint.
    Clients can send JSON commands:
    - {"action": "subscribe", "topic": "crypto:btcusdt"}
    - {"action": "unsubscribe", "topic": "crypto:btcusdt"}
    - {"action": "subscribe", "topic": "depth:btcusdt"}
    - {"action": "subscribe", "topic": "signals"}
    """
    await ws_manager.connect(websocket)
    try:
        # Send initial connection acknowledgment
        await websocket.send_json({"type": "connection", "status": "connected", "message": "Connected to Trading Command Centre WS Hub"})
        
        while True:
            raw_text = await websocket.receive_text()
            try:
                cmd = json.loads(raw_text)
                action = cmd.get("action")
                topic = cmd.get("topic")
                
                if action == "subscribe" and topic:
                    await ws_manager.subscribe(websocket, topic)
                    await websocket.send_json({"type": "subscription", "status": "subscribed", "topic": topic})
                elif action == "unsubscribe" and topic:
                    await ws_manager.unsubscribe(websocket, topic)
                    await websocket.send_json({"type": "subscription", "status": "unsubscribed", "topic": topic})
                elif action == "ping":
                    await websocket.send_json({"type": "pong"})
            except json.JSONDecodeError:
                pass
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as e:
        print(f"[WebSocket] Error: {e}")
        await ws_manager.disconnect(websocket)
