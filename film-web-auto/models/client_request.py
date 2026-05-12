from sqlalchemy import Column, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from database.connection import Base


class ClientRequest(Base):
    __tablename__ = "client_requests"
    
    id = Column(String(256), primary_key=True)
    workspace = Column(String(64), nullable=True, index=True)
    status = Column(String(32), nullable=True, index=True)
    desc = Column(Text, nullable=True)
    system = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    chat_deleted = Column(Boolean, nullable=True, default=False)
    
    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "workspace": self.workspace,
            "status": self.status,
            "desc": self.desc,
            "system": self.system,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "chat_deleted": self.chat_deleted
        }
