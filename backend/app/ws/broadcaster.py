import json
import asyncio
from typing import Set
from fastapi import WebSocket

class WebSocketBroadcaster:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, event_type: str, data: dict):
        if not self.active_connections:
            return
        
        payload = json.dumps({"type": event_type, "data": data})
        disconnected = set()
        
        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except Exception:
                disconnected.add(connection)
                
        for conn in disconnected:
            self.active_connections.remove(conn)

broadcaster = WebSocketBroadcaster()
